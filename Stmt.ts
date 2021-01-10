import {Token} from "./svs";
import {Expr} from "./Expr";
export interface Visitor<R> {
	visitBlockStmt(stmt : Block) : R;
	visitExpressionStmt(stmt : Expression) : R;
	visitIfStmt(stmt : If) : R;
	visitFuncStmt(stmt : Func) : R;
	visitPrintStmt(stmt : Print) : R;
	visitReturnStmt(stmt : Return) : R;
	visitVarStmt(stmt : Var) : R;
	visitWhileStmt(stmt : While) : R;
}
export abstract class Stmt
{
   abstract accept<R>(visitor : Visitor<R>) : R;
}
export class Block extends Stmt {
	statements : Stmt[];
	constructor(statements : Stmt[]){
		super();
		this.statements = statements;
	}
	accept<R>(visitor : Visitor<R>) : R{
		return visitor.visitBlockStmt(this);
	}
}
export class Expression extends Stmt {
	expression : Expr;
	constructor(expression : Expr){
		super();
		this.expression = expression;
	}
	accept<R>(visitor : Visitor<R>) : R{
		return visitor.visitExpressionStmt(this);
	}
}
export class If extends Stmt {
	condition : Expr;
	thenBranch : Stmt;
	elseBranch : Stmt;
	constructor(condition : Expr, thenBranch : Stmt, elseBranch : Stmt){
		super();
		this.condition = condition;
		this.thenBranch = thenBranch;
		this.elseBranch = elseBranch;
	}
	accept<R>(visitor : Visitor<R>) : R{
		return visitor.visitIfStmt(this);
	}
}
export class Func extends Stmt {
	name : Token;
	params : Token[];
	body : Stmt[];
	constructor(name : Token, params : Token[], body : Stmt[]){
		super();
		this.name = name;
		this.params = params;
		this.body = body;
	}
	accept<R>(visitor : Visitor<R>) : R{
		return visitor.visitFuncStmt(this);
	}
}
export class Print extends Stmt {
	expression : Expr;
	constructor(expression : Expr){
		super();
		this.expression = expression;
	}
	accept<R>(visitor : Visitor<R>) : R{
		return visitor.visitPrintStmt(this);
	}
}
export class Return extends Stmt {
	keyword : Token;
	value : Expr;
	constructor(keyword : Token, value : Expr){
		super();
		this.keyword = keyword;
		this.value = value;
	}
	accept<R>(visitor : Visitor<R>) : R{
		return visitor.visitReturnStmt(this);
	}
}
export class Var extends Stmt {
	name : Token;
	initializer : Expr;
	constructor(name : Token, initializer : Expr){
		super();
		this.name = name;
		this.initializer = initializer;
	}
	accept<R>(visitor : Visitor<R>) : R{
		return visitor.visitVarStmt(this);
	}
}
export class While extends Stmt {
	condition : Expr;
	body : Stmt;
	constructor(condition : Expr, body : Stmt){
		super();
		this.condition = condition;
		this.body = body;
	}
	accept<R>(visitor : Visitor<R>) : R{
		return visitor.visitWhileStmt(this);
	}
}
