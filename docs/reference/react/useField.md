# useField API Reference

The following references can be used to create a `FieldLogic` instance in the React context.

## useField

It creates a new Field based on the provided options.
It takes the same options as `FieldLogic`.

```ts
declare function useField<
  TData,
  TName extends Paths<TData>,
  TBoundValue = never,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
>(
  form: FormContextType<TData, TFormAdapter> | FormLogic<TData, TFormAdapter>,
  name: TName,
  options?: FieldLogicOptions<
    TData,
    TName,
    TBoundValue,
    TAdapter extends undefined ? TFormAdapter : TAdapter,
    TMixin
  >,
): FieldContextType<TData, TName, TBoundValue, TAdapter, TFormAdapter, TMixin>;
```

An example of the usage:

```tsx
import { useField } from '@formsignals/form-react';

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

  const nameField = useField(form, 'name');
  const emailField = useField(form, 'email');

  // ...
}
```

## useFieldWithComponents

This is a convenience hook, that turns a `FieldLogic` instance into a `FieldContextType` instance.

```ts
declare function useFieldWithComponents<
  TData,
  TName extends Paths<TData>,
  TBoundValue = never,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
>(
  field: FieldLogic<TData, TName, TBoundValue, TAdapter, TFormAdapter, TMixin>,
): FieldContextType<TData, TName, TBoundValue, TAdapter, TFormAdapter, TMixin>;
```

An example of the usage:

```tsx
import { useFieldWithComponents, FieldLogic, FormLogic } from '@formsignals/form-react';

const form = new FormLogic()
const logic = new FieldLogic(form, "name", {
  defaultValue: '',
});

export default function App() {
  const nameField = useFieldWithComponents(logic);

  // ...
}
```
