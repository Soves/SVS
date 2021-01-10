"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.Variable = exports.Unary = exports.Logical = exports.Literal = exports.Grouping = exports.Binary = exports.Assign = exports.Expr = void 0;
var Expr = /** @class */ (function () {
    function Expr() {
    }
    return Expr;
}());
exports.Expr = Expr;
var Assign = /** @class */ (function (_super) {
    __extends(Assign, _super);
    function Assign(name, value) {
        var _this = _super.call(this) || this;
        _this.name = name;
        _this.value = value;
        return _this;
    }
    Assign.prototype.accept = function (visitor) {
        return visitor.visitAssignExpr(this);
    };
    return Assign;
}(Expr));
exports.Assign = Assign;
var Binary = /** @class */ (function (_super) {
    __extends(Binary, _super);
    function Binary(left, operator, right) {
        var _this = _super.call(this) || this;
        _this.left = left;
        _this.operator = operator;
        _this.right = right;
        return _this;
    }
    Binary.prototype.accept = function (visitor) {
        return visitor.visitBinaryExpr(this);
    };
    return Binary;
}(Expr));
exports.Binary = Binary;
var Grouping = /** @class */ (function (_super) {
    __extends(Grouping, _super);
    function Grouping(expression) {
        var _this = _super.call(this) || this;
        _this.expression = expression;
        return _this;
    }
    Grouping.prototype.accept = function (visitor) {
        return visitor.visitGroupingExpr(this);
    };
    return Grouping;
}(Expr));
exports.Grouping = Grouping;
var Literal = /** @class */ (function (_super) {
    __extends(Literal, _super);
    function Literal(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        return _this;
    }
    Literal.prototype.accept = function (visitor) {
        return visitor.visitLiteralExpr(this);
    };
    return Literal;
}(Expr));
exports.Literal = Literal;
var Logical = /** @class */ (function (_super) {
    __extends(Logical, _super);
    function Logical(left, operator, right) {
        var _this = _super.call(this) || this;
        _this.left = left;
        _this.operator = operator;
        _this.right = right;
        return _this;
    }
    Logical.prototype.accept = function (visitor) {
        return visitor.visitLogicalExpr(this);
    };
    return Logical;
}(Expr));
exports.Logical = Logical;
var Unary = /** @class */ (function (_super) {
    __extends(Unary, _super);
    function Unary(operator, right) {
        var _this = _super.call(this) || this;
        _this.operator = operator;
        _this.right = right;
        return _this;
    }
    Unary.prototype.accept = function (visitor) {
        return visitor.visitUnaryExpr(this);
    };
    return Unary;
}(Expr));
exports.Unary = Unary;
var Variable = /** @class */ (function (_super) {
    __extends(Variable, _super);
    function Variable(name) {
        var _this = _super.call(this) || this;
        _this.name = name;
        return _this;
    }
    Variable.prototype.accept = function (visitor) {
        return visitor.visitVariableExpr(this);
    };
    return Variable;
}(Expr));
exports.Variable = Variable;
