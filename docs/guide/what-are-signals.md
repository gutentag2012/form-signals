---
title: What are Signals?
description: An introduction to Signals and why they are used for Form Signals.
---

# What are Signals?

In short, Signals are reactive values that can be used to trigger UI updates or calculate computed data based on changes.

There are a few frontend libraries, that use Signals as their state management solution, such as [Svelte V5](https://svelte.dev/blog/runes), [SolidJS](https://www.solidjs.com/tutorial/introduction_signals), [Angular](https://angular.io/guide/signals), [Qwik](https://qwik.dev/docs/components/state/), [Preact](https://preactjs.com/guide/v10/signals/) and possibly many more.
Signals are not only a concept used for UI libraries, but can also be used in default javascript code to create reactive values.
The Preact team has built a great solution and exposing their Signals API to the public and even created bindings for some other libraries like React.

Form Signals is built on top of the Preact Signals API and uses it to manage the form state. For more information, check out the Preact teams [documentation](https://preactjs.com/guide/v10/signals/).

## Why Signals?

When it comes to complex forms, you usually want to have less re-renders and only re-render to components that have to, to display the current state of the form.
Signals are a great way to achieve this, as they only re-render the components that are subscribed to the Signal.
This way, you can have a complex form with many fields and only re-render the fields that have changed.

Preact Signals also have a great concept of computed values, which can be used to calculate a value based on other Signals.
When it comes to forms, there are several state values that can be calculated based on other state values, such as whether a field is dirty.
Computed values are only ever re-calculated when dependent Signals change and only re-render components that are subscribed if the actual return value of the computed value has changed.

Signals often times use an easy-to-understand API, where changes to a Signal can be done by setting a new value to the Signal.
That way there is no need for an additional function call, and the new values are directly applied to the Signal and available in later calls to the signal.

## Basic Example of Signals

You can create a new signal by calling the `signal` function and passing the initial value of the signal.
To access the value of the signal, you can use the `value` property of the signal.

To compute a value based on other signals, you can use the `computed` function and pass a function that returns the computed value.
Note, that the function returns a `ReadonlySignal` object, which has a `value` property to access the computed value.

```javascript
import { signal, computed } from '@preact/signals-core';

const counterSignal = signal(0);
const doubleCounter = computed(() => counterSignal.value * 2);

console.log(doubleCounter.value); // 0
counterSignal.value++;
console.log(doubleCounter.value); // 2
```

Now every time the `counterSignal` changes, the `doubleCounter` signal will be re-calculated.
If there are no listeners to the `doubleCounter` signal, the value will never be re-calculated, since it is lazy.

## Signals Reactivity

Signals are reactive by default, so every time a signals value is accessed with the `.value` property the value of the signal is retrieved reactively.
That means, that if this done from within a component, or a `computed` or an `effect`, every change in the value will case an update.

In many cases where you do not want to explicitly subscribe to the changes (for example in click handlers), you can use the `.peek()` method to get the current value without subscribing to the signal.
