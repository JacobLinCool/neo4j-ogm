import type { Simplify } from "type-fest";
import type { DB } from "./db";

export type Prop = string | number | bigint | boolean | Date | Prop[];

export type Empty = Record<never, never>;

export type GraphNode = {
	[id: string]: Prop | OneRelation | ManyRelations;
};

export type Graph = {
	[key: string]: GraphNode;
};

export type PropOnly<T extends GraphNode> = {
	[K in keyof T as T[K] extends Prop ? K : never]: T[K];
};

export type RelationOnly<T extends GraphNode> = {
	[K in keyof T as T[K] extends OneRelation | ManyRelations ? K : never]: T[K];
};

export type OneRelation<
	To extends string = string,
	EdgeSchema extends Record<string, Prop> = Empty,
> = {
	$rel: "one";
	to: To;
	schema: EdgeSchema;
};

export type ManyRelations<
	To extends string = string,
	EdgeSchema extends Record<string, Prop> = Empty,
> = {
	$rel: "many";
	to: To;
	schema: EdgeSchema;
};

export type OneOrManyRelations<
	To extends string = string,
	EdgeSchema extends Record<string, Prop> = Empty,
> = OneRelation<To, EdgeSchema> | ManyRelations<To, EdgeSchema>;

export type VertexSchema<
	GraphSchema extends Graph,
	Node extends keyof GraphSchema,
> = GraphSchema[Node];

export type VertexProps<GraphSchema extends Graph, Node extends keyof GraphSchema> = Simplify<
	PropOnly<VertexSchema<GraphSchema, Node>>
>;

export type VertexRelations<GraphSchema extends Graph, Node extends keyof GraphSchema> = Simplify<
	RelationOnly<VertexSchema<GraphSchema, Node>>
>;

export type Vertex<
	GraphSchema extends Graph,
	Node extends keyof GraphSchema,
	Schema extends GraphSchema[Node] = GraphSchema[Node],
> = {
	[K in keyof Schema as Schema[K] extends Prop ? K : never]: Schema[K];
} & {
	/** The unique identifier of this vertex (node), it is an auto-generated CUID */
	readonly $id: string;
	/** Re-fetch the vertex from the database */
	readonly $self: () => Promise<Vertex<GraphSchema, Node>>;
	/** The schema of this vertex */
	readonly $schema: Schema;
	/** Update the vertex in the database */
	readonly $update: (
		props: Partial<VertexProps<GraphSchema, Node>>,
	) => Promise<Vertex<GraphSchema, Node>>;
} & {
	[K in keyof Schema as Schema[K] extends ManyRelations ? K : never]: (() => Promise<
		Relation<GraphSchema, Node, K extends keyof GraphSchema[Node] ? K : never>[]
	>) &
		(Schema[K] extends ManyRelations<infer Name, infer Props>
			? Empty extends Props
				? (
						target: Vertex<
							GraphSchema,
							Schema[K] extends ManyRelations<infer Name> ? Name : never
						>,
				  ) => Promise<
						Relation<GraphSchema, Node, K extends keyof GraphSchema[Node] ? K : never>
				  >
				: (
						target: Vertex<
							GraphSchema,
							Schema[K] extends ManyRelations<infer Name> ? Name : never
						>,
						props: Schema[K] extends ManyRelations<infer Name, infer Props>
							? Props
							: never,
				  ) => Promise<
						Relation<GraphSchema, Node, K extends keyof GraphSchema[Node] ? K : never>
				  >
			: never);
} & {
	[K in keyof Schema as Schema[K] extends OneRelation ? K : never]: (() => Promise<
		Relation<GraphSchema, Node, K extends keyof GraphSchema[Node] ? K : never>
	>) &
		(Schema[K] extends OneRelation<infer Name, infer Props>
			? Empty extends Props
				? (
						target: Vertex<
							GraphSchema,
							Schema[K] extends OneRelation<infer Name> ? Name : never
						>,
				  ) => Promise<
						Relation<GraphSchema, Node, K extends keyof GraphSchema[Node] ? K : never>
				  >
				: (
						target: Vertex<
							GraphSchema,
							Schema[K] extends OneRelation<infer Name> ? Name : never
						>,
						props: Schema[K] extends OneRelation<infer Name, infer Props>
							? Props
							: never,
				  ) => Promise<
						Relation<GraphSchema, Node, K extends keyof GraphSchema[Node] ? K : never>
				  >
			: never);
};

export type Relation<
	GraphSchema extends Graph,
	From extends keyof GraphSchema,
	Name extends keyof GraphSchema[From],
	FromSchema extends GraphSchema[From] = GraphSchema[From],
	To extends FromSchema[Name] extends OneOrManyRelations<infer To>
		? To
		: never = FromSchema[Name] extends OneOrManyRelations<infer To> ? To : never,
	Schema extends FromSchema[Name] extends OneOrManyRelations<infer To, infer Schema>
		? Schema
		: never = FromSchema[Name] extends OneOrManyRelations<infer To, infer Schema>
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

	/** The source vertex of this relation */
	readonly $from: () => Promise<Vertex<GraphSchema, From>>;
	/** The target vertex of this relation */
	readonly $to: () => Promise<Vertex<GraphSchema, To>>;
};

export type DBSchema<T> = T extends DB<infer S> ? Simplify<S> : never;
