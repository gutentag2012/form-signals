# FieldGroupLogic API Reference

The third form primitive is the FieldGroupLogic.
A FieldGroupLogic is always associated with a form that acts as a container for a set of fields.
You could create a new FieldGroupLogic by calling the `FieldGroupLogic` constructor,
however, it is recommended to use the `FormLogic` to create a new FieldGroupLogic.

```ts
import {FormLogic, FieldGroupLogic} from '@formsignals/form-core';

type FormValues = {
  name: string;
};
const form = new FormLogic<FormValues>();

// Manually create a new field group
const fieldManual = new FieldGroupLogic(form, ["name"]);
// Create a new field group throug the form
const field = form.getOrCreateFieldGroup(['name']);
```

## Generic Types

The FieldGroupLogic has several generic type arguments.

| Generic Type   | Description                                                                                                                                    |
|----------------|------------------------------------------------------------------------------------------------------------------------------------------------|
| `TData`        | The data of the complete form.                                                                                                                 |
| `TMembers`     | The paths the to values inside the form values that should be included. There can only be one group with the same set of fields.               |
| `TAdapter`     | The type of the validation adapter. Defaults to `undefined`.                                                                                   |
| `TFormAdapter` | The type of the validation adapter the form uses. The field groups validation adapter falls back to the form adapter. Defaults to `undefined`. |
| `TMixin`       | The paths of the values used for the validation mixin. Defaults to `never[]`.                                                                  |

## FieldGroupLogicOptions

When creating a field group you can pass an options object to the constructor.

```ts
type FieldGroupLogicOptions<
  TData,
  TMembers extends Paths<TData>[],
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly ExcludeAll<Paths<TData>, TMembers>[] = never[],
> = {
  disabled?: boolean

  validatorAdapter?: TAdapter

  validator?: TAdapter extends undefined
    ? ValidatorSync<
      PartialForPaths<TData, TMembers>,
      ValueAtPathForTuple<TData, TMixin>
    >
    :
    | ValidatorSync<
    PartialForPaths<TData, TMembers>,
    ValueAtPathForTuple<TData, TMixin>
  >
    | ReturnType<
    ValidatorSchemaType<
      PartialForPaths<TData, TMembers>,
      ValueAtPathForTuple<TData, TMixin>
    >
  >

  validatorOptions?: ValidatorOptions

  validatorAsync?: TAdapter extends undefined
    ? ValidatorAsync<
      PartialForPaths<TData, TMembers>,
      TMixin extends never ? never : ValueAtPathForTuple<TData, TMixin>
    >
    :
    | ValidatorAsync<
    PartialForPaths<TData, TMembers>,
    TMixin extends never ? never : ValueAtPathForTuple<TData, TMixin>
  >
    | ReturnType<
    ValidatorSchemaType<
      PartialForPaths<TData, TMembers>,
      ValueAtPathForTuple<TData, TMixin>
    >
  >

  validatorAsyncOptions?: ValidatorAsyncOptions

  validateMixin?: TMixin

  onSubmit?: (
    data: PartialForPaths<TData, TMembers>,
    addErrors: (
      errors: Partial<Record<Paths<TData>, ValidationError>> | ValidationError,
    ) => void,
  ) => void | Promise<void>
}
```

| Option                  | Description                                                                                                                                                                                                                                                                   |
|-------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `disabled`              | If set to `true`, the field group and its connected fields will be disabled.                                                                                                                                                                                                  |
| `validatorAdapter`      | The validation adapter to use for this field group. If not set, the field group falls back to the form's validation adapter. <br/>Reference the [Validation API](/reference/core/Validation#adapter).                                                                         |
| `validator`             | The synchronous validation function. If the field group has a validation adapter, this can be a schema. <br/>Reference the [Validation API](/reference/core/Validation#adapter).                                                                                              |
| `validatorOptions`      | The options for the synchronous validation function. <br/>Reference the [Validation API](/reference/core/Validation#adapter).                                                                                                                                                 |
| `validatorAsync`        | The asynchronous validation function. If the field group has a validation adapter, this can be a schema. <br/>Reference the [Validation API](/reference/core/Validation#adapter).                                                                                             |
| `validatorAsyncOptions` | The options for the asynchronous validation function. <br/>Reference the [Validation API](/reference/core/Validation#adapter).                                                                                                                                                |
| `validateMixin`         | The paths of the values used for the validation mixin. <br/>Reference the [Basic Usage](/guide/validation#validation-mixins).                                                                                                                                                 |
| `onSubmit`              | The function that is called once the field group is submitted without any validation errors. This function receives the data of the field group as the input as well as a function to add errors to the form or fields during validation. It can be an asynchronous function. |

## Field Group State

You can access several states of the field group, most of them being signals.

```ts
interface FieldLogicState<
  TData,
  TMembers extends Paths<TData>[],
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly ExcludeAll<Paths<TData>, TMembers>[] = never[],
> {
  get data(): ReadonlySignal<PartialForPaths<TData, TMembers>>

  get form(): FormLogic<TData, TFormAdapter>

  get members(): TMembers

  get fields(): ReadonlySignal<
    Array<FieldLogic<TData, TMembers[number], any>>
  >

  get isValidatingFields(): ReadonlySignal<boolean>

  get isValidatingFieldGroup(): ReadonlySignal<boolean>

  get isValidating(): ReadonlySignal<boolean>

  get errors(): ReadonlySignal<Array<ValidationError>>

  get isMounted(): ReadonlySignal<boolean>

  get isValidFieldGroup(): ReadonlySignal<boolean>

  get isValidFields(): ReadonlySignal<boolean>

  get isValid(): ReadonlySignal<boolean>

  get isDirty(): ReadonlySignal<boolean>

  get dirtyFields(): ReadonlySignal<Partial<TMembers>[]>

  get submitCountSuccessful(): ReadonlySignal<number>

  get submitCountUnsuccessful(): ReadonlySignal<number>

  get submitCount(): ReadonlySignal<number>

  get isSubmitting(): ReadonlySignal<boolean>

  get isSubmitted(): ReadonlySignal<boolean>

  get canSubmit(): ReadonlySignal<boolean>

  get disabled(): ReadonlySignal<boolean>

  get options(): ReadonlySignal<
    | FieldGroupLogicOptions<
      TData,
      TMembers,
      TAdapter extends undefined ? TFormAdapter : TAdapter,
      TMixin
    >
    | undefined
  >
}
```

| State                     | Description                                                                                                                                                      |
|---------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `data`                    | The data of the field group. This is a signal that emits the current data of the field group.                                                                    |
| `form`                    | The form the field group is connected to.                                                                                                                        |
| `members`                 | The paths of the values inside the form values that are included in the field group.                                                                             |
| `fields`                  | The fields of the field group as an array. This is a signal that emits the current fields of the field group.                                                    |
| `isValidatingFields`      | A signal that emits whether the fields of the field group are currently validating.                                                                              |
| `isValidatingFieldGroup`  | A signal that emits whether the field group is currently validating.                                                                                             |
| `isValidating`            | A signal that emits whether the field group or its fields are currently validating.                                                                              |
| `errors`                  | A signal that emits the current errors of the field group.                                                                                                       |
| `isMounted`               | A signal that emits whether the field group is currently mounted.                                                                                                |
| `isValidFieldGroup`       | A signal that emits whether the field group is currently valid.                                                                                                  |
| `isValidFields`           | A signal that emits whether the fields of the field group are currently valid.                                                                                   |
| `isValid`                 | A signal that emits whether the field group and its fields are currently valid.                                                                                  |
| `isDirty`                 | A signal that emits whether the values within the field group are currently dirty.                                                                               |
| `dirtyFields`             | A signal that emits the paths of the values that are currently dirty.                                                                                            |
| `submitCountSuccessful`   | A signal that emits the number of successful submits of the field group.                                                                                         |
| `submitCountUnsuccessful` | A signal that emits the number of unsuccessful submits of the field group.                                                                                       |
| `submitCount`             | A signal that emits the total number of submits of the field group.                                                                                              |
| `isSubmitting`            | A signal that emits whether the field group is currently submitting.                                                                                             |
| `isSubmitted`             | A signal that emits whether the field group has been submitted.                                                                                                  |
| `canSubmit`               | Can the field group be submitted? It can only be submitted, if the field group is not currently submitting, is valid, not currently validating and not disabled. |
| `disabled`                | A signal that emits whether the field group is currently disabled.                                                                                               |
| `options`                 | A signal that emits the options of the field group.                                                                                                              |

## Field Group Lifecycle Methods

The field group has to be mounted and unmounted in several cases.

```ts
interface FieldGroupLogicLifecycle<
  TData,
  TMembers extends Paths<TData>[],
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly ExcludeAll<Paths<TData>, TMembers>[] = never[],
> {
  updateOptions(
    options?: FieldGroupLogicOptions<
      TData,
      TMembers,
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

| Method          | Input           | Description                                                                                                                                                  |
|-----------------|-----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `updateOptions` | The new options | Update the options of the field group. This is useful for changing the validation functions or the default value.                                            |
| `mount`         | -               | Mount the field group. This is necessary to start the validation and to make the field group available for the form.                                         |
| `unmount`       | -               | Unmount the field group. This is necessary to stop the validation and to remove the field group from the form.                                               |
| `setErrors`     | The new errors  | Set errors to the field group. This can be used to add errors to the form that are not part of the validation. Existing errors will stay unless overwritten. |
| `disable`       | -               | Disable the field group.                                                                                                                                     |
| `enable`        | -               | Enable the field group.                                                                                                                                      |

## Field Group Handlers

The field group has a few handlers to interact with the field group.

```ts
interface FieldLogicHandlers<
  TData,
  TMembers extends Paths<TData>[],
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly ExcludeAll<Paths<TData>, TMembers>[] = never[],
> {
  validateForEvent(event: ValidatorEvents, validateIfUnmounted?: boolean): void | Promise<void>

  handleSubmit(): Promise<void>
}
```

| Handler             | Input                                                                   | Description                                                                                                                                                                                                             |
|---------------------|-------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `validateForEvent`  | The event, If the group should be validated even though it is unmounted | Validate the field group for a specific event. This is useful to validate the field group on specific events like `submit` or `change`.                                                                                 |
| `handleSubmit`      | -                                                                       | Submit the field group. This is useful to submit the field group manually. This will trigger the validation and the `onSubmit` function of the field group. Its fields will also be validated for the `onSubmit` event. |

## Field Group Reset

The field group can be reset its state and the ones of its fields.

```ts
interface FieldLogicReset<
  TData,
  TMembers extends Paths<TData>[],
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly ExcludeAll<Paths<TData>, TMembers>[] = never[],
> {
  resetStateFieldGroup(): void

  resetStateFields(): void

  resetState(): void

  resetValues(): void

  reset(): void
}
```

| Method                 | Description                                            |
|------------------------|--------------------------------------------------------|
| `resetStateFieldGroup` | Reset the state of the field group.                    |
| `resetStateFields`     | Reset the state of the fields of the field group.      |
| `resetState`           | Reset the state of the field group and its fields.     |
| `resetValues`          | Reset the values of the fields within the field group. |
| `reset`                | Reset the field group and its fields.                  |
