import * as fs from "fs";
import {Parser} from "./parser"
import {Scanner} from "./scanner"
import {Interpreter, RuntimeError} from "./Interpreter"
import {Resolver} from "./resolver"
import * as st from "./Stmt"

export enum TokenType
{
    // Single-character tokens.
    LEFT_PAREN, RIGHT_PAREN, LEFT_BRACE, RIGHT_BRACE,
    COMMA, DOT, MINUS, PLUS, SEMICOLON, SLASH, STAR,

    // One or two character tokens.
    BANG, BANG_EQUAL,
    EQUAL, EQUAL_EQUAL,
    GREATER, GREATER_EQUAL,
    LESS, LESS_EQUAL,

    // Literals.
    IDENTIFIER, STRING, NUMBER,

    // Keywords.
    AND, CLASS, ELSE, FALSE, FUN, FOR, IF, NULL, OR,
    PRINT, RETURN, SUPER, THIS, TRUE, VAR, WHILE,

    EOF 
}

export class Token
{
    type : TokenType;
    lexeme : string;
    literal : Object;
    line : number;

    constructor(type : TokenType, lexeme : string, literal: object, line : number)
    {
        this.type = type;
        this.lexeme = lexeme;
        this.literal = literal;
        this.line = line;
    }

    toString() : string
    {
        return this.type + " " + this.lexeme + " " + this.literal;
    }
}



export class SVS
{

    interpreter : Interpreter = new Interpreter(this);
    hadError : boolean = false;
    hadRuntimeError :boolean = false;

    private report(line : number, where : string, message : string)
    {
        console.log("[line " + line + "] Error" + where + ": " + message);
        this.hadError = true;
    }

    error(line : number, message : string)
    {
        this.report(line, "", message);
    }

    tokenError(token : Token, message : string)
    {
        if (token.type == TokenType.EOF)
        {
            this.report(token.line, " at end", message);
        }
        else{
            this.report(token.line, " at " + token.lexeme + "'", message);
        }
    }

    runtimeError(error : RuntimeError)
    {
        console.log(error.message + "\n[line " + error.token.line + "]");
        this.hadRuntimeError = true;
    }

    run(source : string)
    {
        let scanner : Scanner = new Scanner(source, this);
        let tokens : Token[] = scanner.scanTokens();

        let parser : Parser = new Parser(tokens, this);
        let statements : st.Stmt[] = parser.parse();

        if(this.hadError) return;

        let resolver : Resolver = new Resolver(this.interpreter, this);
        resolver.resolve(statements);

        if(this.hadError) return;

        this.interpreter.interpret(statements);

        if(this.hadRuntimeError) return;
    }

    runFile(path : string)
    {
        fs.readFile(path, "utf8", (err, data)=>{
            this.run(data);
            this.hadError = false;
        });
    }
}
