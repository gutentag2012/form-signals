import { Signal, batch, signal } from '@preact/signals-core'
import { pathToParts } from './access.utils'
import type { Paths, ValueAtPath } from './types'

// This is a global variable used to assure unique keys for array elements (can be used by react or other libraries to identify elements that do not have a unique key)
let arrayKey = 0

/**
 * A SignalArrayEntry is the signal representation of an array element.
 * It contains a key that is unique for the array element and the data that is signalified.
 *
 * @alias SignalArrayEntry
 *
 * @template T - The type of the data that is signalified.
 *
 * @property key {string} - A unique key for the array element.
 * @property data {SignalifiedData<T>} - The signalified data of the array element.
 */
type SignalArrayEntry<T> = {
  /**
   * A unique key for the array element.
   */
  key: number
  /**
   * The signalified data of the array element.
   */
  data: SignalifiedData<T>
}

/**
 * Creates a SignalArrayEntry from a value.
 * It will assign a unique key to the array element and signalify the value.
 *
 * @param value {T} - The value to be signalified.
 *
 * @template T - The type of the data that is signalified.
 *
 * @returns {SignalArrayEntry<T>} - The array entry as {@link SignalifiedData}.
 *
 * @example
 * ```ts
 * makeArrayEntry('Hello') // { key: 0, data: signal('Hello') }
 * makeArrayEntry({ name: 'John' }) // { key: 1, data: signal({ name: signal('John') }) }
 * ```
 */
export function makeArrayEntry<T>(value: T): SignalArrayEntry<T> {
  return {
    key: arrayKey++,
    data: deepSignalifyValue(value),
  }
}

type SignalifiedTuple<
  Tuple extends readonly any[],
  Acc extends { key: number; data: SignalifiedData<any> }[] = [],
> = Tuple extends readonly []
  ? Acc
  : Tuple extends readonly [infer Curr, ...infer RestTuple]
    ? SignalifiedTuple<
        RestTuple,
        [...Acc, { key: number; data: SignalifiedData<Curr> }]
      >
    : never

/**
 * A value that has every nested key and array item turned into a signal.
 *
 * @alias SignalifiedData
 *
 * @template T - The type of the value that is signalified.
 *
 * @example
 * ```ts
 * SignalifiedData<number> // Signal<number>
 * SignalifiedData<string> // Signal<string>
 * SignalifiedData<{ name: string }> // Signal<{ name: Signal<string> }>
 * SignalifiedData<{ array: number[]] }> // Signal<{ array: Signal<Array<{key: number, data: Signal<number>>> }>
 * ```
 */
export type SignalifiedData<T> = Signal<
  T extends object
    ? T extends Date
      ? T
      : T extends Array<infer U>
        ? Array<{ key: number; data: SignalifiedData<U> }>
        : T extends readonly any[]
          ? SignalifiedTuple<T>
          : { [K in keyof T]: SignalifiedData<T[K]> }
    : T
>

/**
 * Turns a given value into a {@link SignalifiedData}.
 *
 * @param value - The value to be signalified.
 *
 * @template T - The type of the value that is signalified.
 *
 * @returns {SignalifiedData<T>} - The signalified value.
 *
 * @example
 * ```ts
 * deepSignalifyValue('Hello') // signal('Hello')
 * deepSignalifyValue({ name: 'John' }) // signal({ name: signal('John') })
 * deepSignalifyValue([1, 2, 3]) // signal([{ key: 0, data: signal(1) }, { key: 1, data: signal(2) }, { key: 2, data: signal(3) }])
 * ```
 */
export function deepSignalifyValue<T>(value: T): SignalifiedData<T> {
  if (
    value instanceof Date ||
    typeof value !== 'object' ||
    value === null ||
    value === undefined
  ) {
    return signal(value) as SignalifiedData<T>
  }

  if (Array.isArray(value)) {
    return signal(value.map(makeArrayEntry)) as SignalifiedData<T>
  }

  return signal(
    Object.fromEntries(
      Object.entries(value).map(([key, value]) => [
        key,
        deepSignalifyValue(value),
      ]),
    ),
  ) as SignalifiedData<T>
}

function unSignalifyStep<T>(
  peekedValue: SignalifiedData<T>[keyof SignalifiedData<T>],
  unSignalify: (value: SignalifiedData<T>) => T,
): T {
  if (Array.isArray(peekedValue)) {
    return peekedValue.map((entry) => unSignalify(entry.data)) as T
  }

  // In this case it is already a primitive value and can be returned
  if (
    peekedValue instanceof Date ||
    typeof peekedValue !== 'object' ||
    peekedValue === null ||
    peekedValue === undefined
  ) {
    return peekedValue as T
  }

  return Object.fromEntries(
    Object.entries(peekedValue).map(([key, value]) => [
      key,
      unSignalify(value),
    ]),
  ) as T
}

/**
 * Takes a {@link SignalifiedData} value and returns the value without signals.
 *
 * @param value - The signalified value to be un-signalified.
 *
 * @template T - The type of the value that is un-signalified.
 *
 * @returns {T} - The un-signalified value.
 *
 * @note
 * When used inside {@link '@preact/signals-core'.effect}, the effect will not be re-run when the signal changes.
 * If you need to subscribe to the signal, use {@link unSignalifyValueSubscribed}.
 *
 * @example
 * ```ts
 * unSignalifyValue(signal('Hello')) // 'Hello'
 * unSignalifyValue(signal({ name: signal('John') })) // { name: 'John' }
 * unSignalifyValue(signal([{ key: 0, data: signal(1) }, { key: 1, data: signal(2) }, { key: 2, data: signal(3) }]) // [1, 2, 3]
 * ```
 */
export function unSignalifyValue<T>(
  value: SignalifiedData<T> | SignalifiedData<T>['value'],
): T {
  const peekedValue =
    typeof value === 'object' && value instanceof Signal ? value.peek() : value

  return unSignalifyStep(peekedValue, unSignalifyValue)
}

/**
 * Takes a {@link SignalifiedData} value and returns the value without signals.
 *
 * @param value - The signalified value to be un-signalified.
 *
 * @template T - The type of the value that is un-signalified.
 *
 * @returns {T} - The un-signalified value.
 *
 * @note
 * When used inside {@link '@preact/signals-core'.effect}, the effect will be re-run when the signal changes in any depth.
 * If you do not need to subscribe to the signal, use {@link unSignalifyValue}.
 *
 * @example
 * ```ts
 * unSignalifyValue(signal('Hello')) // 'Hello'
 * unSignalifyValue(signal({ name: signal('John') })) // { name: 'John' }
 * unSignalifyValue(signal([{ key: 0, data: signal(1) }, { key: 1, data: signal(2) }, { key: 2, data: signal(3) }]) // [1, 2, 3]
 * ```
 */
export function unSignalifyValueSubscribed<T>(value: SignalifiedData<T>): T {
  return unSignalifyStep(value.value, unSignalifyValueSubscribed)
}

/**
 * Returns the value at a given path in a {@link SignalifiedData} object.
 *
 * @param obj - The signalified object to get the value from.
 * @param path - The path to the value.
 *
 * @template TValue - The type of the value that is signalified.
 * @template TPath - The type of the path to the value.
 *
 * @returns {SignalifiedData<ValueAtPath<TValue, TPath>> | undefined} - The signalified value at the path or undefined if the path does not exist.
 *
 * @note
 * When used inside {@link '@preact/signals-core'.effect}, the effect will not be re-run when the parent signals change.
 *
 * @example
 * ```ts
 * getSignalValueAtPath(signal({ name: signal('John') }), 'name') // signal('John')
 * ```
 */
export function getSignalValueAtPath(
  obj: Signal<undefined>,
  path: string,
): undefined
export function getSignalValueAtPath<TValue, TPath extends Paths<TValue>>(
  obj: SignalifiedData<TValue>,
  path: TPath,
): SignalifiedData<ValueAtPath<TValue, TPath>>
export function getSignalValueAtPath<TValue, TPath extends Paths<TValue>>(
  obj: SignalifiedData<TValue> | Signal<undefined>,
  path: TPath,
): SignalifiedData<ValueAtPath<TValue, TPath>> | undefined {
  if (!path || !obj) {
    return obj as SignalifiedData<ValueAtPath<TValue, TPath>>
  }

  if (!obj.peek()) {
    return obj as SignalifiedData<ValueAtPath<TValue, TPath>>
  }
  const parts = pathToParts(path as string)

  let value: any = obj
  for (const part of parts) {
    const valuePeek = value.peek()

    // The current object must be given, and the part must be included in the object
    if (
      typeof valuePeek !== 'object' ||
      valuePeek === null ||
      !(part in valuePeek)
    ) {
      return undefined
    }

    // Since arrays have nested in the signal, we need to access its signal
    value = typeof part === 'number' ? valuePeek[part].data : valuePeek[part]
  }

  return value
}

/**
 * Removes the value at a given path in a {@link SignalifiedData} object.
 *
 * @param obj - The signalified object to remove the value from.
 * @param path - The path to the value.
 *
 * @template TValue - The type of the value that is signalified.
 * @template TPath - The type of the path to the value.
 *
 * @example
 * ```ts
 * const obj = signal({ name: signal('John') })
 * removeSignalValueAtPath(obj, 'name') // obj.value = {}
 * ```
 */
export function removeSignalValueAtPath<TValue, TPath extends Paths<TValue>>(
  obj: SignalifiedData<TValue> | Signal<undefined>,
  path: TPath,
): void {
  if (!path || !obj.peek()) {
    return
  }
  const parts = pathToParts(path as string)
  const parentPath = parts.slice(0, -1).join('.')

  const parent =
    parts.length === 1
      ? obj
      : getSignalValueAtPath(obj, parentPath as Paths<TValue>)
  if (!parent) {
    return
  }
  const peekedValue = parent.peek()

  const part = parts[parts.length - 1]
  if (typeof part === 'number' && Array.isArray(peekedValue)) {
    if (part >= peekedValue.length) return
    const arrayCopy = [...peekedValue]
    arrayCopy.splice(part, 1)
    parent.value = arrayCopy as (typeof parent)['value']
  } else {
    const { [part as keyof TValue]: removedValue, ...rest } = peekedValue
    if (removedValue === undefined) return
    parent.value = rest as (typeof parent)['value']
  }
}

/**
 * Updates all values in a given {@link SignalifiedData} object with the values from an object.
 *
 * @param obj - The signalified object to update the values of.
 * @param value - The object with the new values.
 * @param isPartial - Whether the update is partial or not.
 * If false, all values that are not in the new object will be removed.
 *
 * @template TValue - The type of the value that is signalified.
 * @template IsPartial - Whether the update is partial or not.
 *
 * @returns {SignalifiedData<TValue> | Signal<undefined>} - The updated signalified object.
 *
 * @example
 * ```ts
 * const obj = signal({ name: signal('John') })
 * setSignalValuesFromObject(obj, { name: 'Jane' }) // obj.value = { name: signal('Jane') }
 * ```
 */
export function setSignalValuesFromObject<
  TValue,
  IsPartial extends boolean = false,
>(
  obj: SignalifiedData<TValue> | Signal<undefined>,
  value: IsPartial extends true ? Partial<TValue> : TValue | undefined,
  isPartial?: IsPartial,
): SignalifiedData<TValue> | Signal<undefined> {
  return batch(() => {
    if (!obj) {
      return signal(undefined)
    }
    if (value === undefined) {
      ;(obj as Signal<undefined>).value = undefined
      return obj
    }
    if (Array.isArray(value)) {
      // If the value currently does not exist we need to create it
      if (!Array.isArray(obj.peek())) {
        ;(obj as Signal<TValue>).value = [] as TValue
      }
      // First we want to update any child signals that have been added or updated
      value.forEach((entry, index) => {
        // We get the current item, if it does not exist we create a new one
        const objValue = (obj.peek() as Array<SignalArrayEntry<TValue>>)[index]
        if (objValue === undefined) {
          const arr = obj.peek() as Array<never>
          arr[index] = makeArrayEntry(entry) as never
          ;(obj as Signal<Array<never>>).value = [...arr]
          return
        }
        // If it does exist we update the value deeply
        setSignalValuesFromObject(objValue.data, entry, isPartial)
      })
      if ((obj.peek() as Array<never>).length === value.length) {
        return obj
      }
      // In case there were also values removed, we need to remove them if this is not a partial update
      if (!isPartial) {
        ;(obj as Signal<Array<never>>).value = (
          obj.peek() as Array<never>
        ).filter((_, index) => {
          return index in value
        })
      }
      return obj
    }
    if (
      !(value instanceof Date) &&
      typeof value === 'object' &&
      value !== null
    ) {
      // If the value currently does not exist we need to create it
      if (typeof obj.peek() !== 'object') {
        ;(obj as Signal<object>).value = {}
      }
      // First we want to update any child signals that have been added or updated
      for (const [key, entry] of Object.entries(value)) {
        // We get the current item, if it does not exist we create a new one
        const objValue = (obj.peek() as Record<typeof key, Signal<unknown>>)[
          key
        ]
        if (objValue === undefined) {
          ;(obj as Signal<object>).value = {
            ...obj.peek(),
            [key]: deepSignalifyValue(entry),
          }
          continue
        }
        // If it does exist we update the value deeply
        setSignalValuesFromObject(objValue, entry, isPartial)
      }
      // In case there were also values removed, we need to remove them if this is not a partial update
      if (!isPartial) {
        let shouldUpdate = false
        const newObj = Object.fromEntries(
          Object.entries(obj.peek() as object).filter(([key]) => {
            if (!(key in value)) {
              shouldUpdate = true
              return false
            }
            return key in value
          }),
        )
        if (shouldUpdate) {
          ;(obj as Signal<object>).value = newObj
        }
      }
      return obj
    }
    ;(obj as Signal<unknown>).value = value
    return obj
  })
}

/**
 * Sets the value at a given path in a {@link SignalifiedData} object.
 *
 * @param obj - The signalified object to set the value in.
 * @param path - The path to the value.
 * @param value - The value to set.
 *
 * @template TValue - The type of the value that is signalified.
 * @template TPath - The type of the path to the value.
 *
 * @returns {SignalifiedData<ValueAtPath<TValue, TPath>> | undefined} - The signalified value at the path or undefined if the path does not exist.
 *
 * @example
 * ```ts
 * const obj = signal({ name: signal('John') })
 * setSignalValueAtPath(obj, 'name', 'Jane') // obj.value = { name: signal('Jane') }
 * ```
 */
export function setSignalValueAtPath<TValue, TPath extends Paths<TValue>>(
  obj: SignalifiedData<TValue> | Signal<undefined>,
  path: TPath,
  value: ValueAtPath<TValue, TPath> | undefined,
): SignalifiedData<ValueAtPath<TValue, TPath>> | undefined {
  return batch(() => {
    if (path === undefined || !obj) {
      return undefined
    }
    if(!path) {
      return setSignalValuesFromObject(obj, value)
    }
    const parts = pathToParts(path as string)

    if (!obj.peek()) {
      obj.value = {} as any
    }

    let current: Signal = obj
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const nextPart = parts[i + 1]
      const element = 'data' in current ? (current.data as Signal) : current

      // If the current part is already included in the current value, we can continue with that value
      if (
        element.peek() !== undefined &&
        part in element.peek() &&
        nextPart !== undefined
      ) {
        current = element.peek()[part]
        continue
      }

      if (
        nextPart === undefined &&
        !!element.peek() &&
        part in element.peek()
      ) {
        const nextSignal =
          'data' in element.peek()[part]
            ? element.peek()[part].data
            : element.peek()[part]
        setSignalValuesFromObject(nextSignal, value)
        return current
      }

      // If the current part is a number, then we need to set the value in an array
      if (typeof part === 'number') {
        // We know the value is not already included, so we can insert it at the part
        const arrayCopy = [...element.peek()]
        // The new value should not be a signal, but has to be something different depending on the next part
        const newValue =
          nextPart === undefined
            ? value
            : typeof nextPart === 'number'
              ? []
              : {} // We need to signalify the value before inserting it
        arrayCopy[part] = makeArrayEntry(newValue)
        element.value = arrayCopy
      } else {
        // The new value has to be a signal, but has to be something different depending on the next part
        const newValue =
          nextPart === undefined
            ? deepSignalifyValue(value)
            : typeof nextPart === 'number'
              ? signal([])
              : signal({})
        // We know the value is not already included, so we can insert it at the part
        element.value = {
          ...element.peek(),
          [part]: newValue,
        }
      }

      current = element.peek()[part]
    }
    return current
  })
}
