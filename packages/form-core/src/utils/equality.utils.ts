function isNullOrUndefined<T>(value: T): value is NonNullable<T> {
  return value === null || value === undefined
}

export function equalityUtils(a: unknown, b: unknown): boolean {
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

    if (!equalityUtils(valA, valB)) return false
  }
  return true
}
