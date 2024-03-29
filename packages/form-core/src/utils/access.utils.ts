import type { Paths, ValueAtPath } from './types'

/**
 * This function is used to convert a path string into an array of singular keys and/or indexes for arrays and objects.
 *
 * @param path - The path to convert.
 * This should be a string with keys separated by dots.
 *
 * @returns An array of keys and/or indexes.
 *
 * @example
 * ```ts
 * pathToParts('a.b.0.c') // ['a', 'b', 0, 'c']
 * ```
 */
export function pathToParts(path: string): Array<string | number> {
  return path.split('.').map((part) => {
    const num = Number.parseInt(part, 10)
    return Number.isNaN(num) ? part : num
  })
}

/**
 * This function is used to get a value from an object or array at a given path string.
 *
 * @param obj - The object or array to get the value from.
 * @param path - The path to the value.
 *
 * @returns The value at the given path, or `undefined` if the path does not exist.
 *
 * @example
 * ```ts
 * getValueAtPath({ a: { b: [1, 2, 3] } }, 'a.b.0') // 1
 * ```
 */
export function getValueAtPath<TValue, TPath extends Paths<TValue>>(
  obj: TValue | undefined,
  path: TPath,
): ValueAtPath<TValue, TPath> | undefined {
  if (!path || !obj) {
    return undefined
  }
  const parts = pathToParts(path as string)

  let value: any = obj
  for (const part of parts) {
    // If the child is not an object or the part is not in the object, then we cannot find the value
    if (typeof value !== 'object' || !(part in value)) {
      return undefined
    }
    value = value[part]
  }

  return value
}

/**
 * This function is used to remove a value from an object or array at a given path string.
 *
 * @param obj - The object or array to remove the value from.
 * @param path - The path to the value.
 *
 * @returns The object {@link obj} or array with the value removed.
 *
 * @example
 * ```ts
 * removeValueAtPath({ a: { b: [1, 2, 3] } }, 'a.b.0') // { a: { b: [2, 3] } }
 * ```
 */
export function removeValueAtPath<TValue, TPath extends Paths<TValue>>(
  obj: TValue | undefined,
  path: TPath,
) {
  if (!obj) {
    return
  }
  if (!path) {
    return obj
  }

  const parts = pathToParts(path as string)
  const parentPath = parts.slice(0, -1).join('.')

  // If we want to remove a value, we need to remove it from the parent
  const parent =
    parts.length === 1
      ? obj
      : getValueAtPath(obj, parentPath as Paths<typeof obj>)

  // If we have no parent, then we cannot remove anything
  if (!parent) {
    return obj
  }

  const part = parts[parts.length - 1]
  if (typeof part === 'number' && Array.isArray(parent)) {
    parent.splice(part, 1)
  } else {
    delete parent[part as keyof typeof parent]
  }

  return obj
}

/**
 * This function is used to set a value in an object or array at a given path string.
 *
 * @param obj - The object or array to set the value in.
 * @param path - The path to the value.
 * @param value - The value to set.
 *
 * @returns The value that was set.
 *
 * @example
 * ```ts
 * const obj = { a: { b: [1, 2, 3] } }
 * setValueAtPath(obj, 'a.b.0', 4) // 4
 * obj // { a: { b: [4, 2, 3] } }
 * ```
 */
export function setValueAtPath<TValue, TPath extends Paths<TValue>>(
  obj: TValue | undefined,
  path: TPath,
  value: ValueAtPath<TValue, TPath> | undefined,
): TValue | undefined {
  if (!path || !obj) {
    return obj
  }
  const parts = pathToParts(path as string)

  let current: any = obj
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    const nextPart = parts[i + 1]

    // If the current part is already included in the current value, we can continue with that value
    if (!!current && part in current && nextPart !== undefined) {
      current = current[part]
      continue
    }

    // If the nextPart is an index, we know its parent (the current value) has to be an array and else it has to be an object.
    // If there is no next part, we know the value is the value we want to set.
    const newValue =
      nextPart === undefined ? value : typeof nextPart === 'number' ? [] : {}

    // If the current part is a number, then we need to set the value in an array
    if (typeof part === 'number') {
      current[part] = newValue
    } else {
      current[part] = newValue
    }

    current = current[part]
  }

  return current
}
