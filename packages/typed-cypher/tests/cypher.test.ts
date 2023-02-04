import { Cypher, CypherVars, TellVars } from "../src";

describe("Cypher", () => {
	test("match & return", () => {
		const cypher = new Cypher()
			.MATCH(
				"(me:Person)-[follows:FOLLOWS]->(others:Person:Public)-[:FOLLOWS]->(more:Person:Public)",
			)
			.MATCH("(x)-[rel:R]->(y)")
			.WHERE("follows.since", ">", "2020-01-01")
			.WHERE("a", ">", "b", "AND", "c", "<", "d")
			.RETURN("me", "more")
			.ORDER_BY(["me", "ASC"])
			.LIMIT(10);

		const query = cypher.build();

		expect(query).toBe(
			"MATCH (me:Person)-[follows:FOLLOWS]->(others:Person:Public)-[:FOLLOWS]->(more:Person:Public)\n" +
				"MATCH (x)-[rel:R]->(y)\n" +
				"WHERE follows.since > 2020-01-01\n" +
				"WHERE a > b AND c < d\n" +
				"RETURN me, more\n" +
				"ORDER BY me ASC\n" +
				"LIMIT 10",
		);

		type Vars = CypherVars<typeof cypher>;
		type VarsDescription = TellVars<Vars>;
	});
});
