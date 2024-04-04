# Validation API Reference

The validation is a central piece of this library, below you will find the API reference for the validation.

## Adapter

## Validator (sync)

```ts
export type ValidatorSync<
TValue,
TMixins extends readonly any[] = never[],
> = TMixins extends never[]
  ? (value: TValue) => ValidationError
  : (value: [TValue, ...TMixins]) => ValidationError
```

## ValidatorOptions (sync)

## Validator (async)

## ValidatorOptions (async)
