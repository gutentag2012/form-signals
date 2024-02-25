type CountTo<
	MaxLength extends number,
	Res extends Array<number> = [],
> = Res["length"] extends MaxLength
	? Res
	: CountTo<MaxLength, [...Res, Res["length"]]>;

type IndicesOf<
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	Tuple extends readonly any[],
	Acc extends number = never,
> = Tuple extends readonly []
	? Acc
	: Tuple extends readonly [infer _, ...infer RestTuple]
	  ? IndicesOf<RestTuple, Acc | RestTuple["length"]>
	  : Acc;

type TupleMaxLength = CountTo<99>[number];
// biome-ignore lint/suspicious/noExplicitAny: This is a type helper
type IsTuple<T> = T extends readonly any[] & { length: infer Length }
	? // This checks if the length of a given array is a specific number, if so it is a tuple... Therefore, this also is limited to 99 elements
	  Length extends TupleMaxLength
		? T
		: never
	: never;

type CombinePath<
	T,
	Path,
	MaxDepth extends number = 15,
	DepthCheck extends unknown[] = [],
> = Path extends keyof T & (number | string)
	? `${Path}.${Paths<T[Path], MaxDepth, [...DepthCheck, unknown]>}`
	: never;

export type Paths<
	T,
	MaxDepth extends number = 15,
	DepthCheck extends unknown[] = [],
> = DepthCheck["length"] extends MaxDepth
	? never
	: T extends Date
	  ? never
	  : // biome-ignore lint/suspicious/noExplicitAny: This is a type helper
		  T extends readonly any[] & IsTuple<T>
		  ? IndicesOf<T> | CombinePath<T, IndicesOf<T>, MaxDepth, DepthCheck>
		  : // biome-ignore lint/suspicious/noExplicitAny: This is a type helper
			  T extends any[]
			  ? `${number}` | CombinePath<T, number, MaxDepth, DepthCheck>
			  : T extends object
				  ? (keyof T & string) | CombinePath<T, keyof T, MaxDepth, DepthCheck>
				  : never;

// biome-ignore lint/suspicious/noExplicitAny: This is a type helper
export type ValueAtPath<T, TProp> = T extends Record<string | number, any>
	? TProp extends `${infer TBranch}.${infer TDeepProp}`
		? ValueAtPath<T[TBranch], TDeepProp>
		: T[TProp & string]
	: never;
