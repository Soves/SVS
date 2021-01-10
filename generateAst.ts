import * as fs from "fs";

const defineVisitor = (basename : string, types : string[])=>{
    let data : string = "";
    let indent : string = "";

    data += "export interface Visitor<R> {\n";
    indent += "\t";
        
        types.forEach((type : string)=>
        {
            let typeName : string = type.split(":")[0].trim();
            data += indent + "visit" + typeName + basename + "(" + basename.toLowerCase() + " : " + typeName + ") : R;\n"
        });

    data += "}\n";

    return data;

}

const  defineType = (baseName : string, className : string, fieldList : string)=>{
    let data : string = "";
    let indent : string = "";

    data += "export class " + className + " extends " + baseName + " {\n";
        indent = "\t";

        let fieldArgs : string[] = fieldList.split(", ");

        fieldArgs.forEach((field : string, i)=>{
            fieldArgs[i] = field.split(" ").reverse().join(" : ");
        });

        data += indent + fieldArgs.join(";\n"+indent)+";\n";

        data += indent + "constructor(" + fieldArgs.join(", ") + "){\n";

            indent = "\t\t";

            data += indent + "super();\n"

            fieldArgs.forEach((field : string)=>{
                data += indent + "this." + field.split(" : ")[0] + " = " + field.split(" : ")[0] + ";\n";
            });

        indent = "\t";

        data += indent + "}\n";

        data += indent + "accept<R>(visitor : Visitor<R>) : R{\n"
        indent = "\t\t";

        data += indent + "return visitor.visit" + className + baseName + "(this);\n"
        
        indent = "\t";
        data += indent + "}\n";


    data += "}\n";

    return data;
}

const defineAst = (dir: string, baseName : string, header : string, types : string[])=>{
    let path : string = dir + "/" + baseName + ".ts";
    let data : string = "";

    data += header;

    data += defineVisitor(baseName, types);

    data += "export abstract class " + baseName + "\n{\n"

        data += "   abstract accept<R>(visitor : Visitor<R>) : R;\n"

    data += "}\n";

    types.forEach((type : string)=>{
        let className : string = type.split(":")[0].trim();
        let fields : string = type.split(":")[1].trim();

        data += defineType(baseName, className, fields);
    })

    fs.writeFile(path, data, ()=>{
        //write complete
    });
}

defineAst(".", "Expr", 
    'import {Token} from \"./svs\";\n', 
    [
        "Assign   : Token name, Expr value",
        "Binary   : Expr left, Token operator, Expr right",
        "Call     : Expr callee, Token paren, Expr[] args",
        "Grouping : Expr expression",
        "Literal  : Object value",
        "Logical  : Expr left, Token operator, Expr right",
        "Unary    : Token operator, Expr right",
        "Variable : Token name"
    ]
);

defineAst(".", "Stmt", 
    'import {Token} from \"./svs\";\n'+
    'import {Expr} from \"./Expr\";\n'
    , 
    [
        "Block      : Stmt[] statements",
        "Expression : Expr expression",
        "If         : Expr condition, Stmt thenBranch," +
                  " Stmt elseBranch",
        "Print      : Expr expression",
        "Var        : Token name, Expr initializer",
        "While      : Expr condition, Stmt body"
    ]
);