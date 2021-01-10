"use strict";
exports.__esModule = true;
exports.Scanner = void 0;
var svs_1 = require("./svs");
var Scanner = /** @class */ (function () {
    function Scanner(source, creator) {
        this.tokens = [];
        this.start = 0;
        this.current = 0;
        this.line = 0;
        this.keywords = {
            "and": svs_1.TokenType.AND,
            "class": svs_1.TokenType.CLASS,
            "else": svs_1.TokenType.ELSE,
            "false": svs_1.TokenType.FALSE,
            "for": svs_1.TokenType.FOR,
            "fun": svs_1.TokenType.FUN,
            "if": svs_1.TokenType.IF,
            "null": svs_1.TokenType.NULL,
            "or": svs_1.TokenType.OR,
            "print": svs_1.TokenType.PRINT,
            "return": svs_1.TokenType.RETURN,
            "super": svs_1.TokenType.SUPER,
            "this": svs_1.TokenType.THIS,
            "true": svs_1.TokenType.TRUE,
            "var": svs_1.TokenType.VAR,
            "while": svs_1.TokenType.WHILE
        };
        this.source = source;
        this.creator = creator;
    }
    Scanner.prototype.isAtEnd = function () {
        return this.current >= this.source.length;
    };
    Scanner.prototype.advance = function () {
        this.current++;
        return this.source.charAt(this.current - 1);
    };
    Scanner.prototype.match = function (expected) {
        if (this.isAtEnd())
            return false;
        if (this.source.charAt(this.current) != expected)
            return false;
        this.current++;
        return true;
    };
    Scanner.prototype.peek = function () {
        if (this.isAtEnd())
            return '\0';
        return this.source.charAt(this.current);
    };
    Scanner.prototype.peekNext = function () {
        if (this.current + 1 >= this.source.length)
            return '\0';
        return this.source.charAt(this.current + 1);
    };
    Scanner.prototype.string = function () {
        while (this.peek() !== '"' && !this.isAtEnd()) {
            if (this.peek() === '\n')
                this.line++;
            this.advance();
        }
        if (this.isAtEnd()) {
            this.creator.error(this.line, "Unterminated string.");
            return;
        }
        this.advance();
        var value = this.source.substring(this.start + 1, this.current - 1);
        this.addToken(svs_1.TokenType.STRING, value);
    };
    Scanner.prototype.isDigit = function (c) {
        return c >= '0' && c <= '9';
    };
    Scanner.prototype.number = function () {
        while (this.isDigit(this.peek()))
            this.advance();
        if (this.peek() === '.' && this.isDigit(this.peekNext())) {
            this.advance();
            while (this.isDigit(this.peek()))
                this.advance();
        }
        this.addToken(svs_1.TokenType.NUMBER, parseFloat(this.source.substring(this.start, this.current)));
    };
    Scanner.prototype.identifier = function () {
        while (this.isAlphaNumeric(this.peek()))
            this.advance();
        var text = this.source.substring(this.start, this.current);
        var type = this.keywords[text];
        if (type == null)
            type = svs_1.TokenType.IDENTIFIER;
        this.addToken(type, null);
    };
    Scanner.prototype.isAlpha = function (c) {
        return (c >= 'a' && c <= 'z') ||
            (c >= 'A' && c <= 'Z') ||
            c == '_';
    };
    Scanner.prototype.isAlphaNumeric = function (c) {
        return this.isAlpha(c) || this.isDigit(c);
    };
    Scanner.prototype.addToken = function (type, literal) {
        var text = this.source.substring(this.start, this.current);
        this.tokens.push(new svs_1.Token(type, text, literal, this.line));
    };
    Scanner.prototype.scanToken = function () {
        var c = this.advance();
        switch (c) {
            case '(':
                this.addToken(svs_1.TokenType.LEFT_PAREN, null);
                break;
            case ')':
                this.addToken(svs_1.TokenType.RIGHT_PAREN, null);
                break;
            case '{':
                this.addToken(svs_1.TokenType.LEFT_BRACE, null);
                break;
            case '}':
                this.addToken(svs_1.TokenType.RIGHT_BRACE, null);
                break;
            case ',':
                this.addToken(svs_1.TokenType.COMMA, null);
                break;
            case '.':
                this.addToken(svs_1.TokenType.DOT, null);
                break;
            case '-':
                this.addToken(svs_1.TokenType.MINUS, null);
                break;
            case '+':
                this.addToken(svs_1.TokenType.PLUS, null);
                break;
            case ';':
                this.addToken(svs_1.TokenType.SEMICOLON, null);
                break;
            case '*':
                this.addToken(svs_1.TokenType.STAR, null);
                break;
            case '!':
                this.addToken(this.match('=') ? svs_1.TokenType.BANG_EQUAL : svs_1.TokenType.BANG, null);
                break;
            case '=':
                this.addToken(this.match('=') ? svs_1.TokenType.EQUAL_EQUAL : svs_1.TokenType.EQUAL, null);
                break;
            case '<':
                this.addToken(this.match('=') ? svs_1.TokenType.LESS_EQUAL : svs_1.TokenType.LESS, null);
                break;
            case '>':
                this.addToken(this.match('=') ? svs_1.TokenType.GREATER_EQUAL : svs_1.TokenType.GREATER, null);
                break;
            case '/':
                if (this.match('/')) {
                    //comment
                    while (this.peek() != '\n' && !this.isAtEnd())
                        this.advance();
                }
                else {
                    this.addToken(svs_1.TokenType.SLASH, null);
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
            case '"':
                this.string();
                break;
            default:
                if (this.isDigit(c)) {
                    this.number();
                }
                else if (this.isAlpha(c)) {
                    this.identifier();
                }
                else {
                    this.creator.error(this.line, "Unexpected character.");
                }
                break;
        }
        return;
    };
    Scanner.prototype.scanTokens = function () {
        while (!this.isAtEnd()) {
            this.start = this.current;
            this.scanToken();
        }
        this.tokens.push(new svs_1.Token(svs_1.TokenType.EOF, "", null, this.line));
        return this.tokens;
    };
    return Scanner;
}());
exports.Scanner = Scanner;
