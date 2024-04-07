# Concepts

Before we dive into the details of how to use the library,
let's take a look at what to keep in mind when working with the core components of the library.

## Form

The form is the core component of this library. It acts as **the single source of truth** for all form data. It holds references to both the data of each field and any data not controlled by a specific field.

In addition to managing the data, the form is solely responsible for submitting form data and can handle validation for the complete form data.

These functionalities allow the form to function independently of any fields. All core features can be accessed through the form instance itself.

Nested data is stored using nested signals. This approach ensures that any changes to a value only affect subscribers to the specific child value. You would access nested data in the following way:

```ts
import {FormLogic} from "./FormLogic";

const form = new FormLogic({
  defaultValues: {
    nested: {
      thing: 1
    }
  }
})

// Access a nested value
const nestedValue = form.data.value.nested.thing.value
```

::: tip
Only use the `.value` prop if you want to subscribe to changes of that value, otherwise use the `.peek()` method.
:::

## Field

A field acts as a wrapper for a single piece of data within the form.
It is responsible for storing field-specific state and handling logic like validation and transformation.

Fields are designed to simplify interaction with the form and reduce the need for long method chaining when working with forms containing deeply nested data.

When you create a field, it takes control of the referenced data within the form. It doesn't store the data directly but rather a reference to it. This connects the field value to the field's lifecycle. Any data associated with the field will be removed from the form when the field itself is removed. This behavior can be customized, but by default, the field will delete the referenced data when it's unmounted.

## Arrays

Arrays are mostly handled like every other nested field.
It can be accessed through its path string, and every value is wrapped in a signal.
However, most UI libraries require unique identifiers for array items
to track whether an item is added, removed or moved.
To address this, this library automatically adds a unique `key` identifier to each array signal.

So be aware when using arrays and keep in mind, that the raw data has to be accessed through the `.data` prop.

```ts
import {FormLogic} from "./FormLogic";

const form = new FormLogic({
  defaultValues: {
    array: [1],
    object: {key: 1}
  }
})

// Access an objects value
const objectValue = form.data.value.object.value.key.value
// Access an array item key
const arrayKey = form.data.value.array.data[0].key
// Access an array item value
const arrayValue = form.data.value.array.data[0].data.value
```
