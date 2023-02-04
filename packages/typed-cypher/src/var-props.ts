import { Var, VarType } from "./match-vars";

export type VarProps<
	V extends Var<string, string[], VarType>,
	P extends Record<string, unknown> = Record<string, unknown>,
> = V extends Var<infer Name, infer _Labels, infer _Type>
	? Name | `${Name}.${keyof P & string}` | `${Name}[${(keyof P & string) | number}]`
	: never;
