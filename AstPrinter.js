"use strict";
exports.__esModule = true;
exports.AstPrinter = void 0;
var AstPrinter = /** @class */ (function () {
    function AstPrinter() {
    }
    AstPrinter.prototype.parenthesize = function (name) {
        var _this = this;
        var exprs = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            exprs[_i - 1] = arguments[_i];
        }
        var str = "";
        str += "(" + name;
        exprs.forEach(function (expr) {
            str += " " + expr.accept(_this);
        });
        str += ")";
        return str;
    };
    AstPrinter.prototype.print = function (expr) {
        return expr.accept(this);
    };
    AstPrinter.prototype.visitLogicalExpr = function (expr) {
        return this.parenthesize(expr.operator.lexeme, expr);
    };
    AstPrinter.prototype.visitAssignExpr = function (expr) {
        return this.parenthesize("assign", expr);
    };
    AstPrinter.prototype.visitVariableExpr = function (expr) {
        return this.parenthesize("var", expr);
    };
    AstPrinter.prototype.visitBinaryExpr = function (expr) {
        return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
    };
    AstPrinter.prototype.visitGroupingExpr = function (expr) {
        return this.parenthesize("group", expr.expression);
    };
    AstPrinter.prototype.visitLiteralExpr = function (expr) {
        if (expr.value === null)
            return "null";
        return expr.value.toString();
    };
    AstPrinter.prototype.visitUnaryExpr = function (expr) {
        return this.parenthesize(expr.operator.lexeme, expr.right);
    };
    return AstPrinter;
}());
exports.AstPrinter = AstPrinter;
