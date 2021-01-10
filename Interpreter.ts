import { exec, ExecException } from "child_process";
import * as fs from "fs";
import * as ex from "./Expr";
import {AstPrinter} from "./AstPrinter"
import {Token, SVS, TokenType} from "./svs"
import * as st from "./Stmt"
import { Environment } from "./Environment";
import {SVSCallable, SVSFunction} from "./SVSCallable";
import { callbackify } from "util";
import * as readline from "readline-sync";

export class RuntimeError
{
        token : Token;
        message : string;

        constructor(token : Token, message : string)
        {
            this.token = token;
            this.message = message;
        }
}

export class Return
{
    value : Object;

    constructor(value : Object)
    {
        this.value = value;
    }
}

export class Interpreter implements ex.Visitor<Object>, st.Visitor<void>
{

    globals : Environment = new Environment();  
    private environment : Environment = this.globals;

    creator : SVS;

    constructor(creator : SVS)
    {
        this.creator = creator;

        this.globals.define("clock", {
            kind : "callable",
            arity() : number {return 0;},

            call(interpreter : Interpreter, args : Object[]) : Object
            {
                return Date.now();
            },
            
            toString() : string {return "<native fn>"}
        } as SVSCallable);

        this.globals.define("input", {
            kind : "callable",
            arity() : number {return 0;},

            call(interpreter : Interpreter, args : Object[]) : Object
            {
                return readline.question("");
            },
            
            toString() : string {return "<native fn>"}
        } as SVSCallable);
    }

    interpret(expression : st.Stmt[])
    {
        try
        {   
            expression.forEach((statement : st.Stmt)=>
            {
                this.execute(statement);
            });
        }
        catch(e)
        {
            this.creator.runtimeError(e);
        }
    }

    private execute(stmt : st.Stmt)
    {
        stmt.accept(this);
    }

    executeBlock(statements : st.Stmt[], environment : Environment)
    {
        let previous : Environment = this.environment;
        try {
            this.environment = environment;

            statements.forEach((statement : st.Stmt)=>{
                this.execute(statement);
            });
        }
        finally 
        {
            this.environment = previous;
        }
    }

    private evaluate(expr : ex.Expr) : Object
    {
        return expr.accept(this);
    }

    private isTruthy(object : Object) : boolean
    {
        if (object === null) return false;
        if (typeof object == 'boolean') return <boolean>object;
        return true;
    }

    private isEqual(a : Object, b : Object) : boolean
    {
        if (a === null && b === null) return true;
        if (a === null) return false;
        
        return a == b;
    }

    private stringify(object : Object) : string
    {
        if (object == null) return "null";

        if (typeof object == 'number')
        {
            let text : string = object.toString();
            if (text.endsWith(".0"))
            {
                text = text.substring(0, text.length - 2);
            }
            return text;
        }

        return object.toString();
    }

    private checkNumberOperand(operator : Token, operand : Object)
    {
        if (typeof operand == 'number') return;
        throw new RuntimeError(operator, "Operand must be a number.");
    }

    private checkNumberOperands(operator : Token, left : Object, right : Object)
    {
        if (typeof left == 'number' && typeof right == 'number') return;
        throw new RuntimeError(operator, "Operands must be a number.");
    }

    visitReturnStmt(stmt : st.Return)
    {
        let value : Object = null;
        if(stmt.value != null) value = this.evaluate(stmt.value);

        throw new Return(value);
    }

    visitFuncStmt(stmt : st.Func)
    {
        let func = new SVSFunction(stmt, this.environment);
        this.environment.define(stmt.name.lexeme, func);
        return null;
    }

    visitCallExpr(expr : ex.Call) : Object
    {
        let callee : Object = this.evaluate(expr.callee);

        let args : Object[] = [];

        expr.args.forEach((argument : ex.Expr)=>{
            args.push(this.evaluate(argument));
        });

        if(!((<SVSCallable>callee).kind == "callable"))
        {
            throw new RuntimeError(expr.paren,
                "Can only call functions and classes.");
        }

        let func : SVSCallable = <SVSCallable>callee;
        if(args.length != func.arity())
        {
            throw new RuntimeError(expr.paren, "Expected " +
            func.arity() + " arguments but got " +
            args.length + ".");
        }
        return func.call(this, args);
    }

    visitWhileStmt(stmt : st.While) 
    {
        while(this.isTruthy(this.evaluate(stmt.condition)))
        {
            this.execute(stmt.body);
        }
        return null;
    }

    visitLogicalExpr(expr : ex.Logical) : Object
    {
        let left : Object = this.evaluate(expr.left);

        if(expr.operator.type == TokenType.OR)
        {
            if(this.isTruthy(left)) return left;
        }
        else
        {
            if(!this.isTruthy(left)) return left;
        }

        return this.evaluate(expr.right);
    }

    visitIfStmt(stmt : st.If)
    {
        if (this.isTruthy(this.evaluate(stmt.condition)))
        {
            this.execute(stmt.thenBranch);
        }
        else if (stmt.elseBranch != null)
        {
            this.execute(stmt.elseBranch);
        }

        return null;
    }

    visitBlockStmt(stmt : st.Block)
    {
        this.executeBlock(stmt.statements, new Environment(this.environment));
        return null;
    }

    visitAssignExpr(expr : ex.Assign) : Object
    {
        let value : Object = this.evaluate(expr.value);
        this.environment.assign(expr.name, value);
        return value;
    }

    visitVarStmt(stmt : st.Var)
    {
        let value : Object = null;
        if(stmt.initializer != null)
        {
            value = this.evaluate(stmt.initializer);
            
        }

        this.environment.define(stmt.name.lexeme, value);
        return null;
    }
    
    visitVariableExpr(expr : ex.Variable) : Object
    {
        return this.environment.get(expr.name);
    }

    visitExpressionStmt(stmt : st.Expression)
    {
        this.evaluate(stmt.expression);
        return null;
    }

    visitPrintStmt(stmt : st.Print)
    {
        let value : Object = this.evaluate(stmt.expression);
        console.log(this.stringify(value));
        return null;
    }

    visitLiteralExpr(expr : ex.Literal) : Object
    {
        return expr.value;
    }

    visitGroupingExpr(expr : ex.Grouping) : Object
    {
        return this.evaluate(expr.expression);
    }

    visitUnaryExpr(expr : ex.Unary) : Object
    {
        let right : Object = this.evaluate(expr.right);

        switch(expr.operator.type)
        {
            case TokenType.BANG:
                return !this.isTruthy(right);
            case TokenType.MINUS:
                this.checkNumberOperand(expr.operator, right);
                return -right;
        }

        return null;
    }

    visitBinaryExpr(expr : ex.Binary) : Object
    {
        let left : Object = this.evaluate(expr.left);
        let right : Object = this.evaluate(expr.right);

        switch(expr.operator.type)
        {
            case TokenType.MINUS:
                this.checkNumberOperands(expr.operator, left, right);
                return <number>left - <number>right;
            case TokenType.SLASH:
                this.checkNumberOperands(expr.operator, left, right);
                return <number>left / <number>right;
            case TokenType.STAR:
                this.checkNumberOperands(expr.operator, left, right);
                return <number>left * <number>right;
            case TokenType.PLUS:
                if(typeof left == 'number' && typeof right == 'number')
                {
                    return <number>left + <number>right;
                }
                if(typeof left == 'string' && typeof right == 'string')
                {
                    return <string>left + <string>right;
                }
                throw new RuntimeError(expr.operator,
                    "Operands must be two numbers or two strings.");
            case TokenType.GREATER:
                this.checkNumberOperands(expr.operator, left, right);
                return <number>left > <number>right;
            case TokenType.GREATER_EQUAL:
                this.checkNumberOperands(expr.operator, left, right);
                return <number>left >= <number>right;
            case TokenType.LESS:
                this.checkNumberOperands(expr.operator, left, right);
                return <number>left < <number>right;
            case TokenType.LESS_EQUAL:
                this.checkNumberOperands(expr.operator, left, right);
                return <number>left <= <number>right;
            case TokenType.BANG_EQUAL: return !this.isEqual(left, right);
            case TokenType.EQUAL_EQUAL: return this.isEqual(left, right);
        }

        return null;
    }
    
}