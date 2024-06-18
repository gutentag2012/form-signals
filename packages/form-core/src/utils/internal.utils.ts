export function Truthy<T>(
  value: T | boolean | null | undefined,
): value is NonNullable<T> {
  return !!value
}

export function getGroupKey(members: string[]) {
  return [...members].sort().join('.')
}
