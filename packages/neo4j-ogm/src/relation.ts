import { RelationShape } from "./shape";
import type { Empty, PropValue } from "./types";

export function ONE<To extends string>(to: To): RelationShape<false, To, [], Empty>;
export function ONE<To extends string, Labels extends readonly string[]>(
	to: To,
	labels: Labels,
): RelationShape<false, To, Labels, Empty>;
export function ONE<To extends string, Props extends Record<string, PropValue>>(
	to: To,
	props: Props,
): RelationShape<false, To, [], Props>;
export function ONE<
	To extends string,
	Labels extends readonly string[],
	Props extends Record<string, PropValue>,
>(to: To, labels: Labels, props: Props): RelationShape<false, To, Labels, Props>;
export function ONE(...args: any[]): RelationShape {
	// @ts-expect-error
	return new RelationShape(false, ...args);
}

export function MANY<To extends string>(to: To): RelationShape<true, To, [], Empty>;
export function MANY<To extends string, Labels extends readonly string[]>(
	to: To,
	labels: Labels,
): RelationShape<true, To, Labels, Empty>;
export function MANY<To extends string, Props extends Record<string, PropValue>>(
	to: To,
	props: Props,
): RelationShape<true, To, [], Props>;
export function MANY<
	To extends string,
	Labels extends readonly string[],
	Props extends Record<string, PropValue>,
>(to: To, labels: Labels, props: Props): RelationShape<true, To, Labels, Props>;
export function MANY(...args: any[]): RelationShape {
	// @ts-expect-error
	return new RelationShape(true, ...args);
}
