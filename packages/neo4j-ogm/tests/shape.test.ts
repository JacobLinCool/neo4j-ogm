import { z } from "zod";
import { ONE, MANY } from "../src/relation";
import { NodeShape } from "../src/shape";

describe("relation shape", () => {
	test("ONE", () => {
		const a = ONE("User");
		expect(a.many).toBe(false);
		expect(a.to).toBe("User");
		expect(a.labels).toEqual([]);
		expect(a.props).toEqual({});

		const b = ONE("User", ["A", "B"]);
		expect(b.many).toBe(false);
		expect(b.to).toBe("User");
		expect(b.labels).toEqual(["A", "B"]);
		expect(b.props).toEqual({});

		const c = ONE("User", { a: z.number(), b: z.string() });
		expect(c.many).toBe(false);
		expect(c.to).toBe("User");
		expect(c.labels).toEqual([]);
		expect(JSON.stringify(c.props)).toEqual(JSON.stringify({ a: z.number(), b: z.string() }));

		const d = ONE("User", ["A", "B"], { a: z.number(), b: z.string() });
		expect(d.many).toBe(false);
		expect(d.to).toBe("User");
		expect(d.labels).toEqual(["A", "B"]);
		expect(JSON.stringify(d.props)).toEqual(JSON.stringify({ a: z.number(), b: z.string() }));
	});

	test("MANY", () => {
		const a = MANY("User");
		expect(a.many).toBe(true);
		expect(a.to).toBe("User");
		expect(a.labels).toEqual([]);
		expect(a.props).toEqual({});

		const b = MANY("User", ["A", "B"]);
		expect(b.many).toBe(true);
		expect(b.to).toBe("User");
		expect(b.labels).toEqual(["A", "B"]);
		expect(b.props).toEqual({});

		const c = MANY("User", { a: z.number(), b: z.string() });
		expect(c.many).toBe(true);
		expect(c.to).toBe("User");
		expect(c.labels).toEqual([]);
		expect(JSON.stringify(c.props)).toEqual(JSON.stringify({ a: z.number(), b: z.string() }));

		const d = MANY("User", ["A", "B"], { a: z.number(), b: z.string() });
		expect(d.many).toBe(true);
		expect(d.to).toBe("User");
		expect(d.labels).toEqual(["A", "B"]);
		expect(JSON.stringify(d.props)).toEqual(JSON.stringify({ a: z.number(), b: z.string() }));
	});
});

describe("node shape", () => {
	test("basic", () => {
		const a = new NodeShape("User");
		expect(a.name).toBe("User");
		expect(a.labels).toEqual([]);
		expect(a.props).toEqual({});
		expect(a.rels).toEqual({});

		const b = new NodeShape("User", ["A", "B"]);
		expect(b.name).toBe("User");
		expect(b.labels).toEqual(["A", "B"]);
		expect(b.props).toEqual({});
		expect(b.rels).toEqual({});

		const c = new NodeShape("User", { a: z.number(), b: z.string() });
		expect(c.name).toBe("User");
		expect(c.labels).toEqual([]);
		expect(JSON.stringify(c.props)).toEqual(JSON.stringify({ a: z.number(), b: z.string() }));
		expect(c.rels).toEqual({});

		const d = new NodeShape("User", ["A", "B"], { a: z.number(), b: z.string() });
		expect(d.name).toBe("User");
		expect(d.labels).toEqual(["A", "B"]);
		expect(JSON.stringify(d.props)).toEqual(JSON.stringify({ a: z.number(), b: z.string() }));
		expect(d.rels).toEqual({});
	});

	test("has relations", () => {
		const a = new NodeShape("User", {
			name: z.string(),
			FOLLOWS: ONE("User", { since: z.date() }),
		});
		expect(a.name).toBe("User");
		expect(a.labels).toEqual([]);
		expect(JSON.stringify(a.props)).toEqual(JSON.stringify({ name: z.string() }));
		expect(JSON.stringify(a.rels)).toEqual(
			JSON.stringify({ FOLLOWS: ONE("User", { since: z.date() }) }),
		);

		const b = new NodeShape("User", ["A", "B"], {
			name: z.string(),
			FOLLOWS: MANY("User", { since: z.date() }),
		});
		expect(b.name).toBe("User");
		expect(b.labels).toEqual(["A", "B"]);
		expect(JSON.stringify(b.props)).toEqual(JSON.stringify({ name: z.string() }));
		expect(JSON.stringify(b.rels)).toEqual(
			JSON.stringify({ FOLLOWS: MANY("User", { since: z.date() }) }),
		);
	});
});
