"use strict";
exports.__esModule = true;
exports.Parser = exports.ParseError = void 0;
var ex = require("./Expr");
var svs_1 = require("./svs");
var st = require("./Stmt");
var ParseError = /** @class */ (function () {
    function ParseError() {
    }
    return ParseError;
}());
exports.ParseError = ParseError;
var Parser = /** @class */ (function () {
    function Parser(tokens, creator) {
        this.current = 0;
        this.tokens = tokens;
        this.creator = creator;
    }
    Parser.prototype.parse = function () {
        var statements = [];
        while (!this.isAtEnd()) {
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
    };
    Parser.prototype.declaration = function () {
        try {
            if (this.match(svs_1.TokenType.VAR))
                return this.varDeclaration();
            return this.statement();
        }
        catch (e) {
            this.synchronize();
            return null;
        }
    };
    Parser.prototype.varDeclaration = function () {
        var name = this.consume(svs_1.TokenType.IDENTIFIER, "Expect variable name.");
        var initializer = null;
        if (this.match(svs_1.TokenType.EQUAL)) {
            initializer = this.expression();
        }
        this.consume(svs_1.TokenType.SEMICOLON, "Expect ';' after variable declaration.");
        return new st.Var(name, initializer);
    };
    Parser.prototype.statement = function () {
        if (this.match(svs_1.TokenType.FOR))
            return this.forStatement();
        if (this.match(svs_1.TokenType.IF))
            return this.ifStatement();
        if (this.match(svs_1.TokenType.PRINT))
            return this.printStatement();
        if (this.match(svs_1.TokenType.WHILE))
            return this.whileStatement();
        if (this.match(svs_1.TokenType.LEFT_BRACE))
            return new st.Block(this.block());
        return this.expressionStatement();
    };
    Parser.prototype.assignment = function () {
        var expr = this.or();
        if (this.match(svs_1.TokenType.EQUAL)) {
            var equals = this.previous();
            var value = this.assignment();
            if (expr instanceof ex.Variable) {
                var name_1 = expr.name;
                return new ex.Assign(name_1, value);
            }
            this.error(equals, "Invalid assignment target.");
        }
        return expr;
    };
    Parser.prototype.forStatement = function () {
        this.consume(svs_1.TokenType.LEFT_PAREN, "Expect '(' after 'for'.");
        var initializer;
        if (this.match(svs_1.TokenType.SEMICOLON)) {
            initializer = null;
        }
        else if (this.match(svs_1.TokenType.VAR)) {
            initializer = this.varDeclaration();
        }
        else {
            initializer = this.expressionStatement();
        }
        var condition = null;
        if (!this.check(svs_1.TokenType.SEMICOLON)) {
            condition = this.expression();
        }
        this.consume(svs_1.TokenType.SEMICOLON, "Expect ';' after loop condition.");
        var increment = null;
        if (!this.check(svs_1.TokenType.RIGHT_PAREN)) {
            increment = this.expression();
        }
        this.consume(svs_1.TokenType.RIGHT_PAREN, "Expect ')' after for clauses.");
        var body = this.statement();
        if (increment != null) {
            body = new st.Block([body, new st.Expression(increment)]);
        }
        if (condition === null)
            condition = new ex.Literal(true);
        body = new st.While(condition, body);
        if (initializer != null) {
            body = new st.Block([initializer, body]);
        }
        return body;
    };
    Parser.prototype.whileStatement = function () {
        this.consume(svs_1.TokenType.LEFT_PAREN, "Expect '(' after 'while'.");
        var condition = this.expression();
        this.consume(svs_1.TokenType.RIGHT_PAREN, "Expect ')' after condition.");
        var body = this.statement();
        return new st.While(condition, body);
    };
    Parser.prototype.printStatement = function () {
        var value = this.expression();
        this.consume(svs_1.TokenType.SEMICOLON, "Expect ;  after value.");
        return new st.Print(value);
    };
    Parser.prototype.expressionStatement = function () {
        var expr = this.expression();
        this.consume(svs_1.TokenType.SEMICOLON, "Expect ; after expression.");
        return new st.Expression(expr);
    };
    Parser.prototype.peek = function () {
        return this.tokens[this.current];
    };
    Parser.prototype.previous = function () {
        return this.tokens[this.current - 1];
    };
    Parser.prototype.isAtEnd = function () {
        return this.peek().type == svs_1.TokenType.EOF;
    };
    Parser.prototype.advance = function () {
        if (!this.isAtEnd())
            this.current++;
        return this.previous();
    };
    Parser.prototype.synchronize = function () {
        this.advance();
        while (!this.isAtEnd()) {
            if (this.previous().type == svs_1.TokenType.SEMICOLON)
                return;
            switch (this.peek().type) {
                case svs_1.TokenType.CLASS:
                case svs_1.TokenType.FUN:
                case svs_1.TokenType.VAR:
                case svs_1.TokenType.FOR:
                case svs_1.TokenType.IF:
                case svs_1.TokenType.WHILE:
                case svs_1.TokenType.PRINT:
                case svs_1.TokenType.RETURN:
                    return;
            }
            this.advance();
        }
    };
    Parser.prototype.check = function (type) {
        if (this.isAtEnd())
            return false;
        return this.peek().type == type;
    };
    Parser.prototype.match = function () {
        var _this = this;
        var types = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            types[_i] = arguments[_i];
        }
        var result = false;
        types.forEach(function (type) {
            if (_this.check(type)) {
                _this.advance();
                result = true;
            }
        });
        return result;
    };
    Parser.prototype.and = function () {
        var expr = this.equality();
        while (this.match(svs_1.TokenType.AND)) {
            var operator = this.previous();
            var right = this.equality();
            expr = new ex.Logical(expr, operator, right);
        }
        return expr;
    };
    Parser.prototype.or = function () {
        var expr = this.and();
        while (this.match(svs_1.TokenType.OR)) {
            var operator = this.previous();
            var right = this.and();
            expr = new ex.Logical(expr, operator, right);
        }
        return expr;
    };
    Parser.prototype.ifStatement = function () {
        this.consume(svs_1.TokenType.LEFT_PAREN, "Expect '(' after 'if'.");
        var condition = this.expression();
        this.consume(svs_1.TokenType.RIGHT_PAREN, "Expect ')' after if condition");
        var thenBranch = this.statement();
        var elseBranch = null;
        if (this.match(svs_1.TokenType.ELSE)) {
            elseBranch = this.statement();
        }
        ;
        return new st.If(condition, thenBranch, elseBranch);
    };
    Parser.prototype.block = function () {
        var statements = [];
        while (!this.check(svs_1.TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            statements.push(this.declaration());
        }
        this.consume(svs_1.TokenType.RIGHT_BRACE, "Expect '}' after block.");
        return statements;
    };
    Parser.prototype.expression = function () {
        return this.assignment();
    };
    Parser.prototype.error = function (token, message) {
        this.creator.tokenError(token, message);
        return new ParseError();
    };
    Parser.prototype.consume = function (type, message) {
        if (this.check(type))
            return this.advance();
        throw this.error(this.peek(), message);
    };
    Parser.prototype.primary = function () {
        if (this.match(svs_1.TokenType.FALSE))
            return new ex.Literal(false);
        if (this.match(svs_1.TokenType.TRUE))
            return new ex.Literal(true);
        if (this.match(svs_1.TokenType.NULL))
            return new ex.Literal(null);
        if (this.match(svs_1.TokenType.NUMBER, svs_1.TokenType.STRING)) {
            return new ex.Literal(this.previous().literal);
        }
        if (this.match(svs_1.TokenType.IDENTIFIER)) {
            return new ex.Variable(this.previous());
        }
        if (this.match(svs_1.TokenType.LEFT_PAREN)) {
            var expr = this.expression();
            this.consume(svs_1.TokenType.RIGHT_PAREN, "Expect ')' after expression.");
            return new ex.Grouping(expr);
        }
        throw this.error(this.peek(), "Expect expression.");
    };
    Parser.prototype.finishCall = function (callee) {
        var args = [];
        if (!this.check(svs_1.TokenType.RIGHT_PAREN)) {
            do {
                if (args.length >= 255) {
                    this.error(this.peek(), "Can't have more than 255 arguments.");
                }
                args.push(this.expression());
            } while (this.match(svs_1.TokenType.COMMA));
        }
        var paren = this.consume(svs_1.TokenType.RIGHT_PAREN, "Expect ')' after arguments.");
        return new ex.Call(callee, paren, args);
    };
    Parser.prototype.call = function () {
        var expr = this.primary();
        while (true) {
            if (this.match(svs_1.TokenType.LEFT_PAREN)) {
                expr = this.finishCall(expr);
            }
            else {
                break;
            }
        }
        return expr;
    };
    Parser.prototype.unary = function () {
        if (this.match(svs_1.TokenType.BANG, svs_1.TokenType.MINUS)) {
            var operator = this.previous();
            var right = this.unary();
            return new ex.Unary(operator, right);
        }
        return this.call();
    };
    Parser.prototype.factor = function () {
        var expr = this.unary();
        while (this.match(svs_1.TokenType.SLASH, svs_1.TokenType.STAR)) {
            var operator = this.previous();
            var right = this.unary();
            expr = new ex.Binary(expr, operator, right);
        }
        return expr;
    };
    Parser.prototype.term = function () {
        var expr = this.factor();
        while (this.match(svs_1.TokenType.MINUS, svs_1.TokenType.PLUS)) {
            var operator = this.previous();
            var right = this.factor();
            expr = new ex.Binary(expr, operator, right);
        }
        return expr;
    };
    Parser.prototype.comparison = function () {
        var expr = this.term();
        while (this.match(svs_1.TokenType.GREATER, svs_1.TokenType.GREATER_EQUAL, svs_1.TokenType.LESS, svs_1.TokenType.LESS_EQUAL)) {
            var operator = this.previous();
            var right = this.term();
            expr = new ex.Binary(expr, operator, right);
        }
        return expr;
    };
    Parser.prototype.equality = function () {
        var expr = this.comparison();
        while (this.match(svs_1.TokenType.BANG_EQUAL, svs_1.TokenType.EQUAL_EQUAL)) {
            var operator = this.previous();
            var right = this.comparison();
            expr = new ex.Binary(expr, operator, right);
        }
        return expr;
    };
    return Parser;
}());
exports.Parser = Parser;
