type MaxIterationLength = 15

type IndicesOf<
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  Tuple extends readonly any[],
  Acc extends number = never,
> = Tuple extends readonly []
  ? Acc
  : Tuple extends readonly [infer _, ...infer RestTuple]
    ? IndicesOf<RestTuple, Acc | RestTuple['length']>
    : Acc

// biome-ignore lint/suspicious/noExplicitAny: This is a type helper
type IsTuple<T> = T extends any[] ? (T extends readonly [infer _A, ...infer _Rest] ? T : never) : never;

type CombinePath<
  T,
  Path,
  DepthCheck extends unknown[] = [],
> = Path extends keyof T & (number | string)
  ? `${Path}.${Paths<T[Path], [...DepthCheck, unknown]>}`
  : never

const PathDefaultValueSymbol = Symbol('PathDefaultValue')
export type PathsDefaultValue = typeof PathDefaultValueSymbol

export type Paths<
  T = PathsDefaultValue,
  DepthCheck extends unknown[] = [],
> = DepthCheck['length'] extends MaxIterationLength
  ? never
  : T extends PathsDefaultValue
    ? string
    : T extends Date
      ? never
      : // biome-ignore lint/suspicious/noExplicitAny: This is a type helper
        T extends readonly any[] & IsTuple<T>
        ? `${IndicesOf<T>}` | CombinePath<T, IndicesOf<T>, DepthCheck>
        : // biome-ignore lint/suspicious/noExplicitAny: This is a type helper
          T extends any[]
          ? `${number}` | CombinePath<T, number, DepthCheck>
          : T extends object
            ? (keyof T & string) | CombinePath<T, keyof T, DepthCheck>
            : never

// biome-ignore lint/suspicious/noExplicitAny: This is a type helper
export type ValueAtPath<T, TProp> = T extends Record<string | number, any>
  ? TProp extends `${infer TBranch}.${infer TDeepProp}`
    ? ValueAtPath<T[TBranch], TDeepProp>
    : T[TProp & string]
  : never

type MakeOptionalIfNotExistInCheckTuple<
  Tuple,
  ReplaceWithTuple,
  Acc extends unknown[] = [],
> = Acc['length'] extends MaxIterationLength
  ? never
  : Tuple extends readonly [infer Head, ...infer Rest]
    ? ReplaceWithTuple extends readonly [
        infer ReplaceWithHead,
        ...infer ReplaceWithRest,
      ]
      ? MakeOptionalIfNotExistInCheckTuple<
          Rest,
          ReplaceWithRest,
          [...Acc, MakeOptionalIfNotExistInCheck<Head, ReplaceWithHead>]
        >
      : [...Acc, Head | undefined]
    : Acc

export type MakeOptionalIfNotExistInCheck<
  BaseObject,
  CheckObject,
  DepthCheck extends unknown[] = [],
> = DepthCheck['length'] extends MaxIterationLength
  ? never
  : BaseObject extends Date
    ? CheckObject extends Date
      ? BaseObject
      : BaseObject | undefined
    : BaseObject extends IsTuple<BaseObject>
      ? CheckObject extends IsTuple<CheckObject>
        ? MakeOptionalIfNotExistInCheckTuple<BaseObject, CheckObject>
        : BaseObject | undefined
      : BaseObject extends Array<infer T>
        ? CheckObject extends Array<infer T2>
          ? Array<MakeOptionalIfNotExistInCheck<T, T2, [...DepthCheck, unknown]>>
          : BaseObject | undefined
        : BaseObject extends object
            ? {
                [K in keyof BaseObject]: K extends keyof CheckObject
                  ? MakeOptionalIfNotExistInCheck<
                      BaseObject[K],
                      CheckObject[K],
                      [...DepthCheck, unknown]
                    >
                  : BaseObject[K] | undefined
              }
          : BaseObject extends CheckObject
            ? BaseObject
            : BaseObject | undefined
