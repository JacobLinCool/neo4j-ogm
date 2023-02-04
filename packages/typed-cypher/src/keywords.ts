export type Clause =
	| "CALL"
	| "CREATE"
	| "DELETE"
	| "DETACH"
	| "FOREACH"
	| "LOAD"
	| "MATCH"
	| "MERGE"
	| "OPTIONAL"
	| "REMOVE"
	| "RETURN"
	| "SET"
	| "START"
	| "UNION"
	| "UNWIND"
	| "WITH";

export type SubClause = "LIMIT" | "ORDER" | "SKIP" | "WHERE" | "YIELD";

export type Modifier = "ASC" | "ASCENDING" | "ASSERT" | "BY" | "CSV" | "DESC" | "DESCENDING" | "ON";

export type Expression = "ALL" | "CASE" | "COUNT" | "ELSE" | "END" | "EXISTS" | "THEN" | "WHEN";
