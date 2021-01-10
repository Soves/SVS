import { exec, ExecException } from "child_process";
import * as fs from "fs";
import * as ex from "./Expr";
import {AstPrinter} from "./AstPrinter"
import {Token, SVS, TokenType} from "./svs"
import * as st from "./Stmt"
import { Environment } from "./Environment";
import {Interpreter} from "./Interpreter"

export interface SVSCallable
{
    kind : string;
    arity() : number;
    call(interpreter : Interpreter, args : Object[]) : Object;
}