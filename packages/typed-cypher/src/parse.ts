import type { Split, Trim } from "type-fest";
import type { Clause, SubClause } from "./keywords";
import type { Vars } from "./match-vars";

type Key = Clause | SubClause | "PROFILE";

type EX =
	"PROFILE MATCH p=(start)-[*]->(finish) WHERE start.name = 'A' AND finish.name = 'D' FOREACH (n IN nodes(p) | SET n.marked = true)";

type Includes<S extends string, T extends string> = S extends `${infer _}${T}${infer _}`
	? true
	: false;
type StartsWith<S extends string, T extends string> = S extends `${T}${infer _}` ? true : false;

export type Content<S extends string> = StartsWith<Trim<S>, Key> extends true
	? Trim<S> extends `${infer A} ${infer B}`
		? [A, ...Content<B>]
		: [Trim<S>]
	: Trim<S> extends `${infer A}${"" | ` ${Key}${infer _}`}`
	? [[A]]
	: [];

type X = Content<EX>;

export type IsMatch<S extends string> = Trim<S> extends `MATCH ${infer _}` ? true : false;
export type IsOptionalMatch<S extends string> = Trim<S> extends `OPTIONAL MATCH ${infer _}`
	? true
	: false;
export type IsWith<S extends string> = Trim<S> extends `WITH ${infer _}` ? true : false;
export type IsUnwind<S extends string> = Trim<S> extends `UNWIND ${infer _}` ? true : false;
export type IsWhere<S extends string> = Trim<S> extends `WHERE ${infer _}` ? true : false;
export type IsReturn<S extends string> = Trim<S> extends `RETURN ${infer _}` ? true : false;
export type IsCreate<S extends string> = Trim<S> extends `CREATE ${infer _}` ? true : false;
export type IsDelete<S extends string> = Trim<S> extends `DELETE ${infer _}` ? true : false;
export type IsRemove<S extends string> = Trim<S> extends `REMOVE ${infer _}` ? true : false;
export type IsSet<S extends string> = Trim<S> extends `SET ${infer _}` ? true : false;
export type IsMerge<S extends string> = Trim<S> extends `MERGE ${infer _}` ? true : false;
export type IsCall<S extends string> = Trim<S> extends `CALL ${infer _}` ? true : false;
export type IsYield<S extends string> = Trim<S> extends `YIELD ${infer _}` ? true : false;

export type Parse<S extends string> = IsMatch<S> extends true
	? ParseMatch<S>
	: IsOptionalMatch<S> extends true
	? ParseOptionalMatch<S>
	: IsWith<S> extends true
	? ParseWith<S>
	: IsUnwind<S> extends true
	? ParseUnwind<S>
	: IsWhere<S> extends true
	? ParseWhere<S>
	: IsReturn<S> extends true
	? ParseReturn<S>
	: IsCreate<S> extends true
	? ParseCreate<S>
	: IsDelete<S> extends true
	? ParseDelete<S>
	: IsRemove<S> extends true
	? ParseRemove<S>
	: IsSet<S> extends true
	? ParseSet<S>
	: IsMerge<S> extends true
	? ParseMerge<S>
	: IsCall<S> extends true
	? ParseCall<S>
	: IsYield<S> extends true
	? ParseYield<S>
	: [];

export type ParseMatch<S extends string> = Split<Trim<S>, "MATCH ">;
