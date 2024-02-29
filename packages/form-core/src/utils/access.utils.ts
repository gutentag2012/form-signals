import type { Paths, ValueAtPath } from './types'

export function pathToParts(path: string): Array<string | number> {
  return path.split('.').map((part) => {
    const num = parseInt(part, 10)
    return Number.isNaN(num) ? part : num
  })
}

export function getValueAtPath<TValue, TPath extends Paths<TValue>>(
  obj: TValue | undefined,
  path: TPath,
): ValueAtPath<TValue, TPath> | undefined {
  if (!path || !obj) {
    return undefined
  }
  const parts = pathToParts(path as string)

  // biome-ignore lint/suspicious/noExplicitAny: We are not sure if the type here is correct, but we want to cast it
  let value: any = obj
  for (const part of parts) {
    if (typeof value !== 'object' || value === null || !(part in value)) {
      return undefined
    }
    value = value[part]
  }

  return value
}

export function setValueAtPath<TValue, TPath extends Paths<TValue>>(
  obj: TValue | undefined,
  path: TPath,
  value: ValueAtPath<TValue, TPath> | undefined,
): TValue | undefined {
  if (!path || !obj) {
    return obj
  }
  const parts = pathToParts(path as string)

  // biome-ignore lint/suspicious/noExplicitAny: We are not sure if the type here is correct, but we want to cast it
  let current: any = obj
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]

    const nextPart = parts[i + 1]

    // If the current part is already included in the current value, we can continue with that value
    if (!!current && part in current && nextPart !== undefined) {
      current = current[part]
      continue
    }

    const newValue =
      nextPart === undefined ? value : typeof nextPart === 'number' ? [] : {}

    // If the current part is a number, then we need to set the value in an array
    if (typeof part === 'number') {
      // We know the value is not already included, so we can insert it at the part
      current[part] = newValue
    } else {
      // We know the value is not already included, so we can insert it at the part
      current[part] = newValue
    }

    current = current[part]
  }

  return current
}
