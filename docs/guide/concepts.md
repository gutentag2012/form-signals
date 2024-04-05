# Concepts

Before we dive into the details of how to use the library,
let's take a look at what to keep in mind when working with the core components of the library.

## Form

A form is the main part of the library.
It is the single source of truth for the form data,
it holds all the references to the data of each field and the data that is not controlled by a field.

Besides owning the data,
the form is also alone responsible for the submission of the form data
and can handle validation on the complete form data.

With these functionalities the form is able to work without the need for any fields.
All the core functionalities can be accessed through the form instance.

Nested data will be stored as nested signals,
that way the form can guarantee that each change to a value will only affect subscribers to the child value.
You would access nested data like this:

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

A field is a wrapper around a single piece of data within the form.
It is responsible for storing field-specific state and handling logic like validation and transformation.

Fields are meant
to be used as a way to ease the interaction with the form
and reduce the amount of long chaining for forms with deeply nested data.

Once a field is created, it takes control of the data assigned to it.
It does not store the data itself but rather a reference to the data in the form.
The field value is now connected to the field lifecycle and will be removed from the form when the field is removed.
This behavior can be configured, but by default, the field will destroy the connected data when it is unmounted.

## Arrays

Arrays are mostly handled like every other nested field,
it can be accessed through its path string, and every value is wrapped in a signal.
Most UI libraries, however, need some sort of unique identifier for items in an array
to keep track of whether an item is added,
removed or moved.
For that reason this library adds a unique `key` identifier to each array signal created.

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
