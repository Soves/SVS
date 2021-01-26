"use strict";
exports.__esModule = true;
exports.Resolver = void 0;
var FunctionType;
(function (FunctionType) {
    FunctionType[FunctionType["NONE"] = 0] = "NONE";
    FunctionType[FunctionType["FUNCTION"] = 1] = "FUNCTION";
})(FunctionType || (FunctionType = {}));
var Resolver = /** @class */ (function () {
    function Resolver(interpreter, creator) {
        this.scopes = [];
        this.currentFunction = FunctionType.NONE;
        this.interpreter = interpreter;
        this.creator = creator;
    }
    Resolver.prototype.beginScope = function () {
        this.scopes.push({});
    };
    Resolver.prototype.endScope = function () {
        this.scopes.pop();
    };
    Resolver.prototype.resolveEx = function (expr) {
        expr.accept(this);
    };
    Resolver.prototype.resolveSt = function (stmt) {
        stmt.accept(this);
    };
    Resolver.prototype.resolve = function (statements) {
        var _this = this;
        statements.forEach(function (statement) {
            _this.resolveSt(statement);
        });
    };
    Resolver.prototype.declare = function (name) {
        if (this.scopes.length == 0)
            return;
        var scope = this.scopes[this.scopes.length - 1];
        if (scope[name.lexeme] != null) {
            this.creator.error(name.line, "Already variable with this name in this scope.");
        }
        scope[name.lexeme] = false;
    };
    Resolver.prototype.resolveLocal = function (expr, name) {
        for (var i = this.scopes.length - 1; i >= 0; i--) {
            if (this.scopes[i][name.lexeme] != null) {
                this.interpreter.resolve(expr, this.scopes.length - 1 - i);
                return;
            }
        }
    };
    Resolver.prototype.resolveFunction = function (func, type) {
        var _this = this;
        var enclosingfunc = this.currentFunction;
        this.currentFunction = type;
        this.beginScope();
        func.params.forEach(function (param) {
            _this.declare(param);
            _this.define(param);
        });
        this.resolve(func.body);
        this.endScope();
        this.currentFunction = enclosingfunc;
    };
    Resolver.prototype.define = function (name) {
        if (this.scopes.length == 0)
            return;
        this.scopes[this.scopes.length - 1][name.lexeme] = true;
    };
    Resolver.prototype.visitUnaryExpr = function (expr) {
        this.resolveEx(expr.right);
        return null;
    };
    Resolver.prototype.visitLogicalExpr = function (expr) {
        this.resolveEx(expr.left);
        this.resolveEx(expr.right);
        return null;
    };
    Resolver.prototype.visitLiteralExpr = function (expr) {
        return null;
    };
    Resolver.prototype.visitGroupingExpr = function (expr) {
        this.resolveEx(expr.expression);
        return null;
    };
    Resolver.prototype.visitCallExpr = function (expr) {
        var _this = this;
        this.resolveEx(expr.callee);
        expr.args.forEach(function (arg) {
            _this.resolveEx(arg);
        });
        return null;
    };
    Resolver.prototype.visitBinaryExpr = function (expr) {
        this.resolveEx(expr.left);
        this.resolveEx(expr.right);
        return null;
    };
    Resolver.prototype.visitWhileStmt = function (stmt) {
        this.resolveEx(stmt.condition);
        this.resolveSt(stmt.body);
        return null;
    };
    Resolver.prototype.visitReturnStmt = function (stmt) {
        if (this.currentFunction == FunctionType.NONE) {
            this.creator.error(stmt.keyword.line, "Can't return from top-level code.");
        }
        if (typeof stmt.value !== 'undefined') {
            this.resolveEx(stmt.value);
        }
        return null;
    };
    Resolver.prototype.visitPrintStmt = function (stmt) {
        this.resolveEx(stmt.expression);
        return null;
    };
    Resolver.prototype.visitIfStmt = function (stmt) {
        this.resolveEx(stmt.condition);
        this.resolveSt(stmt.thenBranch);
        if (typeof stmt.elseBranch == null)
            return this.resolveSt(stmt.elseBranch);
        return null;
    };
    Resolver.prototype.visitExpressionStmt = function (stmt) {
        this.resolveEx(stmt.expression);
        return null;
    };
    Resolver.prototype.visitFuncStmt = function (stmt) {
        this.declare(stmt.name);
        this.define(stmt.name);
        this.resolveFunction(stmt, FunctionType.FUNCTION);
        return null;
    };
    Resolver.prototype.visitAssignExpr = function (expr) {
        this.resolveEx(expr.value);
        this.resolveLocal(expr, expr.name);
        return null;
    };
    Resolver.prototype.visitBlockStmt = function (stmt) {
        this.beginScope();
        this.resolve(stmt.statements);
        this.endScope();
    };
    Resolver.prototype.visitVariableExpr = function (expr) {
        if (this.scopes.length > 0 &&
            this.scopes[this.scopes.length - 1][expr.name.lexeme] === false) {
            this.creator.error(expr.name.line, "Can't read local variable in its own initializer.");
        }
        this.resolveLocal(expr, expr.name);
        return null;
    };
    Resolver.prototype.visitVarStmt = function (stmt) {
        this.declare(stmt.name);
        if (stmt.initializer != null) {
            this.resolveEx(stmt.initializer);
        }
        this.define(stmt.name);
        return null;
    };
    return Resolver;
}());
exports.Resolver = Resolver;
