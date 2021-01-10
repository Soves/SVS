import { exec, ExecException } from "child_process";
import * as fs from "fs";
import * as ex from "./Expr";
import {AstPrinter} from "./AstPrinter"
import {Token, SVS, TokenType} from "./svs"
import * as st from "./Stmt"
import { Environment } from "./Environment";
import {Interpreter, Return} from "./Interpreter"

export interface SVSCallable
{
    kind : string;
    arity() : number;
    call(interpreter : Interpreter, args : Object[]) : Object;
}

export class SVSFunction implements SVSCallable
{
    kind = "callable";
    declaration : st.Func;
    closure : Environment;

    constructor(declaration : st.Func, closure : Environment)
    {
        this.declaration = declaration;
        this.closure = closure;
    }

    call(interpreter : Interpreter, args : Object[]) : Object
    {
        let environment : Environment = new Environment(this.closure);
        for(let i = 0; i < this.declaration.params.length;  i++)
        {
            environment.define(this.declaration.params[i].lexeme, args[i]);
        }

        try{
            interpreter.executeBlock(this.declaration.body, environment);
        }
        catch(e)
        {
            if(e instanceof Return)
            {
                return e.value;
            }
        }
        
        return null;
    }

    arity() : number
    {
        return this.declaration.params.length;
    }
}