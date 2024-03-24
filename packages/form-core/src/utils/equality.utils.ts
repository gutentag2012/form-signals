function isNullOrUndefined<T>(value: T): value is NonNullable<T> {
  return value === null || value === undefined
}

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

    if (!(key in bNonNullable)) {
      internalAcc = [...internalAcc, nextKey]
      continue
    }
    const valA = aNonNullable[key as keyof typeof aNonNullable]
    const valB = bNonNullable[key as keyof typeof bNonNullable]

    internalAcc = getLeftUnequalPathsInternal(valA, valB, nextKey, internalAcc)
  }

  return internalAcc
}
export function getLeftUnequalPaths(a: unknown, b: unknown): string[] {
  return getLeftUnequalPathsInternal(a, b)
}
