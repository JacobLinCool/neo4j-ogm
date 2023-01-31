import type { Empty, Prop, OneRelation, ManyRelations } from "./types";

export function ONE<To extends string>(node: To): OneRelation<To, Empty>;
export function ONE<To extends string, Schema extends Record<string, Prop>>(
	node: To,
	schema: Schema,
): OneRelation<To, Schema>;
export function ONE<To extends string, Schema extends Record<string, Prop>>(
	node: To,
	schema?: Schema,
): OneRelation<To, Schema> {
	return {
		$rel: "one",
		to: node,
		schema: schema ?? ({} as Schema),
	};
}

export function MANY<To extends string>(node: To): ManyRelations<To, Empty>;
export function MANY<To extends string, Props extends Record<string, Prop>>(
	node: To,
	props: Props,
): ManyRelations<To, Props>;
export function MANY<To extends string, Props extends Record<string, Prop>>(
	node: To,
	props?: Props,
): ManyRelations<To, Props> {
	return {
		$rel: "many",
		to: node,
		schema: props ?? ({} as Props),
	};
}
