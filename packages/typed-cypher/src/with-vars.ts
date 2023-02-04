import { Trim } from "type-fest";
import { Var } from "./match-vars";

export type Prev = [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export type _WithVars<S extends string[], I extends number> = I extends -1
	? []
	: S[I] extends `${infer _X} ${"AS" | "as"} ${infer V}`
	? [..._WithVars<S, Prev[I]>, Var<Trim<V>, [], "Other">]
	: Trim<S[I]> extends "*" | ""
	? [..._WithVars<S, Prev[I]>]
	: [..._WithVars<S, Prev[I]>, Var<Trim<S[I]>, [], "Other">];

export type WithVars<S extends string[]> = _WithVars<S, 10>;
