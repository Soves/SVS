"use strict";
exports.__esModule = true;
var fs = require("fs");
var defineVisitor = function (basename, types) {
    var data = "";
    var indent = "";
    data += "export interface Visitor<R> {\n";
    indent += "\t";
    types.forEach(function (type) {
        var typeName = type.split(":")[0].trim();
        data += indent + "visit" + typeName + basename + "(" + basename.toLowerCase() + " : " + typeName + ") : R;\n";
    });
    data += "}\n";
    return data;
};
var defineType = function (baseName, className, fieldList) {
    var data = "";
    var indent = "";
    data += "export class " + className + " extends " + baseName + " {\n";
    indent = "\t";
    var fieldArgs = fieldList.split(", ");
    fieldArgs.forEach(function (field, i) {
        fieldArgs[i] = field.split(" ").reverse().join(" : ");
    });
    data += indent + fieldArgs.join(";\n" + indent) + ";\n";
    data += indent + "constructor(" + fieldArgs.join(", ") + "){\n";
    indent = "\t\t";
    data += indent + "super();\n";
    fieldArgs.forEach(function (field) {
        data += indent + "this." + field.split(" : ")[0] + " = " + field.split(" : ")[0] + ";\n";
    });
    indent = "\t";
    data += indent + "}\n";
    data += indent + "accept<R>(visitor : Visitor<R>) : R{\n";
    indent = "\t\t";
    data += indent + "return visitor.visit" + className + baseName + "(this);\n";
    indent = "\t";
    data += indent + "}\n";
    data += "}\n";
    return data;
};
var defineAst = function (dir, baseName, header, types) {
    var path = dir + "/" + baseName + ".ts";
    var data = "";
    data += header;
    data += defineVisitor(baseName, types);
    data += "export abstract class " + baseName + "\n{\n";
    data += "   abstract accept<R>(visitor : Visitor<R>) : R;\n";
    data += "}\n";
    types.forEach(function (type) {
        var className = type.split(":")[0].trim();
        var fields = type.split(":")[1].trim();
        data += defineType(baseName, className, fields);
    });
    fs.writeFile(path, data, function () {
        //write complete
    });
};
defineAst(".", "Expr", 'import {Token} from \"./svs\";\n', [
    "Assign   : Token name, Expr value",
    "Binary   : Expr left, Token operator, Expr right",
    "Grouping : Expr expression",
    "Literal  : Object value",
    "Logical  : Expr left, Token operator, Expr right",
    "Unary    : Token operator, Expr right",
    "Variable : Token name"
]);
defineAst(".", "Stmt", 'import {Token} from \"./svs\";\n' +
    'import {Expr} from \"./Expr\";\n', [
    "Block      : Stmt[] statements",
    "Expression : Expr expression",
    "If         : Expr condition, Stmt thenBranch," +
        " Stmt elseBranch",
    "Print      : Expr expression",
    "Var        : Token name, Expr initializer",
    "While      : Expr condition, Stmt body"
]);
