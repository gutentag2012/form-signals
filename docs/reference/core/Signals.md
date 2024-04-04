# Signals API Reference

The library provides several helper functions to interact with the nested signals.

## makeArrayEntry

This function creates a new array entry for a given value.
It will give it a unique key and create a deep signal for the value.

```ts
declare function makeArrayEntry<T>(value: T): SignalArrayEntry<T>;
```

An example of usage:

```ts
import { makeArrayEntry } from '@formsignals/form-core';

const entry = makeArrayEntry('value');
console.log(entry); // { key: '0', data: signal('value') }
```

## SignalifiedData

This type represents a data object with all its properties signalified.
Array entries are also represented with the key and data props.
An example of usage:

```ts
import {SignalifiedData} from '@formsignals/form-core';

type Data = {
  name: string;
  age: number;
  friends: string[];
};

type Signalified = SignalifiedData<Data>;
// { name: Signal<string>, age: Signal<number>, friends: Signal<Array<{key: number; data: Signal<string>>> }
```

## deepSignalifyValue

This function creates a deep signal for a given value.

```ts
declare function deepSignalifyValue<T>(value: T): SignalifiedData<T>;
```

An example of usage:

```ts
import { deepSignalifyValue } from '@formsignals/form-core';

const signalified = deepSignalifyValue({
  name: 'John',
  age: 25,
  friends: ['Alice'],
});
console.log(signalified); // signals({ name: signal('John'), age: signal(25), friends: signals([ { key: 0, data: signal('Alice') } ]) })
```

## unSignalifyValue

This function removes the signals from a signalified object.
This function will only peek at the values and therefore not subscribe to them.

```ts
declare function unSignalifyValue<T>(
  value: SignalifiedData<T> | SignalifiedData<T>['value'],
): T;
```

An example of usage:

```ts
import { unSignalifyValue } from '@formsignals/form-core';

const signalified = signal({
  name: signal('John'),
  age: signal(25),
  friends: signals([ { key: 0, data: signal('Alice') } ]),
});

const value = unSignalifyValue(signalified);
console.log(value); // { name: 'John', age: 25, friends: ['Alice'] }
```

## unSignalifyValueSubscribed

This function will do the same as `unSignalifyValue` but will subscribe to the signals.
Due to its nature, it will listen to every nested signal values change.

## getSignalValueAtPath

This function retrieves the value of a signal at a given path.

```ts
declare function getSignalValueAtPath<TValue, TPath extends Paths<TValue>>(
  obj: SignalifiedData<TValue> | Signal<undefined>,
  path: TPath,
): SignalifiedData<ValueAtPath<TValue, TPath>> | undefined;
```

An example of usage:

```ts
import { getSignalValueAtPath } from '@formsignals/form-core';

const signalified = signal({
  name: signal('John'),
  age: signal(25),
  friends: signals([ { key: 0, data: signal('Alice') } ]),
});

const value = getSignalValueAtPath(signalified, "friends.0");
console.log(value); // signal('Alice')
```

## removeSignalValueAtPath

This function removes the value of a signal at a given path.

```ts
declare function removeSignalValueAtPath<TValue, TPath extends Paths<TValue>>(
  obj: SignalifiedData<TValue> | Signal<undefined>,
  path: TPath,
): void;
```

An example of usage:

```ts
import { removeSignalValueAtPath } from '@formsignals/form-core';

const signalified = signal({
  name: signal('John'),
  age: signal(25),
  friends: signals([ { key: 0, data: signal('Alice') } ]),
});

removeSignalValueAtPath(signalified, "friends.0");
console.log(signalified); // signals({ name: signal('John'), age: signal(25), friends: signals([]) })
```

## setSignalValuesFromObject

This function sets all values from a given object to a signalified object.
You can also pass a partial object when given the `isPartial` parameter as `true`.

::: info
If the partial parameter is not given, missing array items or object keys will be removed.
:::

```ts
declare function setSignalValuesFromObject<
  TValue,
  IsPartial extends boolean = false,
>(
  obj: SignalifiedData<TValue> | Signal<undefined>,
  value: IsPartial extends true ? Partial<TValue> : TValue | undefined,
  isPartial?: IsPartial,
): SignalifiedData<TValue> | Signal<undefined>;
```

An example of usage:

```ts
import { setSignalValuesFromObject } from '@formsignals/form-core';

const signalified = signal({
  name: signal('John'),
  age: signal(25),
  friends: signals([ { key: 0, data: signal('Alice') } ]),
});

setSignalValuesFromObject(signalified, {
  name: 'Alice',
  age: 30,
  friends: ['John'],
});
console.log(signalified); // signals({ name: signal('Alice'), age: signal(30), friends: signals([ { key: 0, data: signal('John') } ]) })
```

## setSignalValueAtPath

This function sets the value of a signal at a given path.

```ts
declare function setSignalValueAtPath<TValue, TPath extends Paths<TValue>>(
  obj: SignalifiedData<TValue> | Signal<undefined>,
  path: TPath,
  value: ValueAtPath<TValue, TPath> | undefined,
): SignalifiedData<ValueAtPath<TValue, TPath>> | undefined;
```

An example of usage:

```ts
import { setSignalValueAtPath } from '@formsignals/form-core';

const signalified = signal({
  name: signal('John'),
  age: signal(25),
  friends: signals([ { key: 0, data: signal('Alice') } ]),
});

setSignalValueAtPath(signalified, "friends.0", 'Bob');
console.log(signalified); // signals({ name: signal('John'), age: signal(25), friends: signals([ { key: 0, data: signal('Bob') } ]) })
```
