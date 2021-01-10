"use strict";
exports.__esModule = true;
exports.SVS = exports.Token = exports.TokenType = void 0;
var fs = require("fs");
var parser_1 = require("./parser");
var scanner_1 = require("./scanner");
var Interpreter_1 = require("./Interpreter");
var TokenType;
(function (TokenType) {
    // Single-character tokens.
    TokenType[TokenType["LEFT_PAREN"] = 0] = "LEFT_PAREN";
    TokenType[TokenType["RIGHT_PAREN"] = 1] = "RIGHT_PAREN";
    TokenType[TokenType["LEFT_BRACE"] = 2] = "LEFT_BRACE";
    TokenType[TokenType["RIGHT_BRACE"] = 3] = "RIGHT_BRACE";
    TokenType[TokenType["COMMA"] = 4] = "COMMA";
    TokenType[TokenType["DOT"] = 5] = "DOT";
    TokenType[TokenType["MINUS"] = 6] = "MINUS";
    TokenType[TokenType["PLUS"] = 7] = "PLUS";
    TokenType[TokenType["SEMICOLON"] = 8] = "SEMICOLON";
    TokenType[TokenType["SLASH"] = 9] = "SLASH";
    TokenType[TokenType["STAR"] = 10] = "STAR";
    // One or two character tokens.
    TokenType[TokenType["BANG"] = 11] = "BANG";
    TokenType[TokenType["BANG_EQUAL"] = 12] = "BANG_EQUAL";
    TokenType[TokenType["EQUAL"] = 13] = "EQUAL";
    TokenType[TokenType["EQUAL_EQUAL"] = 14] = "EQUAL_EQUAL";
    TokenType[TokenType["GREATER"] = 15] = "GREATER";
    TokenType[TokenType["GREATER_EQUAL"] = 16] = "GREATER_EQUAL";
    TokenType[TokenType["LESS"] = 17] = "LESS";
    TokenType[TokenType["LESS_EQUAL"] = 18] = "LESS_EQUAL";
    // Literals.
    TokenType[TokenType["IDENTIFIER"] = 19] = "IDENTIFIER";
    TokenType[TokenType["STRING"] = 20] = "STRING";
    TokenType[TokenType["NUMBER"] = 21] = "NUMBER";
    // Keywords.
    TokenType[TokenType["AND"] = 22] = "AND";
    TokenType[TokenType["CLASS"] = 23] = "CLASS";
    TokenType[TokenType["ELSE"] = 24] = "ELSE";
    TokenType[TokenType["FALSE"] = 25] = "FALSE";
    TokenType[TokenType["FUN"] = 26] = "FUN";
    TokenType[TokenType["FOR"] = 27] = "FOR";
    TokenType[TokenType["IF"] = 28] = "IF";
    TokenType[TokenType["NULL"] = 29] = "NULL";
    TokenType[TokenType["OR"] = 30] = "OR";
    TokenType[TokenType["PRINT"] = 31] = "PRINT";
    TokenType[TokenType["RETURN"] = 32] = "RETURN";
    TokenType[TokenType["SUPER"] = 33] = "SUPER";
    TokenType[TokenType["THIS"] = 34] = "THIS";
    TokenType[TokenType["TRUE"] = 35] = "TRUE";
    TokenType[TokenType["VAR"] = 36] = "VAR";
    TokenType[TokenType["WHILE"] = 37] = "WHILE";
    TokenType[TokenType["EOF"] = 38] = "EOF";
})(TokenType = exports.TokenType || (exports.TokenType = {}));
var Token = /** @class */ (function () {
    function Token(type, lexeme, literal, line) {
        this.type = type;
        this.lexeme = lexeme;
        this.literal = literal;
        this.line = line;
    }
    Token.prototype.toString = function () {
        return this.type + " " + this.lexeme + " " + this.literal;
    };
    return Token;
}());
exports.Token = Token;
var SVS = /** @class */ (function () {
    function SVS() {
        this.interpreter = new Interpreter_1.Interpreter(this);
        this.hadError = false;
        this.hadRuntimeError = false;
    }
    SVS.prototype.report = function (line, where, message) {
        console.log("[line " + line + "] Error" + where + ": " + message);
        this.hadError = true;
    };
    SVS.prototype.error = function (line, message) {
        this.report(line, "", message);
    };
    SVS.prototype.tokenError = function (token, message) {
        if (token.type == TokenType.EOF) {
            this.report(token.line, " at end", message);
        }
        else {
            this.report(token.line, " at " + token.lexeme + "'", message);
        }
    };
    SVS.prototype.runtimeError = function (error) {
        console.log(error.message + "\n[line " + error.token.line + "]");
        this.hadRuntimeError = true;
    };
    SVS.prototype.run = function (source) {
        var scanner = new scanner_1.Scanner(source, this);
        var tokens = scanner.scanTokens();
        var parser = new parser_1.Parser(tokens, this);
        var statements = parser.parse();
        if (this.hadError)
            return;
        this.interpreter.interpret(statements);
        if (this.hadRuntimeError)
            return;
    };
    SVS.prototype.runFile = function (path) {
        var _this = this;
        fs.readFile(path, "utf8", function (err, data) {
            _this.run(data);
            _this.hadError = false;
        });
    };
    return SVS;
}());
exports.SVS = SVS;
