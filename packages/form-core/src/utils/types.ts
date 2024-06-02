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

/**
 * This returns all possible nested paths of an object in dot notation.
 *
 * @note
 * This is a recursive type that will stop at {@link MaxIterationLength} levels deep.
 *
 * @example
 * ```ts
 * type User = {
 *   name: string
 *   age: number
 *   address: {
 *     street: string
 *     city: string
 *     zip: number
 *   },
 *   dates: [Date, Date],
 *   friends: User[]
 * }
 * Paths<User> // "name" | "age" | "address" | "dates" | "friends" | "address.street" | ... | "dates.0" | "dates.1" | "friends.${number}" | ...
 * ```
 */
export type Paths<T, DepthCheck extends unknown[] = []> =
  | (DepthCheck['length'] extends 0 ? '' : never)
  | (DepthCheck['length'] extends MaxIterationLength
      ? never
      : T extends Date
        ? never
        : T extends File
          ? never
          : T extends readonly any[] & IsTuple<T>
            ? `${IndicesOf<T>}` | CombinePath<T, IndicesOf<T>, DepthCheck>
            : T extends any[]
              ? `${number}` | CombinePath<T, number, DepthCheck>
              : T extends object
                ? (keyof T & string) | CombinePath<T, keyof T, DepthCheck>
                : never)

/**
 * Returns the parent path of a nested path.
 *
 * @example
 * ```ts
 * const path = 'address.street.number'
 * ParentPath<typeof user, path> // "address.street"
 * ```
 */
export type ParentPath<
  T,
  Acc extends string = '',
> = T extends `${infer Branch}.${infer NextBranch}`
  ? ParentPath<NextBranch, Acc extends '' ? Branch : `${Acc}.${Branch}`>
  : T extends `${infer _}`
    ? Acc
    : ''

/**
 * Returns the last path of a nested path.
 *
 * @example
 * ```ts
 * const path = 'address.street.number'
 * LastPath<typeof user, path> // "number"
 * ```
 */
export type LastPath<T> = T extends `${infer _}.${infer NextBranch}`
  ? LastPath<NextBranch>
  : T extends `${infer Extracted}`
    ? Extracted extends `${infer Digit extends number}`
      ? Digit
      : Extracted
    : ''

/**
 * Connects two paths with a dot.
 *
 * @example
 * ```ts
 * ConnectPath<'address', 'street'> // "address.street"
 * ConnectPath<'', 'street'> // "street"
 * ```
 */
export type ConnectPath<
  FirstPart extends string,
  SecondPart extends string,
> = FirstPart extends '' ? SecondPart : `${FirstPart}.${SecondPart}`

/**
 * Returns the value of a nested path.
 *
 * @example
 * ```ts
 * type User = {
 *  name: string
 *  address: {
 *  street: string
 *  number: number
 *  }
 * }
 *
 * type Name = ValueAtPath<User, 'name'> // string
 * type Street = ValueAtPath<User, 'address.street'> // string
 * ```
 */
export type ValueAtPath<T, TProp> = T extends Record<string | number, any>
  ? TProp extends `${infer TBranch}.${infer TDeepProp}`
    ? ValueAtPath<T[TBranch], TDeepProp>
    : TProp extends ''
      ? T
      : T[TProp & string]
  : TProp extends ''
    ? T
    : never

export type PartialForPath<T, TProp> = T extends Record<string | number, any>
  ? TProp extends `${infer TBranch}.${infer TDeepProp}`
    ? TBranch extends keyof T
      ? TDeepProp extends keyof T[TBranch]
        ? { [TTBranch in TBranch]: PartialForPath<T[TBranch], TDeepProp> }
        : never
      : never
    : TProp extends keyof T
      ? { [TTProp in TProp]: T[TProp] }
      : never
  : never

export type PartialForPaths<T, TProps> = TProps extends readonly [
  infer TProp,
  ...infer TRest,
]
  ? PartialForPath<T, TProp> &
      (TRest['length'] extends 0 ? unknown : PartialForPaths<T, TRest>)
  : TProps extends any[]
    ? UnionToIntersection<PartialForPath<T, TProps[number]>>
    : unknown

// Taken from https://stackoverflow.com/a/50375286
type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (
  x: infer I,
) => void
  ? I
  : never

export type ExcludeAll<T, U extends string[]> = T extends U[number] ? never : T

/**
 * Returns a tuple of values for the given tuple of paths.
 *
 * @example
 * ```ts
 * type User = {
 * name: string
 * age: number
 * }
 *
 * type Paths = ['name', 'age']
 * ValueAtPathForTuple<User, Paths> // [string, number]
 * ```
 */
export type ValueAtPathForTuple<
  TData,
  TPaths extends readonly Partial<Paths<TData>>[],
  Acc extends any[] = [],
> = TPaths extends [infer TPath, ...infer TRest extends Partial<Paths<TData>>[]]
  ? ValueAtPathForTuple<TData, TRest, [...Acc, ValueAtPath<TData, TPath>]>
  : Acc['length'] extends 0
    ? ValueAtPath<TData, TPaths[number]>[]
    : Acc

/**
 * Checks if a given path is optional on a given object.
 *
 * @template TValue - The object type.
 * @template TKey - The path to check.
 *
 * @example
 * ```ts
 * type User = {
 * name: string
 * age?: number
 * }
 *
 * IsOptional<User, 'age'> // 'age'
 * IsOptional<User, 'name'> // never
 * ```
 */
export type KeepOptionalKeys<TValue, TKey extends Paths<TValue>> = Pick<
  ValueAtPath<TValue, ParentPath<TKey>>,
  // @ts-expect-error Typescript does not realize that the lastPath will be a key of the value at the parent path
  LastPath<TKey>
  // @ts-expect-error Typescript does not realize that the lastPath will be a key of the value at the parent path
> extends Required<Pick<ValueAtPath<TValue, ParentPath<TKey>>, LastPath<TKey>>>
  ? never
  : TKey

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

/**
 * Takes in a base object and a check object and makes all the keys optional that are not present in the check object.
 *
 * @template BaseObject - The object to make optional.
 * @template CheckObject - The object to check against.
 *
 * @example
 * ```ts
 * type User = {
 *  name: string
 *  age: number
 * }
 *
 * type Check = {
 * name: string
 * }
 *
 * MakeOptionalIfNotExistInCheck<User, Check> // { name: string, age?: number }
 * ```
 */
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
    : BaseObject extends File
      ? CheckObject extends File
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
