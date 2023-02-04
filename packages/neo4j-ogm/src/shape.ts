import type { PropValue } from "./types";

export class NodeShape<
	Name extends string = string,
	Labels extends readonly string[] = readonly string[],
	Data extends Record<string, PropValue | RelationShape> = Record<
		string,
		PropValue | RelationShape
	>,
	Props = {
		[K in keyof Data as Data[K] extends PropValue ? K : never]: Data[K] extends PropValue
			? Data[K]
			: never;
	},
	Relations = {
		[K in keyof Data as Data[K] extends RelationShape
			? K
			: never]: Data[K] extends RelationShape ? Data[K] : never;
	},
> {
	public readonly name: Name;
	public readonly labels: Labels;
	public readonly props: Props;
	public readonly rels: Relations;

	constructor(name: Name, labels?: Labels);
	constructor(name: Name, data?: Data);
	constructor(name: Name, labels?: Labels, data?: Data);
	constructor(name: Name, labels?: Labels | Props | Relations, data?: Data) {
		this.name = name;

		if (labels && !Array.isArray(labels)) {
			data = labels as unknown as Data;
			labels = undefined;
		}

		this.labels = (labels as Labels | undefined) || ([] as unknown as Labels);

		this.props = {} as Props;
		this.rels = {} as Relations;

		if (data) {
			for (const key in data) {
				const value = data[key];
				if (value instanceof RelationShape) {
					// @ts-expect-error
					this.rels[key] = value;
				} else {
					// @ts-expect-error
					this.props[key] = value;
				}
			}
		}
	}
}

export class RelationShape<
	Many extends boolean = boolean,
	To extends string = string,
	Labels extends readonly string[] = readonly string[],
	Props extends Record<string, PropValue> = Record<string, PropValue>,
> {
	public readonly many: Many;
	public readonly to: To;
	public readonly labels: Labels;
	public readonly props: Props;

	constructor(many: Many, to: To, labels?: Labels);
	constructor(many: Many, to: To, data?: Props);
	constructor(many: Many, to: To, labels?: Labels, data?: Props);
	constructor(many: Many, to: To, labels?: Labels | Props, data?: Props) {
		this.many = many;
		this.to = to;

		if (labels && !Array.isArray(labels)) {
			data = labels as Props;
			labels = undefined;
		}

		this.labels = (labels as Labels | undefined) || ([] as unknown as Labels);
		this.props = data || ({} as Props);
	}
}
