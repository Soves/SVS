"use strict";
exports.__esModule = true;
exports.Interpreter = exports.RuntimeError = void 0;
var svs_1 = require("./svs");
var Environment_1 = require("./Environment");
var RuntimeError = /** @class */ (function () {
    function RuntimeError(token, message) {
        this.token = token;
        this.message = message;
    }
    return RuntimeError;
}());
exports.RuntimeError = RuntimeError;
var Interpreter = /** @class */ (function () {
    function Interpreter(creator) {
        this.environment = new Environment_1.Environment();
        this.creator = creator;
    }
    Interpreter.prototype.interpret = function (expression) {
        var _this = this;
        try {
            expression.forEach(function (statement) {
                _this.execute(statement);
            });
        }
        catch (e) {
            this.creator.runtimeError(e);
        }
    };
    Interpreter.prototype.execute = function (stmt) {
        stmt.accept(this);
    };
    Interpreter.prototype.executeBlock = function (statements, environment) {
        var _this = this;
        var previous = this.environment;
        try {
            this.environment = environment;
            statements.forEach(function (statement) {
                _this.execute(statement);
            });
        }
        finally {
            this.environment = previous;
        }
    };
    Interpreter.prototype.evaluate = function (expr) {
        return expr.accept(this);
    };
    Interpreter.prototype.isTruthy = function (object) {
        if (object === null)
            return false;
        if (typeof object == 'boolean')
            return object;
        return true;
    };
    Interpreter.prototype.isEqual = function (a, b) {
        if (a === null && b === null)
            return true;
        if (a === null)
            return false;
        return a == b;
    };
    Interpreter.prototype.stringify = function (object) {
        if (object == null)
            return "null";
        if (typeof object == 'number') {
            var text = object.toString();
            if (text.endsWith(".0")) {
                text = text.substring(0, text.length - 2);
            }
            return text;
        }
        return object.toString();
    };
    Interpreter.prototype.checkNumberOperand = function (operator, operand) {
        if (typeof operand == 'number')
            return;
        throw new RuntimeError(operator, "Operand must be a number.");
    };
    Interpreter.prototype.checkNumberOperands = function (operator, left, right) {
        if (typeof left == 'number' && typeof right == 'number')
            return;
        throw new RuntimeError(operator, "Operands must be a number.");
    };
    Interpreter.prototype.visitWhileStmt = function (stmt) {
        while (this.isTruthy(this.evaluate(stmt.condition))) {
            this.execute(stmt.body);
        }
        return null;
    };
    Interpreter.prototype.visitLogicalExpr = function (expr) {
        var left = this.evaluate(expr.left);
        if (expr.operator.type == svs_1.TokenType.OR) {
            if (this.isTruthy(left))
                return left;
        }
        else {
            if (!this.isTruthy(left))
                return left;
        }
        return this.evaluate(expr.right);
    };
    Interpreter.prototype.visitIfStmt = function (stmt) {
        if (this.isTruthy(this.evaluate(stmt.condition))) {
            this.execute(stmt.thenBranch);
        }
        else if (stmt.elseBranch != null) {
            this.execute(stmt.elseBranch);
        }
        return null;
    };
    Interpreter.prototype.visitBlockStmt = function (stmt) {
        this.executeBlock(stmt.statements, new Environment_1.Environment(this.environment));
        return null;
    };
    Interpreter.prototype.visitAssignExpr = function (expr) {
        var value = this.evaluate(expr.value);
        this.environment.assign(expr.name, value);
        return value;
    };
    Interpreter.prototype.visitVarStmt = function (stmt) {
        var value = null;
        if (stmt.initializer != null) {
            value = this.evaluate(stmt.initializer);
        }
        this.environment.define(stmt.name.lexeme, value);
        return null;
    };
    Interpreter.prototype.visitVariableExpr = function (expr) {
        return this.environment.get(expr.name);
    };
    Interpreter.prototype.visitExpressionStmt = function (stmt) {
        this.evaluate(stmt.expression);
        return null;
    };
    Interpreter.prototype.visitPrintStmt = function (stmt) {
        var value = this.evaluate(stmt.expression);
        console.log(this.stringify(value));
        return null;
    };
    Interpreter.prototype.visitLiteralExpr = function (expr) {
        return expr.value;
    };
    Interpreter.prototype.visitGroupingExpr = function (expr) {
        return this.evaluate(expr.expression);
    };
    Interpreter.prototype.visitUnaryExpr = function (expr) {
        var right = this.evaluate(expr.right);
        switch (expr.operator.type) {
            case svs_1.TokenType.BANG:
                return !this.isTruthy(right);
            case svs_1.TokenType.MINUS:
                this.checkNumberOperand(expr.operator, right);
                return -right;
        }
        return null;
    };
    Interpreter.prototype.visitBinaryExpr = function (expr) {
        var left = this.evaluate(expr.left);
        var right = this.evaluate(expr.right);
        switch (expr.operator.type) {
            case svs_1.TokenType.MINUS:
                this.checkNumberOperands(expr.operator, left, right);
                return left - right;
            case svs_1.TokenType.SLASH:
                this.checkNumberOperands(expr.operator, left, right);
                return left / right;
            case svs_1.TokenType.STAR:
                this.checkNumberOperands(expr.operator, left, right);
                return left * right;
            case svs_1.TokenType.PLUS:
                if (typeof left == 'number' && typeof right == 'number') {
                    return left + right;
                }
                if (typeof left == 'string' && typeof right == 'string') {
                    return left + right;
                }
                throw new RuntimeError(expr.operator, "Operands must be two numbers or two strings.");
            case svs_1.TokenType.GREATER:
                this.checkNumberOperands(expr.operator, left, right);
                return left > right;
            case svs_1.TokenType.GREATER_EQUAL:
                this.checkNumberOperands(expr.operator, left, right);
                return left >= right;
            case svs_1.TokenType.LESS:
                this.checkNumberOperands(expr.operator, left, right);
                return left < right;
            case svs_1.TokenType.LESS_EQUAL:
                this.checkNumberOperands(expr.operator, left, right);
                return left <= right;
            case svs_1.TokenType.BANG_EQUAL: return !this.isEqual(left, right);
            case svs_1.TokenType.EQUAL_EQUAL: return this.isEqual(left, right);
        }
        return null;
    };
    return Interpreter;
}());
exports.Interpreter = Interpreter;
