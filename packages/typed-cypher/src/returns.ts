import { Vars } from "./vars";

export type Escape<T> = T extends `${infer A}\`${infer B}` ? `${Escape<A>}${Escape<B>}` : T;

export type Returns<Q extends string> = {
	[K in keyof Vars<Q> as Escape<K>]: Vars<Q>[K];
};
