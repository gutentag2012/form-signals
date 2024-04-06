# Validation API Reference

The validation is a central piece of this library, below you will find the API reference for the validation.

## Adapter

An adapter is an object that provides two functions to turn a given schema into a sync or async validator.
It also declares a `ValidatorSchemaType` which is a Typescript limitation and is used to infer the schema type.

```ts
interface ValidatorAdapter {
  sync<TValue, TMixins extends readonly any[] = never[]>(
    schema: any,
  ): ValidatorSync<TValue, TMixins>

  async<TValue, TMixins extends readonly any[] = never[]>(
    schema: any,
  ): ValidatorAsync<TValue, TMixins>
}
```

The return type of the `ValidatorSchemaType` is the schema to use for a given adapter and value.

```ts
interface ValidatorSchemaType<TValue, TMixin> {
  (): never
}
```

::: info
If you are creating your own adapter, make sure to declare the `ValidatorSchemaType` for your adapter.

```ts
declare module '@formsignals/form-core' {
  interface ValidatorSchemaType<TValue, TMixin> {
    (): number
  }
}
```

:::

The adapter receives the schema as an input during validation.
The schema is what is given to the `validator` option if an adapter is configured.

## Validator (sync)

A sync validator is a function that receives a value and returns a `ValidationError` if the value is invalid.
If there are mixins defined, the value will be an array with the value and the mixins.

```ts
export type ValidatorSync<
  TValue,
  TMixins extends readonly any[] = never[],
> = TMixins extends never[]
  ? (value: TValue) => ValidationError
  : (value: [TValue, ...TMixins]) => ValidationError
```

## ValidatorOptions (sync)

The `ValidatorOptions` is an object that contains the options used during the validation.

```ts
interface ValidatorOptions {
  disableOnChangeValidation?: boolean
  disableOnBlurValidation?: boolean
  validateOnMount?: boolean
  validateOnChangeIfTouched?: boolean
}
```

| Option                      | Description                                                 | Default |
|-----------------------------|-------------------------------------------------------------|---------|
| `disableOnChangeValidation` | Disables the validation on change.                          | `false` |
| `disableOnBlurValidation`   | Disables the validation on blur.                            | `false` |
| `validateOnMount`           | Enables the field validation on mount.                      | `false` |
| `validateOnChangeIfTouched` | Only runs the on change validation if the field is touched. | `false` |

## Validator (async)

An async validator is a function that receives a value and returns a `Promise` that resolves to a `ValidationError` if
the value is invalid.
The validator also receives an `AbortSignal` that can be used to determine whether the validation should be aborted.
Mixins work the same as with the sync validator.

```ts
type ValidatorAsync<
  TValue,
  TMixins extends readonly any[] = never[],
> = TMixins extends never[]
  ? (
    value: TValue,
    abortSignal: AbortSignal,
  ) => Promise<ValidationError> | ValidationError
  : (
    value: [TValue, ...TMixins],
    abortSignal: AbortSignal,
  ) => Promise<ValidationError> | ValidationError
```

## ValidatorOptions (async)

The `ValidatorOptions` for async validators extend the sync options and add options for async validation.

```ts
interface ValidatorAsyncOptions extends ValidatorOptions {
  debounceMs?: number
  accumulateErrors?: boolean
}
```

| Option             | Description                                                  | Default     |
|--------------------|--------------------------------------------------------------|-------------|
| `debounceMs`       | The debounce time in milliseconds.                           | `undefined` |
| `accumulateErrors` | Accumulates the errors instead of stopping at the first one. | `false`     |

## ErrorTransformers

This is a collection of functions, that can be used to transform the error messages form a schema validation library to a format that is used by this library.

```ts
interface ErrorTransformers {
  zod: (issues: ZodIssue[]) => Record<string, string>
}
```

::: info
Currently only `zod` is supported.
:::
