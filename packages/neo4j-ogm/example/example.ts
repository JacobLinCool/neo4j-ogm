import neo4j from "neo4j-driver";
import ora from "ora";
import { Pool } from "@jacoblincool/puddle";
import { DB, MANY, DBSchema, Vertex } from "../src";

const NEO4J_URI = "neo4j://db:7687";
const NEO4J_USER = "neo4j";
const NEO4J_PASSWORD = "password";

const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));

const db = new DB(driver)
	.define("User", {
		name: String(),
		email: String(),
		FOLLOWS: MANY("User", { since: new Date() }),
		OWN: MANY("Post"),
		LIKES: MANY("Post", { at: new Date() }),
		UPLOADS: MANY("Media", { at: new Date() }),
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
	});

type Schema = DBSchema<typeof db>;

const count = {
	user: 500,
	post: 5,
	media: 5,
};

main();

async function main() {
	await db.reset("DELETE ALL DATA");
	const start = Date.now();

	const users: Vertex<Schema, "User">[] = [];

	const spinner = ora("Creating users").start();
	let done = 0;
	const pool1 = new Pool(10);

	for (let i = 0; i < count.user; i++) {
		pool1.push(async () => {
			const user = await db.add("User", {
				name: `User ${i}`,
				email: `user-${i}@example.com`,
			});
			users.push(user);
			const posts = await Promise.all(
				Array.from({ length: count.post }, (_, j) =>
					db.add("Post", {
						title: `Post ${i}-${j}`,
						content: `Post ${i}-${j} content`,
					}),
				),
			);
			await Promise.all(
				posts.map((post, j_1) =>
					Promise.all([
						user.OWN(post),
						...Array.from({ length: count.media }, (__1, k) =>
							db
								.add("Media", {
									url: `https://example.com/${i}-${j_1}-${k}.png`,
									type: "image/png",
									size: BigInt(Math.floor(Math.random() * 10000000000)),
								})
								.then((media) =>
									Promise.all([
										user.UPLOADS(media, { at: new Date() }),
										post.INCLUDES(media),
									]),
								),
						),
					]),
				),
			);
			if (++done % 10 === 0) {
				spinner.text = `Creating users: ${done} / ${count.user}`;
			}
		});
	}

	await pool1.run();
	spinner.succeed(`Created ${count.user} users`);

	spinner.start("Creating follows");
	done = 0;
	let follows = 0;
	const pool2 = new Pool(10);
	for (let i = 0; i < count.user; i++) {
		pool2.push(async () => {
			const user = users[i];
			const targets = [
				...new Set(
					Array.from({ length: Math.floor(Math.random() * (count.user / 10)) }, () =>
						Math.floor(Math.random() * count.user),
					),
				),
			].filter((target) => target !== i);
			await Promise.all(
				targets.map((target) => user.FOLLOWS(users[target], { since: new Date() })),
			);
			follows += targets.length;

			spinner.text = `Creating follows (${follows}): ${++done} / ${count.user}`;
		});
	}
	await pool2.run();
	spinner.succeed(`Created ${follows} follows`);

	await db.close();
	await driver.close();
	console.log(`Elapsed: ${((Date.now() - start) / 1000).toFixed(1)} s`);
}
