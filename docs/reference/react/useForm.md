# useForm API Reference

The following references can be used to create a `FormLogic` instance in the React context.

## useForm

This is the main entry point for the React bindings.
It creates a new Form based on the provided options.

```ts
declare function useForm<
  TData,
  TAdapter extends ValidatorAdapter | undefined = undefined,
>(
  options?: FormLogicOptions<TData, TAdapter>,
): FormContextType<TData, TAdapter>;
```

An example of the usage:

```tsx
import { useForm } from '@formsignals/form-react';

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

  // ...
}
```

## useFormWithComponents

This is a convenience hook, that turns a `FormLogic` instance into a `FormContextType` instance.

```ts
declare function useFormWithComponents<
  TData,
  TAdapter extends ValidatorAdapter | undefined = undefined,
>(form: FormLogic<TData, TAdapter>): FormContextType<TData, TAdapter>;
```

An example of the usage:

```tsx
import { useForm, FormLogic } from '@formsignals/form-react';

const logic = new FormLogic({
  defaultValues: {
    name: '',
    email: '',
  },
  onSubmit: (values) => {
    console.log(values);
  },
});

export default function App() {
  const form = useFormWithComponents(logic);

  // ...
}
```

::: info
This is very useful if you want to keep the `FormLogic` instance separate from the frontend logic.
This is possible thanks to the `@preact/signals-react` bindings.
:::
