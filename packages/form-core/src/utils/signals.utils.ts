import {signal, Signal} from "@preact/signals";
import {Paths, ValueAtPath} from "./types";
import {pathToParts} from "./access.utils";

// This is a global variable used to assure unique keys for array elements (can be used by react or other libraries to identify elements that do not have a unique key)
let arrayKey = 0;
export const makeArrayEntry = <T>(
  value: T,
): { key: number; signal: SignalifiedData<T> } => ({
  key: arrayKey++,
  signal: deepSignalifyValue(value),
})

type SignalifiedTuple<
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  Tuple extends readonly any[],
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  Acc extends { key: number; signal: SignalifiedData<any> }[] = [],
> = Tuple extends readonly []
  ? Acc
  : Tuple extends readonly [infer Curr, ...infer RestTuple]
    ? SignalifiedTuple<
      RestTuple,
      [...Acc, { key: number; signal: SignalifiedData<Curr> }]
    >
    : never;

export type SignalifiedData<T> = Signal<
  T extends object
    ? T extends Date
      ? T
      : T extends Array<infer U>
        ? Array<{ key: number; signal: SignalifiedData<U> }>
        : // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        T extends readonly any[]
          ? SignalifiedTuple<T>
          : { [K in keyof T]: SignalifiedData<T[K]> }
    : T
>;

export const deepSignalifyValue = <T>(value: T): SignalifiedData<T> => {
  if (
    value instanceof Date ||
    typeof value !== "object" ||
    value === null ||
    value === undefined
  ) {
    return signal(value) as SignalifiedData<T>;
  }

  if (Array.isArray(value)) {
    return signal(value.map(makeArrayEntry)) as SignalifiedData<T>;
  }

  return signal(
    Object.fromEntries(
      Object.entries(value).map(([key, value]) => [
        key,
        deepSignalifyValue(value),
      ]),
    ),
  ) as SignalifiedData<T>;
};

function unSignalifyStep<T>(peekedValue: SignalifiedData<T>[keyof SignalifiedData<T>], unSignalify: (value: SignalifiedData<T>) => T): T {
  if (Array.isArray(peekedValue)) {
    return peekedValue.map((entry) => unSignalify(entry.signal)) as T;
  }

  if (peekedValue instanceof Date || typeof peekedValue !== "object" || peekedValue === null || peekedValue === undefined) {
    return peekedValue as T;
  }

  return Object.fromEntries(
    Object.entries(peekedValue).map(([key, value]) => [key, unSignalify(value)]),
  ) as T;
}

export const unSignalifyValue = <T>(value: SignalifiedData<T>): T => {
  const peekedValue = typeof value === "object" && value instanceof Signal ? value.peek() : value;

  return unSignalifyStep(peekedValue, unSignalifyValue);
}

export const unSignalifyValueSubscribed = <T>(value: SignalifiedData<T>): T => {
  const peekedValue = typeof value === "object" && value instanceof Signal ? value.value : value;

  return unSignalifyStep(peekedValue, unSignalifyValueSubscribed);
}

export const getSignalValueAtPath = <TValue, TPath extends Paths<TValue>>(
  obj: SignalifiedData<TValue> | Signal<undefined>,
  path: TPath,
): SignalifiedData<ValueAtPath<TValue, TPath>> | undefined => {
  if (!path || !obj?.peek()) {
    return undefined;
  }
  const parts = pathToParts(path as string);

  // biome-ignore lint/suspicious/noExplicitAny: We are not sure if the type here is correct, but we want to cast it
  let value: any = obj;
  for (const part of parts) {
    const valuePeek = value.peek();

    // The current object must be given, and the part must be included in the object
    if (
      typeof valuePeek !== "object" ||
      valuePeek === null ||
      !(part in valuePeek)
    ) {
      return undefined;
    }

    // Since arrays have nested in the signal, we need to access its signal
    value = typeof part === "number" ? valuePeek[part].signal : valuePeek[part];
  }

  return value;
};

export const removeSignalValueAtPath = <TValue, TPath extends Paths<TValue>>(
  obj: SignalifiedData<TValue> | Signal<undefined>,
  path: TPath,
) => {
  if (!path || !obj.peek()) {
    return;
  }
  const parts = pathToParts(path as string);
  const parentPath = parts.slice(0, -1).join(".");

  const parent =
    parts.length === 1 ? obj : getSignalValueAtPath(obj, parentPath as Paths<TValue>);
  if (!parent) {
    return;
  }
  const peekedValue = parent.peek()

  const part = parts[parts.length - 1];
  if (typeof part === "number" && Array.isArray(peekedValue)) {
    const arrayCopy = [...peekedValue];
    arrayCopy.splice(part, 1);
    parent.value = arrayCopy as typeof parent["value"];
  } else {
    const { [part as keyof TValue]: _, ...rest } = peekedValue;
    parent.value = rest as typeof parent["value"];
  }
};

export const setSignalValueAtPath = <TValue, TPath extends Paths<TValue>>(
  obj: SignalifiedData<TValue> | Signal<undefined>,
  path: TPath,
  value: ValueAtPath<TValue, TPath> | undefined,
): SignalifiedData<ValueAtPath<TValue, TPath>> | undefined => {
  if (!path || !obj) {
    return undefined;
  }
  const parts = pathToParts(path as string);

  if (!obj.peek()) {
    // biome-ignore lint/suspicious/noExplicitAny: We are building an arbitrary object here, therefore, it has no specific type
    obj.value = {} as any;
  }

  let current: Signal = obj;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    const nextPart = parts[i + 1];
    const element =
      "signal" in current ? (current.signal as Signal) : current;

    // If the current part is already included in the current value, we can continue with that value
    if (!!element.peek() && part in element.peek() && nextPart !== undefined) {
      current = element.peek()[part];
      continue;
    }

    const newValue =
      nextPart === undefined
        ? deepSignalifyValue(value)
        : typeof nextPart === "number"
          ? signal([])
          : signal({});

    // If the current part is a number, then we need to set the value in an array
    if (typeof part === "number") {
      // We know the value is not already included, so we can insert it at the part
      const arrayCopy = [...element.peek()];
      // We need to signalify the value before inserting it
      arrayCopy[part] = makeArrayEntry(value);
      element.value = arrayCopy;
    } else {
      // We know the value is not already included, so we can insert it at the part
      element.value = {
        ...element.peek(),
        [part]: newValue,
      };
    }

    current = element.peek()[part];
  }
  return current;
};
