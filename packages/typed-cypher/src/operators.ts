export type Operator =
	| "="
	| "<>"
	| "<"
	| "<="
	| ">"
	| ">="
	| "IS NULL"
	| "IS NOT NULL"
	| StringOperator;

export type StringOperator = "STARTS WITH" | "ENDS WITH" | "CONTAINS" | "=~";

export type BooleanOperator = "AND" | "OR" | "XOR" | "NOT";
