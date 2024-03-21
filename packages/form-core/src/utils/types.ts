type MaxIterationLength = 15

type IndicesOf<
  Tuple extends readonly any[],
  Acc extends number = never,
> = Tuple extends readonly []
  ? Acc
  : Tuple extends readonly [infer _, ...infer RestTuple]
    ? IndicesOf<RestTuple, Acc | RestTuple['length']>
    : Acc

type IsTuple<T> = T extends any[]
  ? T extends readonly [infer _A, ...infer _Rest]
    ? T
    : never
  : never

type CombinePath<
  T,
  Path,
  DepthCheck extends unknown[] = [],
> = Path extends keyof T & (number | string)
  ? `${Path}.${Paths<T[Path], [...DepthCheck, unknown]>}`
  : never

const PathDefaultValueSymbol = Symbol('PathDefaultValue')
export type PathsDefaultValue = typeof PathDefaultValueSymbol

export type Paths<T = PathsDefaultValue, DepthCheck extends unknown[] = []> =
  | (DepthCheck['length'] extends 0 ? '' : never)
  | (DepthCheck['length'] extends MaxIterationLength
      ? never
      : T extends PathsDefaultValue
        ? string
        : T extends Date
          ? never
          : T extends readonly any[] & IsTuple<T>
            ? `${IndicesOf<T>}` | CombinePath<T, IndicesOf<T>, DepthCheck>
            : T extends any[]
              ? `${number}` | CombinePath<T, number, DepthCheck>
              : T extends object
                ? (keyof T & string) | CombinePath<T, keyof T, DepthCheck>
                : never)

export type ParentPath<
  T,
  Acc extends string = '',
> = T extends `${infer Branch}.${infer NextBranch}`
  ? ParentPath<NextBranch, Acc extends '' ? Branch : `${Acc}.${Branch}`>
  : T extends `${infer _}`
    ? Acc
    : ''

export type LastPath<T> = T extends `${infer _}.${infer NextBranch}`
  ? LastPath<NextBranch>
  : T extends `${infer Extracted}`
    ? Extracted extends `${infer Digit extends number}`
      ? Digit
      : Extracted
    : ''

export type ValueAtPath<T, TProp> = T extends Record<string | number, any>
  ? TProp extends `${infer TBranch}.${infer TDeepProp}`
    ? ValueAtPath<T[TBranch], TDeepProp>
    : TProp extends ''
      ? T
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
          ? Array<
              MakeOptionalIfNotExistInCheck<T, T2, [...DepthCheck, unknown]>
            >
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
