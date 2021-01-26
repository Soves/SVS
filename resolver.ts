import { exec, ExecException } from "child_process";
import * as fs from "fs";
import * as ex from "./Expr";
import {AstPrinter} from "./AstPrinter"
import {Token, SVS, TokenType} from "./svs"
import * as st from "./Stmt"
import { Environment } from "./Environment";
import {SVSCallable, SVSFunction} from "./SVSCallable";
import { callbackify } from "util";
import * as readline from "readline-sync";
import {Interpreter} from "./Interpreter"
import { setPriority } from "os";

export type BoolMap = Record<string, boolean>;

enum FunctionType {
    NONE,
    FUNCTION
}

export class Resolver implements ex.Visitor<void>, st.Visitor<void>
{

    creator : SVS;
    interpreter : Interpreter;
    scopes : BoolMap[] = [];
    currentFunction = FunctionType.NONE;

    constructor(interpreter : Interpreter, creator : SVS)
    {
        this.interpreter = interpreter;
        this.creator = creator;
    }

    private beginScope()
    {
        this.scopes.push({} as BoolMap);
    }

    private endScope()
    {
        this.scopes.pop();
    }

    private resolveEx(expr : ex.Expr)
    {
        expr.accept(this);
    }

    private resolveSt(stmt : st.Stmt)
    {
        stmt.accept(this);
    }

    resolve(statements : st.Stmt[])
    {
        statements.forEach((statement : st.Stmt)=>
        {
            this.resolveSt(statement);
        })
    }

    private declare(name : Token)
    {
        if (this.scopes.length == 0) return;

        let scope : BoolMap = this.scopes[this.scopes.length-1];
        if(scope[name.lexeme] != null)
        {
            this.creator.error(name.line, "Already variable with this name in this scope.");
        }
        scope[name.lexeme] = false;
    }

    private resolveLocal(expr :ex.Expr, name : Token)
    {
        for (let i = this.scopes.length - 1; i >= 0; i--)
        {
            if (this.scopes[i][name.lexeme] != null)
            {
                this.interpreter.resolve(expr, this.scopes.length - 1 - i);
                return;
            }
        }
    }

    private resolveFunction(func : st.Func, type : FunctionType)
    {
        let enclosingfunc = this.currentFunction;
        this.currentFunction = type;

        this.beginScope();
        func.params.forEach((param : Token)=>{
            this.declare(param);
            this.define(param);
        });
        this.resolve(func.body);
        this.endScope();

        this.currentFunction = enclosingfunc;
    }

    private define(name : Token)
    {
        if (this.scopes.length == 0) return;
        this.scopes[this.scopes.length-1][name.lexeme] = true;
    }

    visitUnaryExpr(expr : ex.Unary)
    {
        this.resolveEx(expr.right);
        return null;
    }

    visitLogicalExpr(expr : ex.Logical)
    {
        this.resolveEx(expr.left);
        this.resolveEx(expr.right);
        return null;
    }

    visitLiteralExpr(expr : ex.Literal)
    {
        return null;
    }

    visitGroupingExpr(expr : ex.Grouping)
    {
        this.resolveEx(expr.expression);
        return null;
    }

    visitCallExpr(expr : ex.Call)
    {
        this.resolveEx(expr.callee);

        expr.args.forEach((arg : ex.Expr)=>{
            this.resolveEx(arg);
        })

        return null;
    }

    visitBinaryExpr(expr : ex.Binary)
    {
        this.resolveEx(expr.left);
        this.resolveEx(expr.right);
        return null;
    }

    visitWhileStmt(stmt : st.While)
    {
        this.resolveEx(stmt.condition);
        this.resolveSt(stmt.body);
        return null;
    }

    visitReturnStmt(stmt : st.Return)
    {
        if (this.currentFunction == FunctionType.NONE)
        {
            this.creator.error(stmt.keyword.line, "Can't return from top-level code.");
        }
        if (typeof stmt.value !== 'undefined')
        {
            this.resolveEx(stmt.value);
        }

        return null;
    }

    visitPrintStmt(stmt : st.Print)
    {
        this.resolveEx(stmt.expression);
        return null;
    }

    visitIfStmt(stmt : st.If)
    {
        this.resolveEx(stmt.condition);
        this.resolveSt(stmt.thenBranch);
        if (typeof stmt.elseBranch == null) return this.resolveSt(stmt.elseBranch);
        return null;
    }

    visitExpressionStmt(stmt : st.Expression)
    {
        this.resolveEx(stmt.expression);
        return null;
    }

    visitFuncStmt(stmt : st.Func)
    {
        this.declare(stmt.name);
        this.define(stmt.name);

        this.resolveFunction(stmt, FunctionType.FUNCTION);
        return null;
    }

    visitAssignExpr(expr : ex.Assign)
    {
        this.resolveEx(expr.value);
        this.resolveLocal(expr, expr.name);
        return null;
    }

    visitBlockStmt(stmt : st.Block)
    {
        this.beginScope();
        this.resolve(stmt.statements);
        this.endScope();
    }

    visitVariableExpr(expr: ex.Variable)
    {
        if(this.scopes.length > 0 &&
            this.scopes[this.scopes.length-1][expr.name.lexeme] === false)
            {
                this.creator.error(expr.name.line, "Can't read local variable in its own initializer.");
            }

        this.resolveLocal(expr, expr.name);
        return null;
    }

    visitVarStmt(stmt : st.Var)
    {
        this.declare(stmt.name);
        if(stmt.initializer != null)
        {
            this.resolveEx(stmt.initializer);
        }
        this.define(stmt.name);
        return null;
    }



}