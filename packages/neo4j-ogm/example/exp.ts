import fs from "node:fs";
import path from "node:path";
import { PackedEntity, verify } from "course-pack";
import neo4j from "neo4j-driver";
import ora from "ora";
import { z } from "zod";
import { DB, MANY, ONE, DBSchema, Vertex } from "../src";
import { unique } from "./utils";

const NEO4J_URI = "neo4j://db:7687";
const NEO4J_USER = "neo4j";
const NEO4J_PASSWORD = "password";

const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));

const db = new DB(driver)
	.define("Teacher", {
		name: z.string().min(1).max(100),
	})
	.define("Program", {
		name: z.string().min(1).max(100),
	})
	.define("Provider", {
		name: z.string().min(1).max(100),
		UNDER: ONE("Provider"),
	})
	.define("Course", {
		name: z.string().min(1).max(100),
		description: z.string().min(0).max(10000),
		code: z.string().min(1).max(100),
		type: z.string().min(1).max(100),
		credit: z.number().min(0).max(100),
		INSTRUCTED_BY: MANY("Teacher", { year: z.bigint(), term: z.bigint() }),
		PROVIDED_BY: ONE("Provider"),
		PART_OF: MANY("Program"),
	});

type Schema = DBSchema<typeof db>;

main();

async function main() {
	const spinner = ora();

	spinner.start("Resetting database");
	await db.reset("DELETE ALL DATA");
	spinner.succeed("Database reset");

	spinner.start("Reading course pack");
	const raw = JSON.parse(fs.readFileSync(path.join(__dirname, "course-pack.json"), "utf-8"));
	spinner.succeed("Course pack read");

	spinner.start("Verifying course pack");
	const pack = verify(raw);
	spinner.succeed("Course pack verified");

	spinner.start("Creating teachers");
	const teachers = await db.add(
		"Teacher",
		unique(pack.teachers, "name").map(({ name }) => ({ name })),
	);
	const teacher_map = new Map(
		pack.teachers.map((t) => [t.id, teachers.find((v) => v.props.name === t.name)]),
	);
	spinner.succeed("Teachers created");

	spinner.start("Creating programs");
	const programs = await db.add(
		"Program",
		unique(pack.programs, "name").map(({ name }) => ({ name })),
	);
	const program_map = new Map(pack.programs.map(({ id }, i) => [id, programs[i]]));
	spinner.succeed("programs created");

	spinner.start("Creating providers");
	const providers: Vertex<Schema, "Provider">[] = [];
	const provider_map = new Map<string, Vertex<Schema, "Provider">>();
	const course_map = new Map<string, Vertex<Schema, "Course">>();
	const dummy: PackedEntity = { name: "Root Provider", children: pack.entities, courses: [] };
	providers.push(...(await db.add("Provider", { name: dummy.name })));
	provider_map.set(dummy.name, providers[0]);
	const queue = [dummy];
	while (queue.length > 0) {
		const node = queue.shift();
		if (node) {
			const vertex = provider_map.get(node.name);
			const children = await db.add(
				"Provider",
				node.children.map((child) => ({ name: child.name })),
			);
			for (const child of children) {
				providers.push(child);
				provider_map.set(child.props.name, child);
				if (vertex) {
					await child.UNDER(vertex);
				}
			}

			const siblings = new Set<string>();
			const new_courses = await db.add(
				"Course",
				node.courses
					.filter((course) => {
						if (siblings.has(course.name)) {
							return false;
						}
						siblings.add(course.name);
						return !course_map.has(course.code);
					})
					.map((course) => ({
						...course,
						teachers: undefined,
						programs: undefined,
						prerequisites: undefined,
						extra: undefined,
						year: undefined,
						term: undefined,
						id: undefined,
					})),
			);
			for (const course of new_courses) {
				course_map.set(course.props.code, course);
			}

			if (vertex) {
				await Promise.all(new_courses.map((course) => course.PROVIDED_BY(vertex)));
			}
			for (const c of new_courses) {
				const course = node.courses.find((course) => course.code === c.props.code);
				const programs = course?.programs
					.map((id) => program_map.get(id))
					.filter((p) => p !== undefined) as any[];
				if (programs) {
					await Promise.all(programs.map((p) => c.PART_OF(p)));
				}

				const teachers = course?.teachers
					.map((name) => teacher_map.get(name))
					.filter((x) => x !== undefined) as any[];

				if (teachers) {
					await Promise.all(
						teachers.map((t) =>
							c.INSTRUCTED_BY(t, {
								year: BigInt(course?.year || 0),
								term: BigInt(course?.term || 0),
							}),
						),
					);
				}
			}

			queue.push(...node.children);
		}

		spinner.text = `Pending Queue: ${queue.length}`;
	}
	spinner.succeed("Providers created");

	await driver.close();
}
