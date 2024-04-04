# Validation

Let's take a deeper look at how validation is used within the library.

## Basic Validation

As described in the [Basic Usage](/guide/basic-usage#add-validation) section,
validation is added through the `validator` option when constructing a form or a field.
This `validator` is a simple function, that takes the current value and returns either an error message as a string,
or `undefined` if the value is valid.

```ts
import {FormLogic} from '@formsignals/form-core';

const form = new FormLogic({
  defaultValues: {
    name: '',
  },
  validator: (values) => values.name ? undefined : 'Name is required',
})
```

If the validation is no run with a falsy value for name, the form will be invalid.

## Validation Options

There are several options that can be used to customize the validation behavior.

The default configuration will always run validation if the value changes
(for the form it runs on every nested change, for the field it only runs if the field value is changed).
Validation will also run once the `handleBlur` method is called or if the form is submitted.

::: info
The onChange validation is also run
when the value is changed directly through the signal and not through the `handleChange` method.
:::

You can customize this behavior by providing the `validatorOptions`.
These allow you to specify the following:

| Option                       | Type      | Default | Description                                                                               |
|------------------------------|-----------|---------|-------------------------------------------------------------------------------------------|
| `validateOnMount`            | `boolean` | `false` | If set to `true`, the validation will run when the form/field is mounted.                 |
| `disabledOnChangeValidation` | `boolean` | `false` | If set to `true`, the validation will not run when the value changes.                     |
| `disabledOnBlurValidation`   | `boolean` | `false` | If set to `true`, the validation will not run when the field is blurred.                  |
| `validateOnChangeIfTouched`  | `boolean` | `false` | If set to `true`, the onChange validation will only run after the field has been touched. |

::: info
It is not possible to disable the validation on submit.
:::

## Async Validation

This library also allows for async validation by default.
To do that, pass an asynchronous function to the `validatorAsync` option.
It follows the same rules as the synchronous validation, but instead of returning a string,
it returns a promise that resolves to a string or `undefined`.
It also receives an `AbortSignal` as a second argument, which can be used to cancel the validation.
If the signal is aborted, the validation is considered canceled and all errors are discarded.

::: info
An older validation is always cancelled when a new one is started.
:::

```ts
import {FormLogic} from '@formsignals/form-core';

const form = new FormLogic({
  defaultValues: {
    name: '',
  },
  validatorAsync: async (values, abortSignal) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (abortSignal.aborted) return;
    return values.name ? undefined : 'Name is required';
  },
})
```

The options for async validation are the same as for the synchronous validation,
they are passed to the `validatorAsyncOptions` option.

You can run both synchronous and asynchronous validation at the same time.
By default, the synchronous validation is run first and if it fails, the async validation is not run.
You can customize this behavior by setting the `accumulateErrors` option in the `validatorAsyncOptions` to `true`.
This will run both validations and accumulate the errors, meaning that if both fail, the form/field will have both
errors.

### Debounced Validation

Sometimes you might want to have a validation, that is debounced.
So it should only execute after a certain amount of time has passed since the last validation.

You can achieve this by using the `debounceMs` option on the `validatorAsyncOptions`.
Setting a number greater than 0 will debounce the validation by that number of milliseconds.

```ts
import {FormLogic} from '@formsignals/form-core';

const form = new FormLogic({
  defaultValues: {
    name: '',
  },
  validatorAsync: async (values, abortSignal) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (abortSignal.aborted) return;
    return values.name ? undefined : 'Name is required';
  },
  validatorAsyncOptions: {
    debounceMs: 500,
  },
})
```

::: info
The abortSignal of the validator is also aborted if there is a new debounced validation.
That means, with this example, you will only see the error message after 1500ms after the last validation.
:::

## Deep Validation

As mentioned before, the form will run onChange validation on every nested change.
Fields, however, only run validation if the direct value is changed.
So if you have a field that has an array value, it only runs validation if elements are added, removed or swapped.
No validation will be run if the value of an array item is changed.

This library allows you to listen to those deep changes
and trigger an onChange validation on a parent if a nested value changes.
To do that, you can set the `validateOnNestedChange` option to `true` when creating a new field.

```ts
import {FormLogic} from '@formsignals/form-core';

const form = new FormLogic({
  defaultValues: {
    friends: ['Alice', 'Bob'],
  },
})

const field = form.getOrCreateField('friends', {
  validateOnNestedChange: true,
  validator: (value) => value.some(friend => !friend.length) ? 'All friends must have a name' : undefined,
})
console.log(field.errors.value) // []
// Change the value of the first array item
field.data.value[0].data.value = ''
console.log(field.errors.value) // ["All friends must have a name"]
```

::: info
This will work for changes in any depth of the value.
So even a change 5 levels deep will trigger the validation of the parent.
:::

## Validation Mixins

Sometimes you have to validate a field relative to the value of another field.
Many libraries struggle with this issue and usually require you to have validation on a common parent.
This library solves the issue with validation mixins,
which allow you to add any other value from the form to the validation function.

To do that, add the paths as an array to the `validateMixin` option when creating a new field.
This will transform the input of the validator to a tuple,
where the first value is the value of the field,
and the other values are the values provided by the paths in the same order.

```ts
import {FormLogic} from '@formsignals/form-core';

const form = new FormLogic({
  defaultValues: {
    password: '',
    confirmPassword: '',
  },
})

const field = form.getOrCreateField('password', {
  validateMixin: ['confirmPassword'] as const,
  validator: ([value, confirmPassword]) => value === confirmPassword ? undefined : 'Passwords do not match',
})
```

::: info
It is recommended to use the `as const` assertion to get the best type safety.
If you don't use it, the type of the mixins in the validator will be a tuple of all mixin types.
:::

## Validation Adapters

This library also allows you
to use schema validation libraries like [`zod`](https://zod.dev/) through validation adapters.
To use them add the `validatorAdapter` option to the form or field.
Then you can add the respective schema as the `validator` or `validatorAsync` option.

All previous topics such as deep validation and mixins are also supported with the adapters.

### Zod Adapter

To get started with the Zod adapter, you need to install the `@formsignals/form-validation-zod` package.
Then you can use the `ZodAdapter` for the validation adapter.

```ts
import {FormLogic} from '@formsignals/form-core';
import {ZodAdapter} from '@formsignals/form-validation-zod';
import {z} from 'zod';

const form = new FormLogic({
  defaultValues: {
    name: '',
  },
  validatorAdapter: ZodAdapter,
  validator: z.object({
    name: z.string().min(3),
  }),
})
```

The adapter will also be available for the fields when given to the form.

```ts
import {FormLogic} from '@formsignals/form-core';
import {ZodAdapter} from '@formsignals/form-validation-zod';
import {z} from 'zod';

const form = new FormLogic({
  defaultValues: {
    name: '',
  },
  validatorAdapter: ZodAdapter,
})

const field = form.getOrCreateField('name', {
  validator: z.string().min(3),
})
```

::: info
You can still use the default validation function event when using the adapter.
:::

You can also configure the default behavior of this adapter by using the `configureZodAdapter` function.
You can configure the following:

| Option           | Type      | Default | Description                                                                                   |
|------------------|-----------|---------|-----------------------------------------------------------------------------------------------|
| `takeFirstError` | `boolean` | `false` | If set to `true`, the adapter will only return the first error message returned when parsing. |
| `joinErrorsWith` | `string`  | `", "`  | If set, the adapter will join all error messages with this string.                            |

```ts
import {FormLogic} from '@formsignals/form-core';
import {configureZodAdapter} from '@formsignals/form-validation-zod';
import {z} from 'zod';

const form = new FormLogic({
  defaultValues: {
    name: '',
  },
  validatorAdapter: configureZodAdapter({
    takeFirstError: false,
    joinErrorsWith: '\n',
  }),
  validator: z.object({
    name: z.string().min(3),
  }),
})
```
