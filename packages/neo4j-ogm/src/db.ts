import cuid from "cuid";
import debug from "debug";
import type { Session, Driver, Node, QueryResult, Relationship } from "neo4j-driver";
import { Params, Returns } from "typed-cypher";
import { z } from "zod";
import { convert } from "./convert";
import { NodeShape, RelationShape } from "./shape";
import { Empty, FullGraph, Vertex, OneOrMany, vertexify, PropValue } from "./types";

export class DB<Schema extends FullGraph = Empty> {
	/** This id (`$id`) generator function, defaults to cuid */
	public idgen: () => string = cuid;
	public readonly driver: Driver;
	public readonly database: string;
	/** The underlying sessions */
	public readonly sessions = new Set<Session>();
	public defs: Record<keyof Schema, NodeShape> = {} as any;
	protected log: {
		query: debug.Debugger;
	};

	/**
	 * @param driver The neo4j driver
	 * @param options The database to use and the number of sessions to use
	 */
	constructor(driver: Driver, { database = "neo4j" } = {}) {
		this.driver = driver;
		this.database = database;

		const dbg = debug("db");
		this.log = {
			query: dbg.extend("query"),
		};
	}

	/**
	 * Define a new node (vertex, entity) type
	 * @param name The name of the node type
	 * @param schema The schema of the node type
	 * @returns Self, for chaining
	 */
	public define<N extends string>(name: N): DB<Schema & { [k in N]: NodeShape<N> }>;
	public define<N extends string, L extends readonly string[]>(
		name: N,
		labels: L,
	): DB<Schema & { [k in N]: NodeShape<N, L> }>;
	public define<N extends string, P extends Record<string, PropValue | RelationShape>>(
		name: N,
		props: P,
	): DB<Schema & { [k in N]: NodeShape<N, [], P> }>;
	public define<
		N extends string,
		L extends readonly string[],
		P extends Record<string, PropValue | RelationShape>,
	>(name: N, labels: L, props: P): DB<Schema & { [k in N]: NodeShape<N, L, P> }>;
	public define(...args: any[]): any {
		// @ts-expect-error
		this.defs[args[0]] = new NodeShape(...args);
		return this;
	}

	/**
	 * Close all underlying sessions
	 */
	public async close() {
		await Promise.all([...this.sessions.values()].map((s) => s.close()));
	}

	/**
	 * Run a typed raw query
	 * @param query Query in Cypher
	 * @param params Parameters to pass to the query
	 */
	public async run<Q extends string>(
		query: Q,
		...params: keyof Params<Q> extends never ? [Record<string, unknown>?] : [Params<Q>]
	): Promise<
		QueryResult<
			keyof Returns<Q> extends never
				? {
						[key: string]: unknown;
				  }
				: {
						[key in keyof Returns<Q>]: Returns<Q>[key] extends "Node"
							? Node
							: Returns<Q>[key] extends "Relationship"
							? Relationship
							: unknown;
				  }
		>
	>;
	public async run(query: string, params?: Record<string, unknown>): Promise<QueryResult> {
		this.log.query(query, params);
		const session = this.driver.session({ database: this.database });
		this.sessions.add(session);
		const result = await session.run(query, convert.neo4j(params)).finally(() => {
			session.close().then(() => this.sessions.delete(session));
		});
		this.log.query("result", result);
		return result;
	}

	/**
	 * Delete all data in the database
	 * @param check string to confirm you want to delete all data
	 */
	async reset(check: "DELETE ALL DATA"): Promise<void> {
		if (check !== "DELETE ALL DATA") {
			throw new Error(
				"DANGER: You must pass `DELETE ALL DATA` to confirm you want to delete all data in the database",
			);
		}
		await this.run("MATCH (n) DETACH DELETE n");
	}

	/** `n` is returned as a node */
	_fetch($id: string): Promise<QueryResult<{ n: Node }>> {
		return this.run("MATCH (n) WHERE n.`$id` = $id RETURN n", {
			id: $id,
		});
	}

	/** `n` is returned as a node */
	_create(
		label: string,
		data: OneOrMany<Record<string, unknown>>,
	): Promise<QueryResult<{ n: Node }>> {
		return this.run(`UNWIND $props AS props CREATE (n:${label}) SET n = props RETURN n`, {
			props: Array.isArray(data)
				? data.map((d) => ({ ...d, $id: this.idgen() }))
				: [{ ...data, $id: this.idgen() }],
		});
	}

	/** `n` is returned as a node */
	_update(
		$id: string,
		data: Record<string, unknown>,
		old?: Record<string, unknown>,
	): Promise<QueryResult<{ n: Node }>> {
		return this.run(`MATCH (n) WHERE n.\`$id\` = $id SET n = $data RETURN n`, {
			id: $id,
			data: {
				...old,
				...data,
				$id,
			},
		});
	}

	/** `r` is returned as a relation */
	_link(
		from: string,
		to: string,
		rel: string,
		data: Record<string, unknown>,
	): Promise<QueryResult<{ r: Relationship; from: unknown; to: unknown }>> {
		return this.run(
			`MATCH (n), (m) WHERE n.\`$id\` = $from AND m.\`$id\` = $to CREATE (n)-[r:${rel} $data]->(m) RETURN r, $from as from, $to as to`,
			{
				from,
				to,
				data: {
					...data,
					$id: this.idgen(),
				},
			},
		);
	}

	/** `r` is returned as a relation */
	_update_link(
		$id: string,
		data: Record<string, unknown>,
		old?: Record<string, unknown>,
	): Promise<QueryResult<{ r: Relationship }>> {
		return this.run(`MATCH ()-[r]-() WHERE r.\`$id\` = $id SET r = $data RETURN r`, {
			id: $id,
			data: {
				...old,
				...data,
				$id,
			},
		});
	}

	/**
	 * Create a new node
	 * @returns This will always return an array, even if only one node was created
	 */
	async create<T extends keyof Schema>(
		type: T,
		data: OneOrMany<{
			[K in keyof Schema[T]["props"]]: Schema[T]["props"][K] extends z.ZodType
				? z.infer<Schema[T]["props"][K]>
				: never;
		}>,
	): Promise<Vertex<Schema, T>[]> {
		const result = await this._create(String(type), data);
		return result.records.map((r) => this.vertexify(r.get("n"), type));
	}

	async find<N extends keyof Schema>(
		label: N,
		query?: {
			where?: Partial<{
				[K in keyof Schema[N]["props"]]: Schema[N]["props"][K] extends z.ZodType
					? z.infer<Schema[N]["props"][K]>
					: never;
			}> & { $id?: string };
			limit?: number;
			order?: OneOrMany<[keyof Schema[N]["props"], "ASC" | "DESC"]>;
		},
	): Promise<Vertex<Schema, N>[]> {
		let statement = `MATCH (n:${String(label)})`;

		if (query?.where) {
			const fields = Object.keys(query.where);
			statement += ` WHERE ${fields
				.map((f) => `n.${String(f)} = $where.${String(f)}`)
				.join(" AND ")}`;
		}

		statement += ` RETURN n`;

		if (query?.order) {
			const fields = (Array.isArray(query.order[0]) ? query.order : [query.order]) as [
				keyof Schema[N]["props"],
				"ASC" | "DESC",
			][];

			statement += ` ORDER BY ${fields.map(([f, d]) => `n.${String(f)} ${d}`).join(", ")}`;
		}

		if (query?.limit) {
			statement += ` LIMIT ${query.limit}`;
		}

		const result = await this.run(statement, { where: query?.where || {} });
		return result.records.map((r) => this.vertexify(r.get("n") as Node, label));
	}

	async fetch<N extends keyof Schema>(
		node: { $id: string },
		label: N,
	): Promise<Vertex<Schema, N>> {
		const result = await this._fetch(node.$id);
		return this.vertexify(result.records[0].get("n"), label);
	}

	vertexify<N extends keyof Schema>(node: Node, name: N): Vertex<Schema, N> {
		return vertexify(this, name, node);
	}
}
