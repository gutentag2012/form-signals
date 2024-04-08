# Dymamic Objects

In some cases, you may want to have a dynamic object structure, where the keys are not known in advance. This library handles these scenarios as if they were static objects, but exposes some helper functions for working with them.

## Helper Functions

When adding a new value to an object, you want to keep the references to the previous signals to ensure the reactivity.
To make this easier, this library exposes helper functions on the form and field to work with dynamic objects.

The following functions are available:

```ts
import {FormLogic} from '@formsignals/form-core';

type FormValues = { [key: string]?: string }
const form = new FormLogic<FormValues>()

// Add a new key to the object
form.setObjectKey('key', 'value')
// Remove a key from the object
form.removeObjectKey('key')
```

::: warning
The types are created in a way, that only allows you to remove keys that are optional.
If you try to remove keys from a `Record<string, string>` you will get a type error.
:::
