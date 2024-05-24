function isNullOrUndefined<T>(value: T): value is NonNullable<T> {
  return value === null || value === undefined
}

/**
 * Checks if two values are equal. If they are objects or arrays, it will do a deep comparison instead of a reference check.
 *
 * @param a - The first value to compare
 * @param b - The second value to compare
 *
 * @returns True if the values are equal, false otherwise
 *
 * @example
 * ```ts
 * isEqualDeep({ a: 1 }, { a: 1 }) // true
 * isEqualDeep({ a: 1 }, { a: 2 }) // false
 * isEqualDeep({ a: 1 }, { a: 1, b: 2 }) // false
 * isEqualDeep([1, 2, 3], [1, 2, 3]) // true
 * isEqualDeep([1, 2, 3], [1, 2, 4]) // false
 * isEqualDeep([1, 2, 3], [1, 2, 3, 4]) // false
 * isEqualDeep(new Date(2021, 1, 1), new Date(2021, 1, 1)) // true
 * isEqualDeep(new Date(2021, 1, 1), new Date(2021, 1, 2)) // false
 * ```
 */
export function isEqualDeep(a: unknown, b: unknown): boolean {
  // Primitives + object references
  if (a === b) return true
  if (isNullOrUndefined<unknown>(a) || isNullOrUndefined<unknown>(b))
    return a === b
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime()

  if (typeof a !== 'object' || typeof b !== 'object') return false

  const aNonNullable = a as NonNullable<unknown>
  const bNonNullable = b as NonNullable<unknown>
  const aKeys = Object.keys(aNonNullable)
  const bKeys = Object.keys(bNonNullable)

  if (aKeys.length !== bKeys.length) return false

  for (const key of aKeys) {
    if (!(key in bNonNullable)) return false
    const valA = aNonNullable[key as keyof typeof aNonNullable]
    const valB = bNonNullable[key as keyof typeof bNonNullable]

    if (!isEqualDeep(valA, valB)) return false
  }
  return true
}

function getLeftUnequalPathsInternal(
  a: unknown,
  b: unknown,
  currentKey = '',
  acc: string[] = [],
): string[] {
  let internalAcc = acc
  // Primitives + object references
  if (a === b) return acc
  if (isNullOrUndefined<unknown>(a) || isNullOrUndefined<unknown>(b))
    return [...internalAcc, currentKey]
  if (a instanceof Date && b instanceof Date)
    return a.getTime() === b.getTime() ? acc : [...internalAcc, currentKey]

  if (typeof a !== 'object' || typeof b !== 'object')
    return [...internalAcc, currentKey]

  const aNonNullable = a as NonNullable<unknown>
  const bNonNullable = b as NonNullable<unknown>
  const aKeys = Object.keys(aNonNullable)

  for (const key of aKeys) {
    const nextKey = currentKey ? `${currentKey}.${key}` : key

    const valA = aNonNullable[key as keyof typeof aNonNullable]
    // Undefined values are basically invisible
    if (valA === undefined) {
      continue
    }

    if (!(key in bNonNullable)) {
      internalAcc = [...internalAcc, nextKey]
      continue
    }
    const valB = bNonNullable[key as keyof typeof bNonNullable]

    internalAcc = getLeftUnequalPathsInternal(valA, valB, nextKey, internalAcc)
  }

  return internalAcc
}

/**
 * Returns the paths of the properties that are different between two objects, based on the left object.
 * It will not return paths that are given in the right object but not in the left object.
 *
 * @param a - The base object to check
 * @param b - The object to compare with
 *
 * @returns An array of strings representing the paths of the properties that are different between the two objects
 *
 * @example
 * ```ts
 * getLeftUnequalPaths({ a: 1 }, { a: 1 }) // []
 * getLeftUnequalPaths({ a: 1 }, { a: 2 }) // ['a']
 * getLeftUnequalPaths({ a: 1 }, { a: 1, b: 2 }) // []
 * getLeftUnequalPaths([1, 2, 3], [1, 2, 3]) // []
 * getLeftUnequalPaths([1, 2, 3], [1, 2, 4]) // [2]
 * getLeftUnequalPaths([1, 2, 3], [1, 2, 3, 4]) // []
 * getLeftUnequalPaths({ date: new Date(2021, 1, 1) }, { date: new Date(2021, 1, 1) }) // []
 * getLeftUnequalPaths({ date: new Date(2021, 1, 1) }, { date: new Date(2021, 1, 2) }) // ["date"]
 * ```
 */
export function getLeftUnequalPaths(a: unknown, b: unknown): string[] {
  return getLeftUnequalPathsInternal(a, b)
}
