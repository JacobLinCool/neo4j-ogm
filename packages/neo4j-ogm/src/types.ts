import type { Node as Neo4jNode } from "neo4j-driver";
import type { Simplify } from "type-fest";
import type {
	ZodString,
	ZodNumber,
	ZodBoolean,
	ZodBigInt,
	ZodDate,
	ZodArray,
	z,
	ZodType,
} from "zod";
import { convert } from "./convert";
import type { DB } from "./db";
import type { NodeShape, RelationShape } from "./shape";

export type Labels = string[];

export type PropValue =
	| ZodString
	| ZodNumber
	| ZodBoolean
	| ZodBigInt
	| ZodDate
	| ZodArray<PropValue>;

export type Empty = Record<never, never>;

export type OneOrMany<T> = T | T[];

export type FullGraph = {
	[key: string]: NodeShape;
};

export class _Vertex<
	GraphSchema extends FullGraph,
	NodeName extends keyof GraphSchema,
	Node extends GraphSchema[NodeName] = GraphSchema[NodeName],
> {
	protected db: DB<GraphSchema>;
	name: NodeName;
	/** The labels of this vertex (node) */
	labels: Node["labels"];
	/** The properties of this vertex (node) */
	props: {
		[K in keyof Node["props"]]: Node["props"][K] extends ZodType
			? z.infer<Node["props"][K]>
			: never;
	};
	/** The unique identifier of this vertex (node) */
	readonly $id: string;
	/** The sync state of the vertex, `true` if all local changes are synced with the database */
	$synced: boolean;

	constructor(db: DB<GraphSchema>, name: NodeName, node: Neo4jNode) {
		const props = convert.js(node.properties);
		this.$id = props.$id;
		this.$synced = true;

		this.db = db;
		this.name = name;
		this.labels = node.labels;

		delete props.$id;
		this.props = new Proxy(props, {
			set: (target, prop, value) => {
				target[prop] = value;
				this.$synced = false;
				return true;
			},
		});

		const schema = db.defs[name];
		for (const rel in schema.rels) {
			// @ts-expect-error
			this[rel] = async (to?: Vertex, props?: Record<string, unknown>) => {
				if (!to) {
					const result = await this.db.run(
						`MATCH (from)-[rel:${rel}]->(to)
						WHERE from.\`$id\` = $from
						RETURN rel`,
						{
							from: this.$id,
						},
					);
					return result.records.map((record) => {
						const rel = record.get("rel");
						return rel;
					});
				}

				const result = await this.db.run(
					`MATCH (from) WHERE from.\`$id\` = $from
					MATCH (to) WHERE to.\`$id\` = $to
					CREATE (from)-[rel:${rel} $props]->(to)
					RETURN rel`,
					{
						from: this.$id,
						to: to.$id,
						props: props || {},
					},
				);
				return result.records[0].get("rel");
			};
		}
	}

	/** Pull the state of the vertex from the database */
	async $pull(): Promise<this> {
		const result = await this.db.run("MATCH (n) WHERE n.`$id` = $id RETURN n", {
			id: this.$id,
		});

		const node = result.records[0].get("n");
		this.labels = node.labels;
		const props = convert.js(node.properties);
		delete props.$id;
		this.props = new Proxy(props, {
			set: (target, prop, value) => {
				target[prop] = value;
				this.$synced = false;
				return true;
			},
		});

		this.$synced = true;
		return this;
	}

	/** Push the state of the vertex to the database */
	async $push(): Promise<this> {
		const props = convert.neo4j(this.props);
		await this.db.run(`MATCH (n) WHERE n.\`$id\` = $id SET n = $props`, {
			id: this.$id,
			props: {
				...props,
				$id: this.$id,
			},
		});
		this.$synced = true;
		return this;
	}

	/** Delete the vertex (and its relations) from the database */
	async $delete(): Promise<void> {
		await this.db.run("MATCH (n) WHERE n.`$id` = $id DETACH DELETE n", {
			id: this.$id,
		});
		this.$synced = false;
	}
}

export type Vertex<
	GraphSchema extends FullGraph,
	NodeName extends keyof GraphSchema,
	Node extends GraphSchema[NodeName] = GraphSchema[NodeName],
> = _Vertex<GraphSchema, NodeName, Node> & {
	[K in keyof Node["rels"] as Node["rels"][K] extends RelationShape<true>
		? K
		: never]: (() => Promise<
		Relation<GraphSchema, NodeName, K extends keyof GraphSchema[NodeName] ? K : never>[]
	>) &
		(Node["rels"][K] extends RelationShape<true, infer To, infer Labels, infer Props>
			? Empty extends Props
				? (
						target: Vertex<
							GraphSchema,
							Node["rels"][K] extends RelationShape<true, infer To> ? To : never
						>,
				  ) => Promise<
						Relation<
							GraphSchema,
							NodeName,
							K extends keyof GraphSchema[NodeName] ? K : never
						>
				  >
				: (
						target: Vertex<
							GraphSchema,
							Node["rels"][K] extends RelationShape<true, infer To> ? To : never
						>,
						props: Node["rels"][K] extends RelationShape<
							true,
							infer To,
							infer Labels,
							infer Props
						>
							? {
									[P in keyof Props]: Props[P] extends z.ZodType
										? z.infer<Props[P]>
										: never;
							  }
							: never,
				  ) => Promise<
						Relation<
							GraphSchema,
							NodeName,
							K extends keyof GraphSchema[NodeName] ? K : never
						>
				  >
			: never);
} & {
	[K in keyof Node["rels"] as Node["rels"][K] extends RelationShape<false>
		? K
		: never]: (() => Promise<
		Relation<GraphSchema, NodeName, K extends keyof GraphSchema[NodeName] ? K : never>
	>) &
		(Node["rels"][K] extends RelationShape<false, infer To, infer Labels, infer Props>
			? Empty extends Props
				? (
						target: Vertex<
							GraphSchema,
							Node["rels"][K] extends RelationShape<false, infer To> ? To : never
						>,
				  ) => Promise<
						Relation<
							GraphSchema,
							NodeName,
							K extends keyof GraphSchema[NodeName] ? K : never
						>
				  >
				: (
						target: Vertex<
							GraphSchema,
							Node["rels"][K] extends RelationShape<false, infer To> ? To : never
						>,
						props: Node["rels"][K] extends RelationShape<
							false,
							infer To,
							infer Labels,
							infer Props
						>
							? {
									[P in keyof Props]: Props[P] extends z.ZodType
										? z.infer<Props[P]>
										: never;
							  }
							: never,
				  ) => Promise<
						Relation<
							GraphSchema,
							NodeName,
							K extends keyof GraphSchema[NodeName] ? K : never
						>
				  >
			: never);
};

export function vertexify<
	GraphSchema extends FullGraph,
	NodeName extends keyof GraphSchema,
	Node extends GraphSchema[NodeName] = GraphSchema[NodeName],
>(db: DB<GraphSchema>, name: NodeName, node: Neo4jNode): Vertex<GraphSchema, NodeName, Node> {
	return new _Vertex(db, name, node) as Vertex<GraphSchema, NodeName, Node>;
}

export type Relation<
	GraphSchema extends FullGraph,
	From extends keyof GraphSchema,
	Name extends keyof GraphSchema[From],
	FromSchema extends GraphSchema[From] = GraphSchema[From],
	To extends FromSchema[Name] extends RelationShape<infer Many, infer To>
		? To
		: never = FromSchema[Name] extends RelationShape<infer Many, infer To> ? To : never,
	Schema extends FromSchema[Name] extends RelationShape<infer Many, infer To, infer Schema>
		? Schema
		: never = FromSchema[Name] extends RelationShape<infer Many, infer To, infer Schema>
		? Schema
		: never,
> = {
	[K in keyof Schema]: Schema[K];
} & {
	/** The unique identifier of this relation (edge), it is an auto-generated CUID */
	readonly $id: string;
	/** Re-fetch the relation from the database */
	readonly $self: () => Promise<Relation<GraphSchema, From, Name>>;
	/** The schema of this relation */
	readonly $schema: Schema;
	/** Update the relation in the database */
	readonly $update: (props: Partial<Schema>) => Promise<Relation<GraphSchema, From, Name>>;
	/** Delete the relation from the database */
	readonly $delete: () => Promise<void>;

	/** The source vertex of this relation */
	readonly $from: () => Promise<Vertex<GraphSchema, From>>;
	/** The target vertex of this relation */
	readonly $to: () => Promise<Vertex<GraphSchema, To>>;
};

export type DBSchema<T> = T extends DB<infer S> ? Simplify<S> : never;
