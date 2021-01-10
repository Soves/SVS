"use strict";
exports.__esModule = true;
exports.SVSFunction = void 0;
var Environment_1 = require("./Environment");
var Interpreter_1 = require("./Interpreter");
var SVSFunction = /** @class */ (function () {
    function SVSFunction(declaration, closure) {
        this.kind = "callable";
        this.declaration = declaration;
        this.closure = closure;
    }
    SVSFunction.prototype.call = function (interpreter, args) {
        var environment = new Environment_1.Environment(this.closure);
        for (var i = 0; i < this.declaration.params.length; i++) {
            environment.define(this.declaration.params[i].lexeme, args[i]);
        }
        try {
            interpreter.executeBlock(this.declaration.body, environment);
        }
        catch (e) {
            if (e instanceof Interpreter_1.Return) {
                return e.value;
            }
        }
        return null;
    };
    SVSFunction.prototype.arity = function () {
        return this.declaration.params.length;
    };
    return SVSFunction;
}());
exports.SVSFunction = SVSFunction;
