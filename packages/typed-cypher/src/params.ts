import { AlphabetLiteral, NumberLiteral, SymbolLiteral } from "./literals";

export type IsValidVariableName<T extends string, First = true> = T extends `${infer A}${infer B}`
	? First extends true
		? A extends AlphabetLiteral
			? IsValidVariableName<B, false>
			: false
		: A extends AlphabetLiteral | NumberLiteral | SymbolLiteral
		? IsValidVariableName<B, false>
		: false
	: true;

export type ParamName<T extends string, R extends string> = T extends `${infer A}${infer B}`
	? A extends AlphabetLiteral | NumberLiteral | SymbolLiteral
		? ParamName<B, `${R}${A}`>
		: R
	: R;

export type ParamNames<Q extends string> = Q extends `${infer _}$${infer P}`
	? Q extends `${infer _}\`${infer _}$${ParamName<P, "">}${infer _}\`${infer Tail}`
		? ParamNames<Tail>
		: ParamName<P, ""> extends ""
		? ParamNames<P>
		: IsValidVariableName<ParamName<P, "">> extends true
		? [ParamName<P, "">, ...ParamNames<P>]
		: ParamNames<P>
	: [];

/**
 * Get parameters from a Cypher query.
 * @example
 * ```ts
 * type Q = "MATCH (n:Person {name: $name})-[:ACTED_IN]->(m:Movie {title: $title}) RETURN n.`$id`, m";
 * type P = Params<Q>;
 * //   ^? type P = { name: unknown; title: unknown; }
 * ```
 */
export type Params<Q extends string> = {
	[K in ParamNames<Q>[number]]: unknown;
};
