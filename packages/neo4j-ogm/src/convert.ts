import { types } from "neo4j-driver";

export const convert = {
	/** convert JS types to Neo4j types */
	neo4j: (value: any): any => {
		if (value instanceof Date) {
			return types.DateTime.fromStandardDate(value);
		}
		// if (typeof value === "bigint") {
		// 	return types.Integer.fromString(value.toString());
		// }
		if (Array.isArray(value)) {
			return value.slice().map(convert.neo4j);
		}
		if (typeof value === "object") {
			const result: Record<string, unknown> = {};
			for (const key in value) {
				result[key] = convert.neo4j(value[key]);
			}
			return result;
		}
		return value;
	},
	/** convert Neo4j types to JS types */
	js: (value: any): any => {
		if (value instanceof types.DateTime) {
			return value.toStandardDate();
		}
		if (value instanceof types.Integer) {
			return value.toBigInt();
		}
		if (Array.isArray(value)) {
			return value.slice().map(convert.js);
		}
		if (typeof value === "object") {
			const result: Record<string, unknown> = {};
			for (const key in value) {
				result[key] = convert.js(value[key]);
			}
			return result;
		}
		return value;
	},
};
