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
        if (typeof this.values[name.lexeme] != 'undefined') {
            return this.values[name.lexeme];
        }
        if (this.enclosing != null)
            return this.enclosing.get(name);
        throw new Interpreter_1.RuntimeError(name, "Undefined variable '" + name.lexeme + "'.");
    };
    Environment.prototype.getAt = function (distance, name) {
        return this.ancestor(distance).get(name);
    };
    Environment.prototype.ancestor = function (distance) {
        var environment = this;
        for (var i = 0; i < distance; i++) {
            environment = environment.enclosing;
        }
        return environment;
    };
    Environment.prototype.define = function (name, value) {
        this.values[name] = value;
    };
    Environment.prototype.assign = function (name, value) {
        if (typeof this.values[name.lexeme] != 'undefined') {
            this.values[name.lexeme] = value;
            return;
        }
        if (this.enclosing != null) {
            this.enclosing.assign(name, value);
            return;
        }
        throw new Interpreter_1.RuntimeError(name, "Undefined variable '" + name.lexeme + "'.");
    };
    Environment.prototype.assignAt = function (distance, name, value) {
        this.ancestor(distance).values[name.lexeme] = value;
    };
    return Environment;
}());
exports.Environment = Environment;
