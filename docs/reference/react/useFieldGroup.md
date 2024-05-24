# useFieldGroup API Reference

The following references can be used to create a `FieldGroupLogic` instance in the React context.

## useFieldGroup

It creates a new Field Group based on the provided options.
It takes the same options as `FieldGroupLogic`.

```ts
declare function useFieldGroup<
  TData,
  TMembers extends Paths<TData>[],
  TFieldGroupAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TFieldGroupMixin extends readonly ExcludeAll<
    Paths<TData>,
    TMembers
  >[] = never[],
>(
  form: FormContextType<TData, TFormAdapter> | FormLogic<TData, TFormAdapter>,
  members: TMembers,
  options?: FieldGroupLogicOptions<
    TData,
    TMembers,
    TFieldGroupAdapter extends undefined ? TFormAdapter : TFieldGroupAdapter,
    TFieldGroupMixin
  >,
): FieldGroupContextType<
  TData,
  TMembers,
  TFieldGroupAdapter,
  TFormAdapter,
  TFieldGroupMixin
>;
```

An example of the usage:

```tsx
import { useFieldGroup } from '@formsignals/form-react';

export default function App() {
  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
    },
    onSubmit: (values) => {
      console.log(values);
    },
  });

  const personalGroup = useFieldGroup(form, ['name', 'age']);

  // ...
}
```

## useFieldGroupWithComponents

This is a convenience hook, that turns a `FieldGroupLogic` instance into a `FieldGroupContextType` instance.

```ts
declare function useFieldGroupWithComponents<
  TData,
  TMembers extends Paths<TData>[],
  TFieldGroupAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TFieldGroupMixin extends readonly ExcludeAll<
    Paths<TData>,
    TMembers
  >[] = never[],
>(
  field: FieldGroupLogic<
    TData,
    TMembers,
    TFieldGroupAdapter,
    TFormAdapter,
    TFieldGroupMixin
  >,
): FieldGroupContextType<
  TData,
  TMembers,
  TFieldGroupAdapter,
  TFormAdapter,
  TFieldGroupMixin
>;
```

An example of the usage:

```tsx
import { useFieldGroupWithComponents, FieldGroupLogic, FormLogic } from '@formsignals/form-react';

const form = new FormLogic()
const logic = new FieldGroupLogic(form, ["name", "age"]);

export default function App() {
  const personalGroup = useFieldGroupWithComponents(logic);

  // ...
}
```
