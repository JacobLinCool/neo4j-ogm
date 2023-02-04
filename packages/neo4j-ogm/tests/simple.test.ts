import neo4j from "neo4j-driver";
import { z } from "zod";
import { DB, MANY, ONE } from "../src";
import type { DBSchema, Vertex } from "../src";

const NEO4J_URI = "neo4j://db:7687";
const NEO4J_USER = "neo4j";
const NEO4J_PASSWORD = "password";

const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));

const db = new DB(driver)
	.define("User", {
		name: z.string(),
		email: z.string(),
		FOLLOWS: MANY("User", { since: z.date() }),
		OWN: MANY("Post"),
		LIKES: MANY("Post", { at: z.date() }),
	})
	.define("Post", {
		title: z.string(),
		content: z.string(),
		INCLUDES: MANY("Media"),
	})
	.define("Media", {
		url: z.string(),
		type: z.string(),
		size: z.bigint(),
		UPLOADED_BY: ONE("User"),
	});

afterAll(async () => {
	await db.close();
	await driver.close();
});

describe("simple", () => {
	const JACOB = {
		name: "Jacob",
		email: "hi@jacoblin.cool",
	};
	const ALICE = {
		name: "Alice",
		email: "alice@jacoblin.cool",
	};
	const POST = {
		title: "Hello World",
		content: "This is my first post",
	};
	const MEDIA = {
		url: "https://jacoblin.cool/favicon.png",
		type: "image/png",
		size: 12345n,
	};
	const FOLLOWS = {
		since: new Date(),
	};

	type Schema = DBSchema<typeof db>;
	let jacob: Vertex<Schema, "User">;
	let alice: Vertex<Schema, "User">;
	let post: Vertex<Schema, "Post">;
	let media: Vertex<Schema, "Media">;

	test("reset confirm", async () => {
		// @ts-expect-error
		expect(db.reset()).rejects.toThrow();
	});

	test("reset", async () => {
		await db.reset("DELETE ALL DATA");
	});

	test("create node", async () => {
		[jacob] = await db.create("User", JACOB);
		expect(jacob.props).toMatchObject(JACOB);

		[alice] = await db.create("User", ALICE);
		expect(alice.props).toMatchObject(ALICE);

		[post] = await db.create("Post", POST);
		expect(post.props).toMatchObject(POST);

		[media] = await db.create("Media", MEDIA);
		expect(media.props).toMatchObject(MEDIA);
	});

	test("fetch node", async () => {
		expect(await db.fetch(jacob, "User")).toMatchObject({ props: JACOB, $id: jacob.$id });
		expect(await db.fetch(alice, "User")).toMatchObject({ props: ALICE, $id: alice.$id });
	});

	// test("create relation", async () => {
	// 	const own_rel = await jacob.OWN(post);
	// 	expect(await own_rel.$from()).toMatchObject(JACOB);
	// 	expect(await own_rel.$to()).toMatchObject(POST);

	// 	const own_rels = await jacob.OWN();
	// 	expect(own_rels).toHaveLength(1);
	// 	expect(own_rel.$id).toEqual(own_rels[0].$id);
	// 	expect(await own_rels[0].$from()).toMatchObject(JACOB);
	// 	expect(await own_rels[0].$to()).toMatchObject(POST);

	// 	const follows_rel = await alice.FOLLOWS(jacob, FOLLOWS);
	// 	expect(follows_rel).toMatchObject(FOLLOWS);
	// 	expect(await follows_rel.$self()).toMatchObject(FOLLOWS);
	// 	expect(await follows_rel.$from()).toMatchObject(ALICE);
	// 	expect(await follows_rel.$to()).toMatchObject(JACOB);
	// 	expect(await alice.FOLLOWS()).toHaveLength(1);
	// 	expect(await jacob.FOLLOWS()).toHaveLength(0);

	// 	const uploaded_rel = await media.UPLOADED_BY(jacob);
	// 	expect(await uploaded_rel.$from()).toMatchObject(MEDIA);
	// 	expect(await uploaded_rel.$to()).toMatchObject(JACOB);
	// 	expect((await media.UPLOADED_BY()).$id).toEqual(uploaded_rel.$id);
	// });

	test("update node", async () => {
		jacob.props.name = "Jacob Lin";
		await jacob.$push();
		expect(jacob.$synced).toBe(true);
		expect((await jacob.$pull()).props).toMatchObject({ ...JACOB, name: "Jacob Lin" });
	});

	// test("update relation", async () => {
	// 	const follows_rel = await alice.FOLLOWS();
	// 	const since = new Date();
	// 	await follows_rel[0].$update({ since });
	// 	expect(follows_rel[0]).toMatchObject({ since });
	// 	expect(await follows_rel[0].$self()).toMatchObject({ since });
	// });

	describe("find node", () => {
		test("find by label", async () => {
			const users = await db.find("User");
			expect(users).toHaveLength(2);
		});

		test("find by label and prop", async () => {
			const users = await db.find("User", {
				where: { name: "Jacob Lin" },
			});
			expect(users).toHaveLength(1);
		});

		test("sort by name", async () => {
			const users = await db.find("User", {
				order: ["name", "ASC"],
			});
			expect(users[0].props).toMatchObject(ALICE);
			expect(users[1].props.name).toEqual("Jacob Lin");
		});

		test("sort by name and email", async () => {
			const users = await db.find("User", {
				order: [
					["name", "DESC"],
					["email", "ASC"],
				],
			});
			expect(users[0].props.name).toEqual("Jacob Lin");
			expect(users[1].props).toMatchObject(ALICE);
		});

		test("limit results", async () => {
			const users = await db.find("User", {
				limit: 1,
			});
			expect(users).toHaveLength(1);
		});

		test("no matched", async () => {
			const users = await db.find("User", {
				where: { name: "" },
			});
			expect(users).toHaveLength(0);
		});
	});

	// test("delete relation", async () => {
	// 	const rel = await alice.FOLLOWS();
	// 	await rel[0].$delete();
	// 	expect(await alice.FOLLOWS()).toHaveLength(0);
	// });

	test("delete node", async () => {
		await jacob.$delete();
		expect(
			await db.find("User", {
				where: {
					name: "Jacob Lin",
				},
			}),
		).toHaveLength(0);
	});
});
