# FormProvider API Reference

The following references are used to propagate the `FormLogic` instance in the React context.

## FormProvider

This component creates the React context.

```ts
declare function FormProvider<
  TData,
  TAdapter extends ValidatorAdapter | undefined = undefined,
>(props: FormProviderProps<TData, TAdapter>): JSX.Element;
```

An example of the usage:

```tsx
import {FormProvider, useForm} from '@formsignals/form-react';

export default function App() {
  const form = useForm()
  return (
    <FormProvider form={form}>
      {/* ... */}
    </FormProvider>
  );
}
```

::: tip
It is recommended to use the `form.FormProvider` component instead of manually creating the context.
:::

## FormProviderProps

This is the prop type for the `FormProvider` component.

```ts
interface FormProviderProps<
  TData,
  TAdapter extends ValidatorAdapter | undefined = undefined,
> extends PropsWithChildren {
  form: FormContextType<TData, TAdapter>
}
```

| Prop   | Description                                                       |
|--------|-------------------------------------------------------------------|
| `form` | The `FormContextType` instance to propagate in the React context. |
