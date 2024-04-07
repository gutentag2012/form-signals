---
title: What are Signals?
description: An introduction to Signals and why they are used for Form Signals.
---

# What are Signals?

In short, Signals are reactive values that can be used to trigger UI updates or calculate computed data based on
changes.

Several frontend libraries use Signals as their state management solution, including [Svelte V5](https://svelte.dev/blog/runes), [SolidJS](https://www.solidjs.com/tutorial/introduction_signals), [Angular](https://angular.io/guide/signals), [Qwik](https://qwik.dev/docs/components/state/), [Preact](https://preactjs.com/guide/v10/signals/)
(and possibly many more).
Signals are not just a concept for; they can also be used in vanilla JavaScript code to create reactive values.
The Preact team has built a great solution by exposing their Signals API to the public and even created bindings for
some other libraries like React.

Form Signals is built on top of the Preact Signals API and uses it to manage the form state. For more information, check
out the Preact team's [documentation](https://preactjs.com/guide/v10/signals/).

## Why Signals?

When it comes to complex forms, you usually want to minimize re-renders and only update components that need to display the current state. Signals achieve this by only re-rendering components subscribed to the Signal that changed.
This way, even complex forms with many fields will only update the specific fields that have changed, leading to a smoother and faster user experience.

Preact Signals also offer a powerful feature: computed values. These allow calculating a value based on other Signals. When it comes to forms, a common use case is determining whether a field is dirty. Computed values are only re-calculated when the Signals they depend on change, and only components subscribed to the computed value re-render if its actual return value has changed.

Signals often use an easy-to-understand API. Changes to a Signal are made simply by setting a new value to it. This eliminates the need for an additional function call, and the new values are directly applied and available in subsequent calls to the Signal.

## Basic Example of Signals

You can create a new signal by calling the `signal` function and passing the initial value of the signal.
To access the value of the signal, you can use the `value` property of the signal.

To compute a value based on other signals, you can use the `computed` function and pass a function that returns the
computed value.
Note, that the function returns a `ReadonlySignal` object, which has a `value` property to access the computed value.

```javascript
import {signal, computed} from '@preact/signals-core';

const counterSignal = signal(0);
const doubleCounter = computed(() => counterSignal.value * 2);

console.log(doubleCounter.value); // 0
counterSignal.value++;
console.log(doubleCounter.value); // 2
```

Whenever the `counterSignal` changes, the `doubleCounter` signal will be re-calculated to reflect the updated value. However, `doubleCounter` is lazy. This means it only calculates its value (double the value of `counterSignal`) when it's actually needed by a component or another signal that has subscribed to it. This lazy evaluation helps improve performance by avoiding unnecessary calculations when the value of `doubleCounter` isn't being used.

## Signals Reactivity

Signals are reactive by default. So, whenever a signal's value is accessed with the `.value` property, the value is retrieved reactively. This means that if this is done within a component, a `computed` value, or an `effect`, any change in the value will cause an update.

In some cases, you might not need to subscribe to a signal for updates (e.g., within click handlers). For these scenarios, Preact Signals offer the `.peek()` method. This method allows you to get the current value of the signal without subscribing to it, avoiding unnecessary re-renders.
