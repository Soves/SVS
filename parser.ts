import { ExecException } from "child_process";
import * as fs from "fs";
import * as ex from "./Expr";
import {AstPrinter} from "./AstPrinter"
import {Token, SVS, TokenType} from "./svs"
import * as st from "./Stmt"
import { match } from "assert";
import { EventLoopUtilization } from "perf_hooks";
export class ParseError
{
        
}

export class Parser
{

    tokens : Token[];
    private current : number = 0;
    private creator : SVS;

    constructor(tokens : Token[], creator : SVS)
    {
        this.tokens = tokens;
        this.creator = creator;
    }

    parse() : st.Stmt[]
    {
        let statements : st.Stmt[] = [];

        while(!this.isAtEnd())
        {
            statements.push(this.declaration());
        }

        return statements;
        /*
        try{
            return this.expression();
        }
        catch(error)
        {
            //console.log(error);
            return null;
        }*/
    }
    

    private declaration() : st.Stmt
    {
        try{
            if (this.match(TokenType.FUN)) return this.function("function");
            if(this.match(TokenType.VAR)) return this.varDeclaration();

            return this.statement();
        }
        catch(e)
        {
            this.synchronize();
            return null;
        }
    }

    private varDeclaration() : st.Stmt
    {
        let name : Token = this.consume(TokenType.IDENTIFIER, "Expect variable name.");

        let initializer : ex.Expr = null;

        if(this.match(TokenType.EQUAL))
        {
            initializer = this.expression();
        }

        this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");
        return new st.Var(name, initializer);
    }

    private statement() : st.Stmt
    {
        if(this.match(TokenType.FOR)) return this.forStatement();
        if(this.match(TokenType.IF)) return this.ifStatement();
        if(this.match(TokenType.PRINT)) return this.printStatement();
        if(this.match(TokenType.RETURN)) return this.returnStatement();
        if(this.match(TokenType.WHILE)) return this.whileStatement();
        if(this.match(TokenType.LEFT_BRACE)) return new st.Block(this.block());

        return this.expressionStatement();
    }

    private assignment() : ex.Expr
    {
        let expr : ex.Expr = this.or();

        if(this.match(TokenType.EQUAL))
        {
            let equals : Token = this.previous();
            let value : ex.Expr = this.assignment();

            if(expr instanceof ex.Variable)
            {
                let name : Token = (<ex.Variable>expr).name;
                return new ex.Assign(name , value);
            }

            this.error(equals, "Invalid assignment target.");
        }

        return expr;
    }

    private function(kind : string) : st.Func
    {
        let name : Token = this.consume(TokenType.IDENTIFIER, "Expect " + kind + " name.");
        this.consume(TokenType.LEFT_PAREN, "Expect '(' after " + kind + " name");
        let parameters : Token[] = [];
        if(!this.check(TokenType.RIGHT_PAREN))
        {
            do
            {
                if(parameters.length >= 255)
                {
                    this.error(this.peek(), "Can't have more than 255 parameters.");
                }

                parameters.push(this.consume(TokenType.IDENTIFIER, "Expect parameter name."));
            }
            while(this.match(TokenType.COMMA));
        }

        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after parameters.");
        this.consume(TokenType.LEFT_BRACE, "Expect '{' before " + kind + " body.");
        let body : st.Stmt[] = this.block();
        return new st.Func(name, parameters, body);
    }

    private returnStatement() : st.Stmt
    {
        let keyword : Token = this.previous();
        let value : ex.Expr = null;

        if (!this.check(TokenType.SEMICOLON))
        {
            value = this.expression();
        }

        this.consume(TokenType.SEMICOLON, "Expect ';' after return value.");
        return new st.Return(keyword, value);
    }

    private forStatement() : st.Stmt
    {
        this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'for'.");

        let initializer : st.Stmt;
        if(this.match(TokenType.SEMICOLON))
        {
            initializer = null;
        }
        else if(this.match(TokenType.VAR))
        {
            initializer = this.varDeclaration();
        }
        else
        {
            initializer = this.expressionStatement();
        }

        let condition : ex.Expr = null;
        if(!this.check(TokenType.SEMICOLON))
        {
            condition = this.expression();
        }

        this.consume(TokenType.SEMICOLON, "Expect ';' after loop condition.");

        let increment : ex.Expr = null;
        if(!this.check(TokenType.RIGHT_PAREN))
        {
            increment = this.expression();
        }
        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after for clauses.");

        let body : st.Stmt = this.statement();

        if (increment != null)
        {
            body = new st.Block([body, new st.Expression(increment)]);
        }

        if (condition === null) condition = new ex.Literal(true);
        body = new st.While(condition, body);

        if (initializer != null)
        {
            body = new st.Block([initializer, body]);
        }
        
        return body;
    }

    private whileStatement() : st.Stmt
    {
        this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'while'.");
        let condition : ex.Expr = this.expression();
        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after condition.");
        let body : st.Stmt = this.statement();

        return new st.While(condition, body);
    }

    private printStatement() : st.Stmt
    {
        let value : ex.Expr = this.expression();
        this.consume(TokenType.SEMICOLON, "Expect ;  after value.");
        return new st.Print(value);
    }

    private expressionStatement() : st.Stmt
    {
        let expr : ex.Expr = this.expression();
        this.consume(TokenType.SEMICOLON, "Expect ; after expression.");
        return new st.Expression(expr);
    }

    private peek() : Token
    {
        return this.tokens[this.current];
    }

    private previous() : Token
    {
        return this.tokens[this.current-1];
    }

    private isAtEnd()
    {
        return this.peek().type == TokenType.EOF;
    }

    private advance() : Token
    {
        if(!this.isAtEnd()) this.current++;
        return this.previous();
    }

    private synchronize()
    {
        this.advance();

        while(!this.isAtEnd())
        {
            if (this.previous().type == TokenType.SEMICOLON) return;

            switch(this.peek().type)
            {
                case TokenType.CLASS:
                case TokenType.FUN:
                case TokenType.VAR:
                case TokenType.FOR:
                case TokenType.IF:
                case TokenType.WHILE:
                case TokenType.PRINT:
                case TokenType.RETURN:
                    return;
            }
            this.advance();
        }
    }

    private check(type : TokenType) : boolean
    {
        if (this.isAtEnd()) return false;
        return this.peek().type == type;
    }

    private match(...types : TokenType[]) : boolean
    {
        let result : boolean = false;

        types.forEach((type : TokenType)=>{
            if(this.check(type))
            {
                this.advance();
                result = true;
            }
        });

        return result;
    }

    private and() : ex.Expr
    {
        let expr : ex.Expr = this.equality();

        while(this.match(TokenType.AND))
        {
            let operator : Token = this.previous();
            let right : ex.Expr = this.equality();
            expr = new ex.Logical(expr, operator, right);
        }

        return expr;
    }

    private or() : ex.Expr
    {
        let expr : ex.Expr = this.and();

        while(this.match(TokenType.OR))
        {
            let operator : Token = this.previous();
            let right : ex.Expr = this.and();
            expr = new ex.Logical(expr, operator, right);
        }

        return expr;
    }

    private ifStatement() : st.Stmt
    {
        this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'if'.");
        let condition : ex.Expr = this.expression();
        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after if condition");

        let thenBranch : st.Stmt = this.statement();
        let elseBranch : st.Stmt = null;

        if (this.match(TokenType.ELSE))
        {
            elseBranch = this.statement();
        };

        return new st.If(condition, thenBranch, elseBranch);
    }

    private block() : st.Stmt[]
    {
        let statements : st.Stmt[] = [];

        while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd())
        {
            statements.push(this.declaration());
        }

        this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block.");
        return statements;

    }

    private expression() : ex.Expr
    {
        return this.assignment();
    }

    private error(token : Token, message : string) : ParseError
    {
        this.creator.tokenError(token, message);
        return new ParseError();
    }

    private consume(type : TokenType, message : string) : Token
    {
        if (this.check(type)) return this.advance();

        throw this.error(this.peek(), message);
    }

    private primary() : ex.Expr
    {
        if (this.match(TokenType.FALSE))  return new ex.Literal(false);
        if (this.match(TokenType.TRUE))  return new ex.Literal(true);
        if (this.match(TokenType.NULL))  return new ex.Literal(null);

        if (this.match(TokenType.NUMBER, TokenType.STRING))
        {
            return new ex.Literal(this.previous().literal)
        }

        if (this.match(TokenType.IDENTIFIER))
        {
            return new ex.Variable(this.previous());
        }

        if (this.match(TokenType.LEFT_PAREN))
        {
            let expr : ex.Expr = this.expression();
            this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
            return new ex.Grouping(expr);
        }

        throw this.error(this.peek(), "Expect expression.");
    } 

    private finishCall(callee : ex.Expr) : ex.Expr
    {
        let args : ex.Expr[] = [];
        if(!this.check(TokenType.RIGHT_PAREN))
        {
            do
            {
                if(args.length >= 255)
                {
                    this.error(this.peek(), "Can't have more than 255 arguments.");
                }
                args.push(this.expression());
            }
            while (this.match(TokenType.COMMA));
        }

        let paren : Token = this.consume(TokenType.RIGHT_PAREN, "Expect ')' after arguments.");

        return new ex.Call(callee, paren, args);
    }

    private call() : ex.Expr
    {
        let expr : ex.Expr = this.primary();

        while(true)
        {
            if(this.match(TokenType.LEFT_PAREN))
            {
                expr = this.finishCall(expr);
            }
            else
            {
                break;
            }
        }

        return expr;
    }

    private unary() : ex.Expr
    {
        if(this.match(TokenType.BANG, TokenType.MINUS))
        {
            let operator : Token = this.previous();
            let right : ex.Expr = this.unary();
            return new ex.Unary(operator, right);
        }

        return this.call();
    }

    private factor() : ex.Expr
    {
        let expr : ex.Expr = this.unary();

        while(this.match(TokenType.SLASH, TokenType.STAR))
        {
            let operator : Token = this.previous();
            let right : ex.Expr = this.unary();
            expr = new ex.Binary(expr, operator, right);
        }

        return expr;
    }

    private term() : ex.Expr
    {
        let expr : ex.Expr = this.factor();

        while(this.match(TokenType.MINUS, TokenType.PLUS))
        {
            let operator : Token = this.previous();
            let right : ex.Expr = this.factor();
            expr = new ex.Binary(expr, operator, right);
        }

        return expr;
    }

    private comparison() : ex.Expr
    {
        let expr : ex.Expr = this.term();

        while(this.match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL))
        {
            let operator : Token = this.previous();
            let right = this.term();
            expr = new ex.Binary(expr, operator, right);
        }

        return expr;
    }

    private equality() : ex.Expr
    {
        let expr : ex.Expr = this.comparison();

        while(this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL))
        {
            let operator : Token = this.previous();
            let right : ex.Expr = this.comparison();
            expr = new ex.Binary(expr, operator, right);
        }

        return expr;
    }
}