import { Trim, Simplify } from "type-fest";
import { Clause, SubClause } from "./keywords";

export type Node = "Node";
export type Relationship = "Relationship";
export type Unknown = unknown;

export type Keyword = Clause | SubClause | "PROFILE";

export type ParseClauses<Q extends string> = Trim<Q> extends `${Keyword}${infer P}`
	? Q extends `${infer K}${P}`
		? Trim<K> extends Keyword
			? [
					[Trim<K>, ParseValue<P>],
					...ParseClauses<P extends `${infer _}${ParseValue<P>}${infer T}` ? T : "">,
			  ]
			: []
		: []
	: [];

export type ParseValue<Q extends string> = Trim<Q> extends `${infer P}${Keyword}${infer _}`
	? P extends `${infer _}${Keyword}${infer _}`
		? never
		: Trim<P>
	: Trim<Q>;

export type ParseVars<
	C extends [string, string][],
	Vars extends Record<string, Node | Relationship | Unknown> = {},
> = Simplify<
	C extends [infer H, ...infer T]
		? H extends [infer K, infer V]
			? K extends "MATCH" | "MERGE" | "CREATE"
				? T extends [string, string][]
					? ParseVars<T, Vars & ParseMatchVars<V>>
					: Vars & ParseMatchVars<V>
				: K extends "WITH" | "RETURN"
				? T extends [string, string][]
					? ParseVars<T, ParseWithVars<V, Vars>>
					: ParseWithVars<V, Vars>
				: T extends [string, string][]
				? ParseVars<T, Vars>
				: Vars
			: Vars
		: Vars
>;

export type ParseMatchVars<Q> = ParseMatchNodeVars<Q> & ParseMatchRelationshipVars<Q>;

export type ParseMatchNodeVars<Q> = Q extends `${infer _}(${infer V})${infer Tail}`
	? V extends `${infer Var}:${infer Labels}`
		? { [X in Trim<Var>]: Node } & ParseMatchNodeVars<Tail>
		: V extends `${infer Var}{${infer Props}}`
		? { [X in Trim<Var>]: Node } & ParseMatchNodeVars<Tail>
		: { [X in Trim<V>]: Node } & ParseMatchNodeVars<Tail>
	: {};

export type ParseMatchRelationshipVars<Q> = Q extends `${infer _}[${infer V}]${infer Tail}`
	? V extends `${infer Var}:${infer Labels}`
		? { [X in Trim<Var>]: Relationship } & ParseMatchRelationshipVars<Tail>
		: V extends `${infer Var}{${infer Props}}`
		? { [X in Trim<Var>]: Relationship } & ParseMatchRelationshipVars<Tail>
		: { [X in Trim<V>]: Relationship } & ParseMatchRelationshipVars<Tail>
	: {};

export type ParseWithVars<Q, Vars> = Q extends `${infer Head},${infer Tail}`
	? ParseWithVars<Head, Vars> & ParseWithVars<Tail, Vars>
	: Q extends `${infer Var} ${"AS" | "as"} ${infer Name}`
	? {
			[X in Trim<Name>]: Trim<Var> extends keyof Vars ? Vars[Trim<Var>] : Unknown;
	  }
	: Q extends `${infer Var}`
	? Trim<Var> extends keyof Vars
		? {
				[X in Trim<Var>]: Trim<Var> extends keyof Vars ? Vars[Trim<Var>] : Unknown;
		  }
		: Trim<Var> extends "*"
		? Vars
		: { [X in Trim<Var>]: Unknown }
	: {};

/**
 * Get living variables with their types from a Cypher query
 * @example
 * ```ts
 * type Q = "PROFILE MATCH (person:Person)-[r]->(other:Person:Public {prop: 123}) WITH *, r AS x, type(r) AS types RETURN *";
 * type V = Vars<Q>;
 * //   ^? type V = {
 * //          person: Node;
 * //          other: Node;
 * //          r: Relationship;
 * //          x: Relationship;
 * //          types: Unknown;
 * //      }
 * ```
 */
export type Vars<Q extends string> = ParseVars<ParseClauses<Q>>;
