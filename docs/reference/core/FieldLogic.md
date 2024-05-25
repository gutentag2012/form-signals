# FieldLogic API Reference

Another significant part of the library is the FieldLogic.
A FieldLogic is always associated with a form that acts as a container for the data.
You could create a new FieldLogic by calling the `FieldLogic` constructor,
however, it is recommended to use the `FormLogic` to create a new FieldLogic.

```ts
import {FormLogic, FieldLogic} from '@formsignals/form-core';

type FormValues = {
  name: string;
};
const form = new FormLogic<FormValues>();

// Manually create a new field
const fieldManual = new FieldLogic(form, "name");
// Create a new field throug the form
const field = form.getOrCreateField('name');
```

## Generic Types

The FieldLogic has several generic type arguments.

| Generic Type   | Description                                                                                                                                    |
|----------------|------------------------------------------------------------------------------------------------------------------------------------------------|
| `TData`        | The data of the complete form.                                                                                                                 |
| `TName`        | The path the to value inside the form values. This is also used as the name of the field.                                                      |
| `TBoundValue`  | If the field uses transformer functions, the type of the [binding](/guide/basic-usage#add-transformation) is marked here. Defaults to `never`. |
| `TAdapter`     | The type of the validation adapter. Defaults to `undefined`.                                                                                   |
| `TFormAdapter` | The type of the validation adapter the form uses. The fields validation adapter falls back to the form adapter. Defaults to `undefined`.       |
| `TMixin`       | The paths of the values used for the validation mixin. Defaults to `never[]`.                                                                  |

## FieldLogicOptions

When creating a field you can pass an options object to the constructor.

```ts
type FieldLogicOptions<
  TData,
  TName extends Paths<TData>,
  TBoundValue = never,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
> = {
  disabled?: boolean

  validatorAdapter?: TAdapter

  validator?: TAdapter extends undefined
    ? ValidatorSync<
      ValueAtPath<TData, TName>,
      ValueAtPathForTuple<TData, TMixin>
    >
    :
    | ValidatorSync<
    ValueAtPath<TData, TName>,
    ValueAtPathForTuple<TData, TMixin>
  >
    | ReturnType<
    ValidatorSchemaType<
      ValueAtPath<TData, TName>,
      ValueAtPathForTuple<TData, TMixin>
    >
  >
  validatorOptions?: ValidatorOptions

  validatorAsync?: TAdapter extends undefined
    ? ValidatorAsync<
      ValueAtPath<TData, TName>,
      TMixin extends never ? never : ValueAtPathForTuple<TData, TMixin>
    >
    :
    | ValidatorAsync<
    ValueAtPath<TData, TName>,
    TMixin extends never ? never : ValueAtPathForTuple<TData, TMixin>
  >
    | ReturnType<
    ValidatorSchemaType<
      ValueAtPath<TData, TName>,
      ValueAtPathForTuple<TData, TMixin>
    >
  >
  validatorAsyncOptions?: ValidatorAsyncOptions

  validateOnNestedChange?: boolean
  validateMixin?: TMixin

  defaultValue?: ValueAtPath<TData, TName>

  defaultState?: {
    isTouched?: boolean
    errors?: Partial<ValidationErrorMap>
  }

  removeValueOnUnmount?: boolean
  resetValueToDefaultOnUnmount?: boolean

  transformFromBinding?: (value: TBoundValue) => ValueAtPath<TData, TName>
  transformToBinding?: (value: ValueAtPath<TData, TName>) => TBoundValue
}
```

| Option                         | Description                                                                                                                                                                               |
|--------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `disabled`                     | If set to `true`, the field will be disabled.                                                                                                                                             |
| `validatorAdapter`             | The validation adapter to use for this field. If not set, the field falls back to the form's validation adapter. <br/>Reference the [Validation API](/reference/core/Validation#adapter). |
| `validator`                    | The synchronous validation function. If the field has a validation adapter, this can be a schema. <br/>Reference the [Validation API](/reference/core/Validation#adapter).                |
| `validatorOptions`             | The options for the synchronous validation function. <br/>Reference the [Validation API](/reference/core/Validation#adapter).                                                             |
| `validatorAsync`               | The asynchronous validation function. If the field has a validation adapter, this can be a schema. <br/>Reference the [Validation API](/reference/core/Validation#adapter).               |
| `validatorAsyncOptions`        | The options for the asynchronous validation function. <br/>Reference the [Validation API](/reference/core/Validation#adapter).                                                            |
| `validateOnNestedChange`       | If set to `true`, the field will validate when a nested value changes. <br/>Reference the [Basic Usage](/guide/validation#deep-validation).                                               |
| `validateMixin`                | The paths of the values used for the validation mixin. <br/>Reference the [Basic Usage](/guide/validation#validation-mixins).                                                             |
| `defaultValue`                 | The default value of the field.                                                                                                                                                           |
| `defaultState`                 | The default state of the field. There you can set default errors and the touched state.                                                                                                   |
| `removeValueOnUnmount`         | If set to `true`, the value of the field will be removed when the field is unmounted.                                                                                                     |
| `resetValueToDefaultOnUnmount` | If set to `true`, the value of the field will be reset to the default value when the field is unmounted.                                                                                  |
| `transformFromBinding`         | The function to transform the value from the binding. <br/>Reference the [Basic Usage](/guide/basic-usage#add-transformation)                                                             |
| `transformToBinding`           | The function to transform the value to the binding. <br/>Reference the [Basic Usage](/guide/basic-usage#add-transformation)                                                               |

## Field State

You can access several states of the field, most of them being signals.

```ts
interface FieldLogicState<
  TData,
  TName extends Paths<TData>,
  TBoundValue = never,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
> {
  get data(): SignalifiedData<ValueAtPath<TData, TName>>

  get transformedData(): Signal<TBoundValue>

  get form(): FormLogic<TData, TFormAdapter>

  get name(): TName

  get currentNamePart(): LastPath<TName>

  get getParentNamePart(): ParentPath<TName>

  get isMounted(): Signal<boolean>

  get isValidating(): ReadonlySignal<boolean>

  get errors(): ReadonlySignal<Array<ValidationError>>

  get isValid(): ReadonlySignal<boolean>

  get isTouched(): ReadonlySignal<boolean>

  get isDirty(): ReadonlySignal<boolean>

  get disabled(): ReadonlySignal<boolean>

  get defaultValue(): ReadonlySignal<ValueAtPath<TData, TName> | undefined>
}
```

| State               | Description                                                                                                                                                 |
|---------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `data`              | The value of the field as a signal. This references the value inside the form. **The returned signal can be written to.**                                   |
| `transformedData`   | The transformed value of the field. This utilizes the `transformFromBinding` and `transformToBinding` functions. **The returned signal can be written to.** |
| `form`              | The form the field is associated with.                                                                                                                      |
| `name`              | The path to the value inside the form values.                                                                                                               |
| `currentNamePart`   | The last part of the name. If this is an array item, a number will be returned instead of a string.                                                         |
| `getParentNamePart` | The parent part of the name.                                                                                                                                |
| `isMounted`         | If the field is mounted.                                                                                                                                    |
| `isValidating`      | If the field is currently validating.                                                                                                                       |
| `errors`            | The errors of the field. As an array where the first item is the sync error and the second item is the async error.                                         |
| `isValid`           | If the field is valid.                                                                                                                                      |
| `isTouched`         | If the field is touched.                                                                                                                                    |
| `isDirty`           | If the field is dirty. This is a computed state, calculated based on whether the data is unequal to the default values using deep equality.                 |
| `disabled`          | If the field is disabled. Disabled fields will not run validations and do not accept calls to their handlers.                                               |
| `defaultValue`      | The default value of the field.                                                                                                                             |

## Field Lifecycle Methods

The field has to be mounted and unmounted in several cases.

```ts
interface FieldLogicLifecycle<
  TData,
  TName extends Paths<TData>,
  TBoundValue = never,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
> {
  updateOptions(
    options?: FieldLogicOptions<
      TData,
      TName,
      TBoundValue,
      TAdapter extends undefined ? TFormAdapter : TAdapter,
      TMixin
    >,
  ): void

  mount(): Promise<() => void>

  unmount(): void

  setErrors(errors: Partial<ValidationErrorMap>): void

  disable(): void

  enable(): void
}
```

| Method          | Input           | Description                                                                                                                                            |
|-----------------|-----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| `updateOptions` | The new options | Update the options of the field. This is useful for changing the validation functions or the default value.                                            |
| `mount`         | -               | Mount the field. This is necessary to start the validation and to make the field available for the form.                                               |
| `unmount`       | -               | Unmount the field. This is necessary to stop the validation and to remove the field from the form.                                                     |
| `setErrors`     | The new errors  | Set errors to the field. This can be used to add errors to the form that are not part of the validation. Existing errors will stay unless overwritten. |
| `disable`       | -               | Disable the field. This will prevent the field from being changed.                                                                                     |
| `enable`        | -               | Enable the field. This will allow the field to be changed again.                                                                                       |

::: info
When using `updateOptions` to update the field default values,
the field current value will be set to the new default value if the field is not dirty.
:::

## Field Handlers

The field has several handlers to interact with the field.

```ts
interface FieldLogicHandlers<
  TData,
  TName extends Paths<TData>,
  TBoundValue = never,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
> {
  validateForEvent(
    event: ValidatorEvents,
    validateIfUnmounted?: boolean,
  ): void | Promise<void>

  handleChange(
    newValue: ValueAtPath<TData, TName>,
    options?: { shouldTouch?: boolean },
  ): void

  handleChangeBound(
    newValue: TBoundValue,
    options?: { shouldTouch?: boolean },
  ): void

  handleBlur(): Promise<void>

  handleTouched(): void
}
```

| Handler             | Input                                                                        | Description                                                                                                                                                     |
|---------------------|------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `validateForEvent`  | The event type, If the field should be validated even though it is unmounted | Validate the field for a specific event. This can be used to manually trigger validation.                                                                       |
| `handleChange`      | The new value                                                                | Change the value of the field.                                                                                                                                  |
| `handleChangeBound` | The new value                                                                | Change the value of the field from the binding. The given value will run through the `transformFromBinding` function and set the data in the form to its result |
| `handleBlur`        | -                                                                            | Trigger the blur event. This will trigger the validation and set the field to touched.                                                                          |
| `handleTouched`     | -                                                                            | Set the field to touched.                                                                                                                                       |

## Field Helpers

The field offers several helpers to interact with [arrays](/guide/array-fields)
and [dynamic objects](/guide/dynamic-objects).

Some of these types might look complex, but they are necessary to ensure that you only can insert, swap or remove at the correct positions.
E.g., you can only swap two values in an array if they are of the same type, or you can never insert into a tuple

```ts
interface FieldLogicHelpers<
  TData,
  TName extends Paths<TData>,
  TBoundValue = never,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
> {
  setValueInObject<TKey extends Paths<ValueAtPath<TData, TName>>>(
    key: TKey,
    value: ValueAtPath<TData, ConnectPath<TName, TKey>>,
    options?: { shouldTouch?: boolean },
  ): void

  removeValueInObject<TKey extends Paths<ValueAtPath<TData, TName>>>(
    key: KeepOptionalKeys<ValueAtPath<TData, TName>, TKey>,
    options?: { shouldTouch?: boolean },
  ): void

  insertValueInArray<Index extends number>(
    index: Index,
    value: ValueAtPath<TData, TName> extends any[]
      ? ValueAtPath<TData, TName>[number]
      : ValueAtPath<TData, TName> extends readonly any[]
        ? ValueAtPath<TData, TName>[Index]
        : never,
    options?: { shouldTouch?: boolean },
  ): void

  pushValueToArray(
    value: ValueAtPath<TData, TName> extends any[]
      ? ValueAtPath<TData, TName>[number]
      : never,
    options?: { shouldTouch?: boolean },
  ): void

  pushValueToArrayAtIndex(
    index: ValueAtPath<TData, TName> extends any[] ? number : never,
    value: ValueAtPath<TData, TName> extends any[]
      ? ValueAtPath<TData, TName>[number]
      : never,
    options?: { shouldTouch?: boolean },
  ): void

  removeValueFromArray(
    index: ValueAtPath<TData, TName> extends any[] ? number : never,
    options?: { shouldTouch?: boolean },
  ): void

  removeSelfFromArray(options?: { shouldTouch?: boolean }): void

  swapValuesInArray<IndexA extends number, IndexB extends number>(
    indexA: ValueAtPath<TData, TName> extends any[]
      ? number
      : ValueAtPath<TData, TName> extends readonly any[]
        ? ValueAtPath<TData, TName>[IndexA] extends ValueAtPath<
            TData,
            TName
          >[IndexB]
          ? number
          : never
        : never,
    indexB: ValueAtPath<TData, TName> extends any[]
      ? number
      : ValueAtPath<TData, TName> extends readonly any[]
        ? ValueAtPath<TData, TName>[IndexB] extends ValueAtPath<
            TData,
            TName
          >[IndexA]
          ? number
          : never
        : never,
    options?: { shouldTouch?: boolean },
  ): void

  swapSelfInArray<IndexB extends number>(
    indexB: ValueAtPath<TData, ParentPath<TName>> extends any[]
      ? number
      : ValueAtPath<TData, ParentPath<TName>> extends readonly any[]
        ? ValueAtPath<TData, ParentPath<TName>>[IndexB] extends ValueAtPath<
            TData,
            TName
          >
          ? number
          : never
        : never,
    options?: { shouldTouch?: boolean },
  ): void

  moveValueInArray<IndexA extends number, IndexB extends number>(
    indexA: ValueAtPath<TData, TName> extends any[]
      ? number
      : ValueAtPath<TData, TName> extends readonly any[]
        ? ValueAtPath<TData, TName>[IndexA] extends ValueAtPath<
            TData,
            TName
          >[IndexB]
          ? number
          : never
        : never,
    indexB: ValueAtPath<TData, TName> extends any[]
      ? number
      : ValueAtPath<TData, TName> extends readonly any[]
        ? ValueAtPath<TData, TName>[IndexB] extends ValueAtPath<
            TData,
            TName
          >[IndexA]
          ? number
          : never
        : never,
    options?: { shouldTouch?: boolean },
  ): void

  moveSelfInArray<IndexB extends number>(
    indexB: ValueAtPath<TData, ParentPath<TName>> extends any[]
      ? number
      : ValueAtPath<TData, ParentPath<TName>> extends readonly any[]
        ? ValueAtPath<TData, ParentPath<TName>>[IndexB] extends ValueAtPath<
            TData,
            TName
          >
          ? number
          : never
        : never,
    options?: { shouldTouch?: boolean },
  ): void
}
```

| Helper                    | Input                                                                                                                                              | Description                                                                                                       |
|---------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| `setValueInObject`        | The key to the value; The value to update to; Additional options, whether the field at that path should get touched                                | Change the value of a specific key in an object.                                                                  |
| `removeValueInObject`     | The key to the value; Additional options, whether the field at that path should get touched                                                        | Remove a specific key in an object.                                                                               |
| `insertValueInArray`      | The index to insert the value; The value to insert; Additional options, whether the field at that path should get touched                          | Insert a value at a specific index in an array. This will override the value at that position.                    |
| `pushValueToArray`        | The value to push; Additional options, whether the field at that path should get touched                                                           | Push a value to the end of an array.                                                                              |
| `pushValueToArrayAtIndex` | The index to insert the value; The value to insert; Additional options, whether the field at that path should get touched                          | Push a value at a specific index in an array. All indexes >= the wanted index are getting pushed one to the right |
| `removeValueFromArray`    | The index to remove the value; Additional options, whether the field at that path should get touched                                               | Remove a value at a specific index in an array.                                                                   |
| `removeSelfFromArray`     | Additional options, whether the field at that path should get touched                                                                              | Remove this field from the parent array. **Only works for array items**                                           |
| `swapValuesInArray`       | The index of the first value to swap; The index of the second value to swap; Additional options, whether the field at that path should get touched | Swap two values in an array.                                                                                      |
| `swapSelfInArray`         | The index of the second value to swap; Additional options, whether the field at that path should get touched                                       | Swap the field with another value in an array. **Only works for array items**                                     |
| `moveValueInArray`        | The index of the value to move; The index to move the value to; Additional options, whether the field at that path should get touched              | Move a value from one index to another in an array.                                                               |
| `moveSelfInArray`         | The index to move the value to; Additional options, whether the field at that path should get touched                                              | Move the field to another index in an array. **Only works for array items**                                       |

## Field Reset

The field can be reset to its default values and state.

```ts
interface FieldLogicReset<
  TData,
  TName extends Paths<TData>,
  TBoundValue = never,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
> {
  resetState(): void

  resetValue(): void

  reset(): void
}
```

| Method        | Description                                        |
|---------------|----------------------------------------------------|
| `resetState`  | Reset the state of the field.                      |
| `resetValue`  | Reset the value of the field to the default value. |
| `reset`       | Reset the state and the value of the field.        |
