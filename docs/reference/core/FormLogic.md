# FormLogic API Reference

The FormLogic is the center of this library, it is the single source of truth for the form values.
Create a new instance of the FormLogic by calling `new FormLogic()`.

```ts
import {FormLogic} from '@formsignals/form-core';

const form = new FormLogic()
```

## Generic Types

The form takes two generic types, `TData` and `TAdapter`.

| Generic Type | Description                                                                                   |
|--------------|-----------------------------------------------------------------------------------------------|
| `TData`      | The type of the form values.                                                                  |
| `TAdapter`   | The type of the validation adapter. Defaults to `undefined`.                                  |

::: warning
If you are using an adapter and no default values,
you need to pass the type of the adapter as well as the form values to the generic arguments of the form.

```ts
import {FormLogic} from '@formsignals/form-core';
import {ZodAdapter} from '@formsignals/validation-adapter-zod';

type FormValues = { name: string };
const form = new FormLogic<FormValues, typeof ZodAdapter>({
  validatorAdapter: ZodAdapter,
});
```

:::

## FormLogicOptions

When creating a form, you can pass the following options:

```ts
export type FormLogicOptions<
  TData,
  TAdapter extends ValidatorAdapter | undefined = undefined,
> = {
  disabled?: boolean

  validatorAdapter?: TAdapter

  validator?: TAdapter extends undefined
    ? ValidatorSync<TData>
    : ValidatorSync<TData> | ReturnType<ValidatorSchemaType<TData, never[]>>
  validatorOptions?: ValidatorOptions

  validatorAsync?: TAdapter extends undefined
    ? ValidatorAsync<TData>
    : ValidatorAsync<TData> | ReturnType<ValidatorSchemaType<TData, never[]>>
  validatorAsyncOptions?: ValidatorAsyncOptions

  validateUnmountedChildren?: boolean

  defaultValues?: TData

  onSubmit?: (data: TData, addErrors: (errors: Partial<Record<Paths<TData>, ValidationError> | ValidationError>) => void) => void | Promise<void>
}
```

| Option                      | Description                                                                                                                                                                                                                                                 |
|-----------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `disabled`                  | If the form is disabled, it will not validate or submit.                                                                                                                                                                                                    |
| `validatorAdapter`          | The adapter that will be used to transform a given validator schema and run the validation on it. <br/>Reference the [Validation API](/reference/core/Validation#adapter).                                                                                  |
| `validator`                 | If no adapter is given, it is a synchronous function that returns an error message. If an adapter is given, it can also be a validation schema fitting for that adapter. <br/>Reference the [Validation API](/reference/core/Validation#validator-sync).    |
| `validatorOptions`          | Options to pass to the synchronous validation. <br/>Reference the [Validation API](/reference/core/Validation#validatoroptions-sync).                                                                                                                       |
| `validatorAsync`            | If no adapter is given, it is an asynchronous function that returns an error message. If an adapter is given, it can also be a validation schema fitting for that adapter. <br/>Reference the [Validation API](/reference/core/Validation#validator-async). |
| `validatorAsyncOptions`     | Options to pass to the asynchronous validation. <br/>Reference the [Validation API](/reference/core/Validation#validatoroptions-async).                                                                                                                     |
| `validateUnmountedChildren` | If set to `true`, the form will validate all fields and groups, even if they are not mounted.                                                                                                                                                               |
| `defaultValues`             | The default values for the form. They will be transformed to the nested signals and set as the form values.                                                                                                                                                 |
| `onSubmit`                  | The function that is called once the form is submitted without any validation errors. This function receives the `TData` as the input as well as a function to add errors to the form or fields during validation. It can be an asynchronous function.      |

## Form State

You can access several states of the form, most of them being signals.

```ts
interface FormLogic<
  TData,
  TAdapter extends ValidatorAdapter | undefined = undefined,
> {
  get data(): SignalifiedData<TData>

  getValueForPath<TPath extends Paths<TData>>(path: TPath): SignalifiedData<ValueAtPath<TData, TPath>>

  get json(): ReadonlySignal<TData>

  get isMounted(): ReadonlySignal<boolean>

  get isValidatingFields(): ReadonlySignal<boolean>

  get errors(): ReadonlySignal<Array<ValidationError>>

  get mountedFieldErrors(): ReadonlySignal<Array<ValidationError>>

  get unmountedFieldErrors(): ReadonlySignal<Array<ValidationError>>

  get fields(): ReadonlySignal<Array<FieldLogic<TData, Paths<TData>, any>>>

  get fieldGroups(): ReadonlySignal<Array<FieldGroupLogic<TData, any>>>

  get isValidForm(): ReadonlySignal<boolean>

  get isValidFields(): ReadonlySignal<boolean>

  get isValidFieldGroups(): ReadonlySignal<boolean>

  get isValid(): ReadonlySignal<boolean>

  get isTouched(): ReadonlySignal<boolean>

  get isDirty(): ReadonlySignal<boolean>

  get submitCountSuccessful(): ReadonlySignal<number>

  get submitCountUnsuccessful(): ReadonlySignal<number>

  get submitCount(): ReadonlySignal<number>

  get isValidatingForm(): ReadonlySignal<boolean>

  get isValidatingFields(): ReadonlySignal<boolean>

  get isValidatingFieldGroups(): ReadonlySignal<boolean>

  get isValidating(): ReadonlySignal<boolean>

  get isSubmitting(): ReadonlySignal<boolean>

  get isSubmitted(): ReadonlySignal<boolean>

  get canSubmit(): ReadonlySignal<boolean>

  get disabled(): ReadonlySignal<boolean>

  get options(): ReadonlySignal<FormLogicOptions<TData, TAdapter> | undefined>
}
```

| State                     | Description                                                                                                                                                        |
|---------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `data`                    | The reactive signal of the form values. **The returned signal can be written to.**                                                                                 |
| `getValueForPath`         | Get the signal of a specific field in the form. **The returned signal can be written to.**                                                                         |
| `json`                    | The signal of the form values as a plain JSON object. All signal references are resolved there.                                                                    |
| `isMounted`               | Is the form currently mounted                                                                                                                                      |
| `errors`                  | The reactive signal of all errors in the form.                                                                                                                     |
| `mountedFieldErrors`      | The reactive signal of all errors in the mounted fields.                                                                                                           |
| `unmountedFieldErrors`    | The reactive signal of all errors in the unmounted fields.                                                                                                         |
| `fields`                  | The reactive signal of all fields in the form.                                                                                                                     |
| `groups`                  | The reactive signal of all field groups in the form.                                                                                                               |
| `isValidForm`             | Is the form valid?                                                                                                                                                 |
| `isValidFields`           | Are all fields valid?                                                                                                                                              |
| `isValidFieldGroups`      | Are all field groups valid?                                                                                                                                        |
| `isValid`                 | Is the form together with all its fields valid?                                                                                                                    |
| `isTouched`               | Is the form touched? The form is touched if any of the fields got blurred.                                                                                         |
| `isDirty`                 | Is the form dirty? This property is calculated based on the current value and the default values. A form is dirty if those values are unequal using deep equality. |
| `submitCountSuccessful`   | The number of successful submits.                                                                                                                                  |
| `submitCountUnsuccessful` | The number of unsuccessful submits.                                                                                                                                |
| `submitCount`             | The number of total submits.                                                                                                                                       |
| `isValidatingFields`      | Is the form currently validating fields?                                                                                                                           |
| `isValidatingForm`        | Is the form currently validating?                                                                                                                                  |
| `isValidatingFieldGroups` | Is the form currently validating field groups?                                                                                                                     |
| `isValidating`            | Is the form currently validating fields or the form?                                                                                                               |
| `isSubmitting`            | Is the form currently submitting?                                                                                                                                  |
| `isSubmitted`             | Has the form been submitted?                                                                                                                                       |
| `canSubmit`               | Can the form be submitted? It can only be submitted, if the form is not currently submitting, is valid, not currently validating and not disabled.                 |
| `disabled`                | Is the form disabled? When disabled the form will not validate or submit.                                                                                          |
| `options`                 | The options passed to the form. If the options get updated, this also reflects here.                                                                               |

## Form Lifecycle Methods

The form has to be mounted and can be unmounted in several cases.

```ts
interface FormLogic<
  TData,
  TAdapter extends ValidatorAdapter | undefined = undefined,
> {
  updateOptions(options?: FormLogicOptions<TData, TAdapter>): void

  mount(): Promise<() => void>

  unmount(): void

  setErrors(errors: Partial<ValidationErrorMap>): void

  disable(): void

  enable(): void
}
```

| Method          | Input           | Description                                                                                                                                           |
|-----------------|-----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|
| `updateOptions` | The new options | Update the options of the form. This can be used to update the validation schema or the default values.                                               |
| `mount`         | -               | Mount the form. This is necessary to start the validation and submit the form.                                                                        |
| `unmount`       | -               | Unmount the form. This is necessary to stop the validation and submit the form.                                                                       |
| `setErrors`     | The new errors  | Set errors to the form. This can be used to add errors to the form that are not part of the validation. Existing errors will stay unless overwritten. |
| `disable`       | -               | Disable the form.                                                                                                                                     |
| `enable`        | -               | Enable the form.                                                                                                                                      |

::: info
When using `updateOptions` to update the form default values,
all form values that have not been changed will be set to the new default values.
:::

## Form Handlers

The form has several handlers that can be used to interact with the form.

```ts
interface FormLogic<
  TData,
  TAdapter extends ValidatorAdapter | undefined = undefined,
> {
  validateForEvent(
    event: ValidatorEvents
  ): void | Promise<void>

  handleChange<TPath extends Paths<TData>>(
    path: TPath,
    newValue: ValueAtPath<TData, TPath>,
    options?: { shouldTouch?: boolean },
  ): void

  handleBlur(): Promise<void>

  handleSubmit(): Promise<void>
}
```

| Handler            | Input                                                                                                                 | Description                                                                                                                                                                                                                     |
|--------------------|-----------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `validateForEvent` | The event to validate for                                                                                             | Validate the form for a specific event. This can be used to manually trigger a validation.                                                                                                                                      |
| `handleChange`     | The path the the value; The value to update to; Additional options, whether the field at that path should get touched | Change the value of a specific field in the form.                                                                                                                                                                               |
| `handleBlur`       | -                                                                                                                     | Trigger the blur event on the form.                                                                                                                                                                                             |
| `handleSubmit`     | -                                                                                                                     | Submit the form. This will validate the form and if it is valid, call the `onSubmit` function. If the `onSubmit` function is an asynchronous function, the form will be in the submitting state until the function is resolved. |

## Field & Field Group Helpers

The form offers several helpers to interact with [fields](/reference/core/FieldLogic) and [field groups](/reference/core/FieldGroupLogic)

```ts
interface FormLogic<
  TData,
  TAdapter extends ValidatorAdapter | undefined = undefined,
> {
  getOrCreateField<TPath extends Paths<TData>, TBoundValue = never, TFieldAdapter extends ValidatorAdapter | undefined = undefined, TMixin extends readonly Exclude<Paths<TData>, TPath>[] = never[]>(
    path: TPath,
    fieldOptions?: FieldLogicOptions<
      TData,
      TPath,
      TBoundValue,
      TFieldAdapter extends undefined ? TAdapter : TFieldAdapter,
      TMixin
    >,
  ): FieldLogic<TData, TPath, TBoundValue, TFieldAdapter, TAdapter, TMixin>

  getDefaultValueForPath<TPath extends Paths<TData>>(
    path: TPath,
  ): ValueAtPath<TData, TPath> | undefined

  getFieldForPath<TPath extends Paths<TData>, TBoundData = never, TFieldAdapter extends ValidatorAdapter | undefined = undefined, TMixin extends readonly Exclude<Paths<TData>, TPath>[] = never[]>(
    path: TPath,
  ): FieldLogic<TData, TPath, TBoundData, TFieldAdapter, TAdapter, TMixin>

  getOrCreateFieldGroup<
    TMembers extends Paths<TData>[],
    TGroupAdapter extends ValidatorAdapter | undefined,
    TMixin extends readonly ExcludeAll<Paths<TData>, TMembers>[] = never[],
  >(
    members: TMembers,
    options?: FieldGroupLogicOptions<
      TData,
      TMembers,
      TGroupAdapter extends undefined ? TAdapter : TGroupAdapter,
      TMixin
    >,
  ): FieldGroupLogic<TData, TMembers, TGroupAdapter, TAdapter, TMixin>
}
```

| Helper                   | Input                                                           | Description                                                                                                                        |
|--------------------------|-----------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| `getOrCreateField`       | The path to the value of the field; The options for the field   | Get or create a field in the form. If a field already exists, its options are getting updated with the passed options.             |
| `getDefaultValueForPath` | The path to the value of the field                              | Get the default value for a specific field in the form.                                                                            |
| `getFieldForPath`        | The path to the value of the field                              | Get a specific field in the form.                                                                                                  |
| `getOrCreateFieldGroup`  | The members of the field group; The options for the field group | Get or create a field group in the form. If a field group already exists, its options are getting updated with the passed options. |

## Form Helpers

The form offers several helpers to interact with [arrays](/guide/array-fields)
and [dynamic objects](/guide/dynamic-objects).

Some of these types might look complex, but they are necessary to ensure that you only can insert, swap or remove at the correct positions.
E.g., you can only swap two values in an array if they are of the same type, or you can never insert into a tuple

```ts
interface FormLogic<
  TData,
  TAdapter extends ValidatorAdapter | undefined = undefined,
> {
  setValueInObject<TPath extends Paths<TData>, TKey extends Paths<ValueAtPath<TData, TPath>>>(
    path: TPath,
    key: TKey,
    value: ValueAtPath<TData, ConnectPath<TPath, TKey>>,
    options?: { shouldTouch?: boolean },
  ): void

  removeValueInObject<TPath extends Paths<TData>, TKey extends Paths<ValueAtPath<TData, TPath>>>(
    path: TPath,
    key: KeepOptionalKeys<ValueAtPath<TData, TPath>, TKey>,
    options?: { shouldTouch?: boolean },
  ): void

  insertValueInArray<TName extends Paths<TData>, Index extends number>(
    name: TName,
    index: Index,
    value: ValueAtPath<TData, TName> extends any[]
      ? ValueAtPath<TData, TName>[number]
      : ValueAtPath<TData, TName> extends readonly any[]
        ? ValueAtPath<TData, TName>[Index]
        : never,
    options?: { shouldTouch?: boolean },
  ): void

  pushValueToArray<TName extends Paths<TData>>(
    name: TName,
    value: ValueAtPath<TData, TName> extends any[]
      ? ValueAtPath<TData, TName>[number]
      : never,
    options?: { shouldTouch?: boolean },
  ): void

  pushValueToArrayAtIndex<TName extends Paths<TData>>(
    name: TName,
    index: ValueAtPath<TData, TName> extends any[] ? number : never,
    value: ValueAtPath<TData, TName> extends any[]
      ? ValueAtPath<TData, TName>[number]
      : never,
    options?: { shouldTouch?: boolean },
  ): void

  removeValueFromArray<TName extends Paths<TData>>(
    name: TName,
    index: ValueAtPath<TData, TName> extends any[] ? number : never,
    options?: { shouldTouch?: boolean },
  ): void

  swapValuesInArray<TName extends Paths<TData>, IndexA extends number, IndexB extends number>(
    name: TName,
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

  moveValueInArray<TName extends Paths<TData>, IndexA extends number, IndexB extends number>(
    name: TName,
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
}
```

| Helper                    | Input                                                                                                                                                                     | Description                                                                                                                    |
|---------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------|
| `setValueInObject`        | The path to the object; The key to the value; The value to update to; Additional options, whether the field at that path should get touched                               | Change the value of a specific key in an object in the form.                                                                   |
| `removeValueInObject`     | The path to the object; The key to the value; Additional options, whether the field at that path should get touched                                                       | Remove a specific key in an object in the form.                                                                                |
| `insertValueInArray`      | The path to the array; The index to insert the value; The value to insert; Additional options, whether the field at that path should get touched                          | Insert a value at a specific index in an array in the form. This will override the value at that position.                     |
| `pushValueToArray`        | The path to the array; The value to push; Additional options, whether the field at that path should get touched                                                           | Push a value to the end of an array in the form.                                                                               |
| `pushValueToArrayAtIndex` | The path to the array; The index to insert the value; The value to insert; Additional options, whether the field at that path should get touched                          | Push a value at a specific index in an array in the form. All indexes >= the wanted index are getting pushed one to the right. |
| `removeValueFromArray`    | The path to the array; The index to remove the value; Additional options, whether the field at that path should get touched                                               | Remove a value at a specific index in an array in the form.                                                                    |
| `swapValuesInArray`       | The path to the array; The index of the first value to swap; The index of the second value to swap; Additional options, whether the field at that path should get touched | Swap two values in an array in the form.                                                                                       |
| `moveValueInArray`        | The path to the array; The index of the value to move; The index to move the value to; Additional options, whether the field at that path should get touched              | Move a value from one index to another in an array in the form.                                                                |

## Form Reset

The form can be reset to its default values and state.

```ts
interface FormLogic<
  TData,
  TAdapter extends ValidatorAdapter | undefined = undefined,
> {
  resetStateForm(): void

  resetStateFields(): void

  resetState(): void

  resetValues(): void

  reset(): void
}
```

| Method             | Description                                                                       |
|--------------------|-----------------------------------------------------------------------------------|
| `resetStateForm`   | Reset the form state.                                                             |
| `resetStateFields` | Reset the fields state. This will call the reset method on each field.            |
| `resetState`       | Reset the form state and the fields state.                                        |
| `resetValues`      | Reset the form values to the default values.                                      |
| `reset`            | Reset the form state, the fields state and the form values to the default values. |
