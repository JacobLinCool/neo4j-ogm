import { Trim, Join, Split } from "type-fest";

export type VarType = "Node" | "Relationship" | "Other";

/**
 * An internal type used to represent a variable in a Cypher query.
 */
export type Var<
	Name extends string,
	Labels extends string[],
	Type extends VarType,
> = Name extends ""
	? never
	: {
			name: Name;
			labels: Labels;
			type: Type;
	  };

/**
 * Tell the type of a variable in human-readable form.
 */
export type TellVar<V extends Var<string, string[], VarType>> = V["labels"] extends []
	? `Variable '${V["name"]}' is a ${V["type"]}`
	: `Variable '${V["name"]}' is a ${V["type"]} with label ${Join<V["labels"], ", ">}`;

/**
 * Tell the type of a list of variables in human-readable form.
 */
export type TellVars<V extends Var<string, string[], VarType>[]> = {
	[K in keyof V]: TellVar<V[K]>;
};

/**
 * Extract the node variables from a Cypher query.
 */
export type NodeVars<Q extends string> = Q extends `${infer _Head}(${infer E})${infer Tail}`
	? Split<Trim<E>, "{" | " ">[0] extends `${infer V}:${infer Labels}`
		? [Var<V, Split<Trim<Labels>, ":">, "Node">, ...NodeVars<Tail>]
		: [Var<Trim<Split<E, "{" | " ">[0]>, [], "Node">, ...NodeVars<Tail>]
	: [];

/**
 * Extract the relationship variables from a Cypher query.
 */
export type RelVars<Q extends string> = Q extends `${infer _Head}[${infer E}]${infer Tail}`
	? Split<Trim<E>, "{" | " ">[0] extends `${infer V}:${infer Labels}`
		? [Var<V, Split<Trim<Labels>, ":">, "Relationship">, ...RelVars<Tail>]
		: [Var<Trim<Split<E, "{" | " ">[0]>, [], "Relationship">, ...RelVars<Tail>]
	: [];

/**
 * Extract the variables from a Cypher query.
 */
export type Vars<Q extends string> = [...NodeVars<Q>, ...RelVars<Q>];
