import type { Var, VarType, Vars } from "./match-vars";
import type { Operator } from "./operators";
import type { VarProps } from "./var-props";
import type { WithVars } from "./with-vars";

export type CypherVars<C extends Cypher> = C extends Cypher<infer V> ? V : never;

export class Cypher<Variables extends Var<string, string[], VarType>[] = []> {
	public statements: string[][] = [];

	public build(): string {
		return this.statements.map((statement) => statement.join(" ")).join("\n");
	}

	public match<S extends string[]>(...statements: S): Cypher<[...Variables, ...Vars<S[number]>]> {
		for (const statement of statements) {
			this.statements.push(["MATCH", statement]);
		}
		return this;
	}
	public MATCH = this.match;

	public optionalMatch<S extends string[]>(
		...statements: S
	): Cypher<[...Variables, ...Vars<S[number]>]> {
		for (const statement of statements) {
			this.statements.push(["OPTIONAL MATCH", statement]);
		}
		return this;
	}
	public OPTIONAL_MATCH = this.optionalMatch;

	public with<S extends string[]>(
		...statements: S
	): Cypher<[...("*" extends S[number] ? Variables : []), ...WithVars<S>]> {
		this.statements.push(["WITH", statements.join(", ")]);
		return this;
	}
	public WITH: <S extends string[]>(
		...statements: S
	) => Cypher<[...("*" extends S[number] ? Variables : []), ...WithVars<S>]> = this.with;

	public unwind<S extends string[]>(...statement: S): Cypher<[...Variables, ...WithVars<S>]> {
		this.statements.push(["UNWIND", ...statement]);
		return this;
	}
	public UNWIND: <S extends string[]>(
		...statements: S
	) => Cypher<[...("*" extends S[number] ? Variables : []), ...WithVars<S>]> = this.unwind;

	public where<S extends VarProps<Variables[number]>>(
		subject: S,
		operator: Operator,
		value: string | number | boolean | BigInt | Date,
	): this;
	public where<S extends string[]>(...statements: S): this;
	public where<S extends string[]>(...statements: S): this {
		this.statements.push(["WHERE", statements.join(" ")]);
		return this;
	}
	public WHERE = this.where;

	public orderBy<V extends [VarProps<Variables[number]>, "ASC" | "DESC"][]>(...vars: V): this;
	public orderBy<S extends [string, "ASC" | "DESC"][]>(...vars: S): this;
	public orderBy(...vars: [string, "ASC" | "DESC"][]): this {
		this.statements.push(["ORDER BY", vars.map((v) => v.join(" ")).join(", ")]);
		return this;
	}
	public ORDER_BY = this.orderBy;

	public return<V extends VarProps<Variables[number]>[]>(...vars: V): this;
	public return<S extends string[]>(...statements: S): this;
	public return<V extends string[]>(...vars: V): this {
		this.statements.push(["RETURN", vars.join(", ")]);
		return this;
	}
	public RETURN = this.return;

	public skip(skip: number): this;
	public skip(expression: string): this;
	public skip(skip: number | string): this {
		this.statements.push(["SKIP", skip.toString()]);
		return this;
	}

	public limit(limit: number): this;
	public limit(expression: string): this;
	public limit(limit: number | string): this {
		this.statements.push(["LIMIT", limit.toString()]);
		return this;
	}
	public LIMIT = this.limit;

	public create<S extends string[]>(
		...statements: S
	): Cypher<[...Variables, ...Vars<S[number]>]> {
		for (const statement of statements) {
			this.statements.push(["CREATE", statement]);
		}
		return this;
	}
	public CREATE = this.create;

	public delete<V extends Variables[number]["name"][]>(...vars: V): this;
	public delete<S extends string[]>(...statements: S): this;
	public delete<V extends string[]>(...vars: V): this {
		this.statements.push(["DELETE", vars.join(", ")]);
		return this;
	}
	public DELETE = this.delete;

	public detachDelete<V extends Variables[number]["name"][]>(...vars: V): this;
	public detachDelete<S extends string[]>(...statements: S): this;
	public detachDelete<V extends string[]>(...vars: V): this {
		this.statements.push(["DETACH DELETE", vars.join(", ")]);
		return this;
	}
	public DETACH_DELETE = this.detachDelete;

	public set<S extends VarProps<Variables[number]>>(
		subject: S,
		operator: Operator,
		value: string | number | boolean | BigInt | Date,
	): this;
	public set<S extends string[]>(...statements: S): this;
	public set<S extends string[]>(...statements: S): this {
		this.statements.push(["SET", statements.join(" ")]);
		return this;
	}
	public SET = this.set;

	public remove<V extends VarProps<Variables[number]>[]>(...vars: V): this;
	public remove<S extends string[]>(...statements: S): this {
		this.statements.push(["REMOVE", statements.join(", ")]);
		return this;
	}
	public REMOVE = this.remove;

	public profile(): this {
		this.statements.push(["PROFILE"]);
		return this;
	}
	public PROFILE = this.profile;

	public x(...statements: string[]): this {
		this.statements.push(statements);
		return this;
	}
	public X = this.x;
}

export const C = () => new Cypher();
