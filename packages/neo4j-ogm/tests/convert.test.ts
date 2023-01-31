import { types } from "neo4j-driver";
import { convert } from "../src";

describe("convert", () => {
	describe("to neo4j", () => {
		const data = {
			a: 1,
			b: "2",
			c: true,
			d: new Date(),
			e: BigInt(123),
			f: [1, 2, 3],
			g: {
				a: 1,
				b: "2",
				c: true,
				d: new Date(),
				e: BigInt(123),
				f: [1, 2, 3],
				g: {},
			},
		};

		test("convert", () => {
			expect(convert.neo4j(data)).toEqual({
				a: 1,
				b: "2",
				c: true,
				d: expect.any(types.DateTime),
				e: expect.any(types.Integer),
				f: [1, 2, 3],
				g: {
					a: 1,
					b: "2",
					c: true,
					d: expect.any(types.DateTime),
					e: expect.any(types.Integer),
					f: [1, 2, 3],
					g: {},
				},
			});
		});
	});

	describe("to js", () => {
		const data = {
			a: 1,
			b: "2",
			c: true,
			d: types.DateTime.fromStandardDate(new Date()),
			e: types.Integer.fromString("123"),
			f: [1, 2, 3],
			g: {
				a: 1,
				b: "2",
				c: true,
				d: types.DateTime.fromStandardDate(new Date()),
				e: types.Integer.fromString("123"),
				f: [1, 2, 3],
				g: {},
			},
		};

		test("convert", () => {
			expect(convert.js(data)).toEqual({
				a: 1,
				b: "2",
				c: true,
				d: expect.any(Date),
				e: expect.any(BigInt),
				f: [1, 2, 3],
				g: {
					a: 1,
					b: "2",
					c: true,
					d: expect.any(Date),
					e: expect.any(BigInt),
					f: [1, 2, 3],
					g: {},
				},
			});
		});
	});
});
