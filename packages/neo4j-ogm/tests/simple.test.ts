import neo4j from "neo4j-driver";
import { DB, MANY, ONE } from "../src";
import type { DBSchema, Vertex } from "../src";

const NEO4J_URI = "neo4j://db:7687";
const NEO4J_USER = "neo4j";
const NEO4J_PASSWORD = "password";

const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));

afterAll(async () => {
	await db.close();
	await driver.close();
});

const db = new DB(driver)
	.define("User", {
		name: String(),
		email: String(),
		FOLLOWS: MANY("User", { since: new Date() }),
		OWN: MANY("Post"),
		LIKES: MANY("Post", { at: new Date() }),
	})
	.define("Post", {
		title: String(),
		content: String(),
		INCLUDES: MANY("Media"),
	})
	.define("Media", {
		url: String(),
		type: String(),
		size: BigInt(0),
		UPLOADED_BY: ONE("User"),
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
		size: BigInt(12345),
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

	test("add node", async () => {
		jacob = await db.add("User", JACOB);
		expect(jacob).toMatchObject(JACOB);
		expect(await jacob.$self()).toMatchObject(JACOB);

		alice = await db.add("User", ALICE);
		expect(alice).toMatchObject(ALICE);

		post = await db.add("Post", POST);
		expect(post).toMatchObject(POST);

		media = await db.add("Media", MEDIA);
		expect(media).toMatchObject(MEDIA);
	});

	test("fetch node", async () => {
		expect(await db.fetch(jacob, "User")).toMatchObject({ ...JACOB, $id: jacob.$id });
		expect(await db.fetch(alice, "User")).toMatchObject({ ...ALICE, $id: alice.$id });
		expect(await db.fetch(post, "Post")).toMatchObject({ ...POST, $id: post.$id });
		expect(await db.fetch(media, "Media")).toMatchObject({ ...MEDIA, $id: media.$id });
	});

	test("add relation", async () => {
		const own_rel = await jacob.OWN(post);
		expect(await own_rel.$from()).toMatchObject(JACOB);
		expect(await own_rel.$to()).toMatchObject(POST);

		const own_rels = await jacob.OWN();
		expect(own_rels).toHaveLength(1);
		expect(own_rel.$id).toEqual(own_rels[0].$id);
		expect(await own_rels[0].$from()).toMatchObject(JACOB);
		expect(await own_rels[0].$to()).toMatchObject(POST);

		const follows_rel = await alice.FOLLOWS(jacob, FOLLOWS);
		expect(follows_rel).toMatchObject(FOLLOWS);
		expect(await follows_rel.$self()).toMatchObject(FOLLOWS);
		expect(await follows_rel.$from()).toMatchObject(ALICE);
		expect(await follows_rel.$to()).toMatchObject(JACOB);
		expect(await alice.FOLLOWS()).toHaveLength(1);
		expect(await jacob.FOLLOWS()).toHaveLength(0);

		const uploaded_rel = await media.UPLOADED_BY(jacob);
		expect(await uploaded_rel.$from()).toMatchObject(MEDIA);
		expect(await uploaded_rel.$to()).toMatchObject(JACOB);
		expect((await media.UPLOADED_BY()).$id).toEqual(uploaded_rel.$id);
	});
});
