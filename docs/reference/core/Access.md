# Access API Reference

The library provides several helper functions to interact with nested access of data.

## pathToParts

This function takes a string path in dot notation and returns an array of parts.

```ts
declare function pathToParts(path: string): Array<string | number>;
```

This is how it would be used:

```ts
import { pathToParts } from '@formsignals/form-core';

const parts = pathToParts('a.0.c');
console.log(parts); // ['a', 0, 'c']
```

::: info
Array indexes are converted to numbers.
:::

## getValueAtPath

This function takes an object and a path in dot notation and returns the value at that path.
If the path does not exist, `undefined` is returned.

```ts
declare function getValueAtPath<TValue, TPath extends Paths<TValue>>(
  obj: TValue | undefined,
  path: TPath,
): ValueAtPath<TValue, TPath> | undefined;
```

This is how it would be used:

```ts
import { getValueAtPath } from '@formsignals/form-core';

const obj = { a: { b: { c: 1 } } };
const value = getValueAtPath(obj, 'a.b.c');
console.log(value); // 1
```

## removeValueAtPath

This function takes an object and a path in dot notation
and returns the same object with the value at that path removed.

```ts
declare function removeValueAtPath<TValue, TPath extends Paths<TValue>>(
  obj: TValue | undefined,
  path: TPath,
): TValue | undefined;
```

This is how it would be used:

```ts
import { removeValueAtPath } from '@formsignals/form-core';

const obj = { a: { b: { c: 1 } } };
const newObj = removeValueAtPath(obj, 'a.b.c');
console.log(newObj); // { a: { b: {} } }
```

## setValueAtPath

This function takes an object, a path in dot notation, and a value
and returns the same object with the value set at that path.

```ts
declare function setValueAtPath<TValue, TPath extends Paths<TValue>>(
  obj: TValue | undefined,
  path: TPath,
  value: ValueAtPath<TValue, TPath>,
): TValue | undefined;
```

This is how it would be used:

```ts
import { setValueAtPath } from '@formsignals/form-core';

const obj = { a: { b: { c: 1 } } };
const newObj = setValueAtPath(obj, 'a.b.c', 2);
console.log(newObj); // { a: { b: { c: 2 } } }
```

::: info
If the path does not exist, it will be created.
:::
