import { ExecException } from "child_process";
import * as fs from "fs";
import * as ex from "./Expr";
import {AstPrinter} from "./AstPrinter"
import {Token, SVS, TokenType} from "./svs"

export class Scanner
{
    creator : SVS;

    private source : string;
    private tokens : Token[] = [];

    private start : number = 0;
    private current : number = 0;
    private line : number = 0;

    constructor(source : string, creator : SVS){
        this.source = source;
        this.creator = creator;
    }

    private keywords = {
        "and" : TokenType.AND,
        "class" : TokenType.CLASS,
        "else" : TokenType.ELSE,
        "false" : TokenType.FALSE,
        "for" : TokenType.FOR,
        "func" : TokenType.FUN,
        "if" : TokenType.IF,
        "null" : TokenType.NULL,
        "or" : TokenType.OR,
        "print" : TokenType.PRINT,
        "return" : TokenType.RETURN,
        "super" : TokenType.SUPER,
        "this" : TokenType.THIS,
        "true" : TokenType.TRUE,
        "var" : TokenType.VAR,
        "while" : TokenType.WHILE
    }

    private isAtEnd() : boolean
    {
        return this.current >= this.source.length;
    }

    private advance() : string
    {
        this.current++;
        return this.source.charAt(this.current -1);
    }

    private match(expected : string) : boolean
    {
        if (this.isAtEnd()) return false;
        if (this.source.charAt(this.current) != expected) return false;
        
        this.current++;
        return true;
    }

    private peek() : string
    {
        if (this.isAtEnd()) return '\0';
        return this.source.charAt(this.current);
    }

    private peekNext() : string
    {
        if (this.current + 1 >= this.source.length) return '\0';
        return this.source.charAt( this.current +1);
    }

    private string()
    {
        while(this.peek() !== '"' &&  !this.isAtEnd())
        {
            if (this.peek() === '\n') this.line++;
            this.advance();
        }

        if (this.isAtEnd())
        {
            this.creator.error(this.line, "Unterminated string.");
            return;
        }

        this.advance();

        let value : string = this.source.substring(this.start + 1, this.current - 1);
        this.addToken(TokenType.STRING, value);
    }

    private isDigit(c : string) : boolean
    {
        return c >= '0' && c <= '9';
    }

    private number()
    {
        while(this.isDigit(this.peek())) this.advance();

        if (this.peek() === '.' && this.isDigit(this.peekNext()))
        {
            this.advance();
            while(this.isDigit(this.peek())) this.advance();
        }

        this.addToken(TokenType.NUMBER, parseFloat( this.source.substring(this.start, this.current) ));
    }

    private identifier()
    {
        while (this.isAlphaNumeric(this.peek())) this.advance();

        let text : string = this.source.substring(this.start, this.current);
        let type : TokenType = this.keywords[text];

        if (type == null) type = TokenType.IDENTIFIER;

        this.addToken(type, null);
    }

    private isAlpha(c : string) : boolean
    {
        return ( c >= 'a' && c <= 'z') ||
                (c >= 'A' && c <= 'Z') ||
                c  == '_'
    }

    private isAlphaNumeric(c : string) : boolean
    {
        return this.isAlpha(c) || this.isDigit(c);
    }

    private addToken(type : TokenType, literal : Object)
    {
        let text : string = this.source.substring(this.start, this.current);
        this.tokens.push( new Token(type, text, literal, this.line));
    }

    private scanToken() : Token
    {
        let c : string = this.advance();
        switch(c)
        {
            case '(': this.addToken(TokenType.LEFT_PAREN, null); break;
            case ')': this.addToken(TokenType.RIGHT_PAREN, null); break;
            case '{': this.addToken(TokenType.LEFT_BRACE, null); break;
            case '}': this.addToken(TokenType.RIGHT_BRACE, null); break;
            case ',': this.addToken(TokenType.COMMA, null); break;
            case '.': this.addToken(TokenType.DOT, null); break;
            case '-': this.addToken(TokenType.MINUS, null); break;
            case '+': this.addToken(TokenType.PLUS, null); break;
            case ';': this.addToken(TokenType.SEMICOLON, null); break;
            case '*': this.addToken(TokenType.STAR, null); break; 

            case '!':
                this.addToken(this.match('=') ? TokenType.BANG_EQUAL : TokenType.BANG, null);
                break;
            case '=':
                this.addToken(this.match('=') ? TokenType.EQUAL_EQUAL : TokenType.EQUAL, null);
                break;
            case '<':
                this.addToken(this.match('=') ? TokenType.LESS_EQUAL : TokenType.LESS, null);
                break;
            case '>':
                this.addToken(this.match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER, null);
                break;
            case '/':
                if (this.match('/'))
                {
                    //comment
                    while(this.peek() != '\n' && !this.isAtEnd()) this.advance();
                }
                else
                {
                    this.addToken(TokenType.SLASH, null);
                }
                break;
            
            //whitespace
            case ' ':
            case '\r':
            case '\t':
                break;

            case '\n':
                this.line++;
                break;

            case '"': this.string(); break;
            
            default:
                if(this.isDigit(c))
                {
                    this.number();
                }
                else if (this.isAlpha(c))
                {
                    this.identifier();
                }
                else
                {
                    this.creator.error(this.line, "Unexpected character.");
                }
                break;
        }

        return;
    }

    scanTokens() : Token[]
    {
        
        while(!this.isAtEnd())
        {
            this.start = this.current;
            this.scanToken();
        }
        
        this.tokens.push( new Token(TokenType.EOF, "", null, this.line));

        return this.tokens;
    }
}