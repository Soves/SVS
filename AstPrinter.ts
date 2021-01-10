import * as ex from "./Expr"

export class AstPrinter implements ex.Visitor<string>
{
    private parenthesize(name : string, ...exprs : ex.Expr[]) : string {
        let str : string = "";
        str += "(" + name;

        exprs.forEach((expr : ex.Expr)=>{
            str += " " + expr.accept(this);
        })
        str += ")";

        return str;
    }

    print(expr : ex.Expr)
    {
        return expr.accept(this);
    }
    
    visitCallExpr(expr : ex.Call) : string{
        return "function";
    }

    visitLogicalExpr(expr : ex.Logical) : string{
        return this.parenthesize(expr.operator.lexeme, expr);
    }

    visitAssignExpr(expr : ex.Assign) : string{
        return this.parenthesize("assign", expr);
    }

    visitVariableExpr(expr : ex.Variable) : string
    {
        return this.parenthesize("var", expr);
    }

    visitBinaryExpr(expr : ex.Binary) : string
    {
        return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
    }

    visitGroupingExpr(expr : ex.Grouping) : string
    {
        return this.parenthesize("group", expr.expression);
    }

    visitLiteralExpr(expr : ex.Literal) : string
    {
        if (expr.value === null) return "null";
        return expr.value.toString();
    }

    visitUnaryExpr(expr : ex.Unary) : string
    {
        return this.parenthesize(expr.operator.lexeme, expr.right);
    }

}