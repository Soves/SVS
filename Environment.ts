import { ExecException } from "child_process";
import * as fs from "fs";
import * as ex from "./Expr";
import {AstPrinter} from "./AstPrinter"
import {Parser} from "./parser"
import {Scanner} from "./scanner"
import {Interpreter, RuntimeError} from "./Interpreter"
import * as st from "./Stmt"
import {Token, SVS, TokenType} from "./svs"

export type Map = Record<string, Object>;

export class Environment
{
    enclosing : Environment;
    private values : Map = {};

    constructor(enclosing : Environment = null)
    {
        this.enclosing = enclosing;
    }

    get(name : Token) : Object
    {
        
        if (typeof this.values[name.lexeme] != 'undefined')
        {
            return this.values[name.lexeme];
        }

        if (this.enclosing != null) return this.enclosing.get(name);

        throw new RuntimeError(name,
            "Undefined variable '" + name.lexeme + "'.");
    }

    getAt(distance : number, name : Token) : Object
    {
        return this.ancestor(distance).get(name);
    }

    ancestor(distance : number) : Environment
    {
        let environment : Environment = this;
        for(let i = 0; i < distance; i++)
        {
            environment = environment.enclosing;
        }

        return environment;
    }

    define(name : string, value : Object)
    {
        this.values[name] = value;
    }

    assign(name : Token, value : Object)
    {
        
        if(typeof this.values[name.lexeme] != 'undefined')
        {
            this.values[name.lexeme] = value;
            return;
        }

        if (this.enclosing != null)
        {
            this.enclosing.assign(name, value);
            return;
        }

        throw new RuntimeError(name,
            "Undefined variable '" + name.lexeme + "'.");
    }

    assignAt(distance : number, name : Token, value : Object)
    {
        this.ancestor(distance).values[name.lexeme] = value;
    }
}