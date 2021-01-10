"use strict";
exports.__esModule = true;
exports.Environment = void 0;
var Interpreter_1 = require("./Interpreter");
var Environment = /** @class */ (function () {
    function Environment(enclosing) {
        if (enclosing === void 0) { enclosing = null; }
        this.values = {};
        this.enclosing = enclosing;
    }
    Environment.prototype.get = function (name) {
        if (this.values[name.lexeme] != undefined) {
            return this.values[name.lexeme];
        }
        if (this.enclosing != null)
            return this.enclosing.get(name);
        throw new Interpreter_1.RuntimeError(name, "Undefined variable '" + name.lexeme + "'.");
    };
    Environment.prototype.define = function (name, value) {
        this.values[name] = value;
    };
    Environment.prototype.assign = function (name, value) {
        if (this.values[name.lexeme] != undefined) {
            this.values[name.lexeme] = value;
            return;
        }
        if (this.enclosing != null) {
            this.enclosing.assign(name, value);
            return;
        }
        throw new Interpreter_1.RuntimeError(name, "Undefined variable '" + name.lexeme + "'.");
    };
    return Environment;
}());
exports.Environment = Environment;
