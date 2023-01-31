import cuid from "cuid";
import debug from "debug";
import type { Session, Driver, Node, Relationship, QueryResult } from "neo4j-driver";
import { convert } from "./convert";
import type { Empty, Graph, GraphNode, Prop, PropOnly, Vertex } from "./types";

export class DB<Schema extends Graph = Empty> {
	public readonly sessions: Session[];
	protected session_index = 0;
	protected _defs: Record<keyof Schema, GraphNode> = {} as any;
	protected log: {
		query: debug.Debugger;
	};

	constructor(driver: Driver, { database = "neo4j", concurrency = 5 } = {}) {
		this.sessions = Array.from({ length: concurrency }, () => driver.session({ database }));

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
	public define<N extends string, T extends GraphNode>(
		name: N,
		schema: T,
	): DB<Schema & { [k in N]: T }> {
		this._defs[name] = schema;
		// @ts-expect-error
		return this;
	}

	/**
	 * Close all underlying sessions
	 */
	public async close() {
		await Promise.all(this.sessions.map((s) => s.close()));
	}

	/**
	 * Run a raw query
	 * @param query Query in Cypher
	 * @param params Parameters to pass to the query
	 */
	public async run(query: string, params?: Record<string, unknown>): Promise<QueryResult> {
		this.log.query(query, params);
		const result = await this.sessions[this.session_index++ % this.sessions.length].run(
			query,
			convert.neo4j(params),
		);
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
	_fetch($id: string): Promise<QueryResult> {
		return this.run("MATCH (n) WHERE n.`$id` = $id RETURN n", {
			id: $id,
		});
	}

	/** `n` is returned as a node */
	_add(label: string, data: Record<string, unknown>): Promise<QueryResult> {
		return this.run(`CREATE (n:${label} $data) RETURN n`, {
			data: {
				...data,
				$id: cuid(),
			},
		});
	}

	/** `r` is returned as a relation */
	_link(
		from: string,
		to: string,
		rel: string,
		data: Record<string, unknown>,
	): Promise<QueryResult> {
		return this.run(
			`MATCH (n), (m) WHERE n.\`$id\` = $from AND m.\`$id\` = $to CREATE (n)-[r:${rel} $data]->(m) RETURN r, $from as from, $to as to`,
			{
				from,
				to,
				data: {
					...data,
					$id: cuid(),
				},
			},
		);
	}

	async add<N extends keyof Schema>(
		label: N,
		data: PropOnly<Schema[N]>,
	): Promise<Vertex<Schema, N>> {
		const result = await this._add(String(label), data);
		return this.vertexify(result.records[0].get("n"), label);
	}

	async fetch<N extends keyof Schema>(
		node: { $id: string },
		label: N,
	): Promise<Vertex<Schema, N>> {
		const result = await this._fetch(node.$id);
		return this.vertexify(result.records[0].get("n"), label);
	}

	vertexify<N extends keyof Schema>(node: Node, name: N): Vertex<Schema, N> {
		const props = convert.js(node.properties);
		const schema = this._defs[name];
		// @ts-expect-error - will add other properties to this object later
		const vertex: Vertex<Schema, N> = {};
		for (const key in schema) {
			const prop = schema[key];
			if (typeof prop === "object" && "$rel" in prop) {
				if (prop.$rel === "many") {
					// @ts-expect-error
					vertex[key] = async (
						target?: Vertex<any, any>,
						data?: Record<never, never>,
					) => {
						if (target) {
							const result = await this._link(props.$id, target.$id, key, data || {});
							return this.relationify(
								result.records[0].get("r"),
								prop.schema as any,
								result.records[0].get("from"),
								result.records[0].get("to"),
							);
						} else {
							const result = await this.run(
								`MATCH (n)-[r:${key}]->(m) WHERE n.\`$id\` = $id RETURN r, n.\`$id\` as from, m.\`$id\` as to`,
								{
									id: props.$id,
								},
							);

							const relations = [];
							for await (const record of result.records) {
								relations.push(
									this.relationify(
										record.get("r"),
										prop.schema as any,
										record.get("from"),
										record.get("to"),
									),
								);
							}

							return relations;
						}
					};
				} else {
					// @ts-expect-error
					vertex[key] = async (
						target?: Vertex<any, any>,
						data?: Record<never, never>,
					) => {
						if (target) {
							const result = await this._link(props.$id, target.$id, key, data || {});
							return this.relationify(
								result.records[0].get("r"),
								prop.schema as any,
								result.records[0].get("from"),
								result.records[0].get("to"),
							);
						} else {
							const result = await this.run(
								`MATCH (n)-[r:${key}]->(m) WHERE n.\`$id\` = $id RETURN r, n.\`$id\` as from, m.\`$id\` as to`,
								{
									id: props.$id,
								},
							);

							return this.relationify(
								result.records[0].get("r"),
								prop.schema as any,
								result.records[0].get("from"),
								result.records[0].get("to"),
							);
						}
					};
				}
			} else {
				vertex[key] = props[key];
			}
		}

		Object.assign(vertex, {
			$id: props.$id,
			$self: async () => this.fetch({ $id: props.$id }, node.labels[0] as any),
			$schema: schema,
		});

		return vertex;
	}

	relationify<RelSchema extends Record<string, Prop>>(
		relation: Relationship,
		schema: RelSchema,
		from: string,
		to: string,
	): unknown {
		const props = convert.js(relation.properties);

		const rel = {
			...props,
		} as Record<string, unknown>;

		Object.assign(rel, {
			$id: props.$id,
			$self: async () => {
				const result = await this.run(
					"MATCH (n)-[r]->(m) WHERE r.`$id` = $id RETURN r, n.`$id` as from, m.`$id` as to",
					{
						id: props.$id,
					},
				);
				return this.relationify(
					result.records[0].get("r"),
					schema,
					result.records[0].get("from"),
					result.records[0].get("to"),
				);
			},
			$schema: schema,
			$from: async () => {
				const result = await this._fetch(from);
				const n = result.records[0].get("n");
				return this.vertexify(n, n.labels[0]);
			},
			$to: async () => {
				const result = await this._fetch(to);
				const n = result.records[0].get("n");
				return this.vertexify(n, n.labels[0]);
			},
		});

		return rel;
	}
}
