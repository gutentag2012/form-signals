# FieldContext API Reference

The React bindings for this library make use of the React Context API to provide a FieldLogic instance to all child
components.

## FieldContextType

This is the type of object that is provided by the context.
It extends the `FieldLogic` class and adds React components that are bound to the field.
That way you can use the field components and get type-safety without the need to pass generic types around.

```ts
interface FieldContextType<
  TData,
  TName extends Paths<TData>,
  TBoundData = never,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
> extends FieldLogic<TData, TName, TBoundData, TAdapter, TFormAdapter, TMixin> {
  FieldProvider: (props: {
    children: FieldChildren<
      TData,
      TName,
      TBoundData,
      TAdapter,
      TFormAdapter,
      TMixin
    >
  }) => ReactNode
  SubFieldProvider: <
    TChildData extends ValueAtPath<TData, TName>,
    TChildName extends Paths<TChildData>,
    TChildBoundData = never,
    TChildAdapter extends ValidatorAdapter | undefined = undefined,
    TChildMixin extends readonly Exclude<
      Paths<TChildData>,
      TChildName
    >[] = never[],
  >(
    props: FieldProps<
      TChildData,
      TChildName,
      TChildBoundData,
      TChildAdapter,
      TFormAdapter,
      TChildMixin
    >,
  ) => ReactNode
}
```

| Property           | Description                                                                                              |
|--------------------|----------------------------------------------------------------------------------------------------------|
| `FieldProvider`    | A React component that provides the field to all child components.                                       |
| `SubFieldProvider` | A React component that creates a new field that uses the same form and path prefix as the current field. |

## fieldLogicToFieldContext

This function is used to add the React components to a `FieldLogic` instance.

```ts
declare function fieldLogicToFieldContext<
  TData,
  TName extends Paths<TData>,
  TBoundData = never,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
>(
  logic: FieldLogic<TData, TName, TBoundData, TAdapter, TFormAdapter, TMixin>,
): FieldContextType<TData, TName, TBoundData, TAdapter, TFormAdapter, TMixin>;
```

An example of the usage:

```tsx
const logic = form.getOrCreateField("name", {
  defaultValue: '',
});

const context = fieldLogicToFieldContext(logic);

export default function App() {
  return <context.FieldProvider>...</context.FieldProvider>;
}
```

## useFieldContext

This hook is used to get the field context from the nearest `FieldProvider` component.
You can pass in the required generic types to get type-safety.

```ts
declare function useFieldContext<
  TData,
  TName extends Paths<TData>,
  TBoundData = never,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
>(): FieldContextType<
  TData,
  TName,
  TBoundData,
  TAdapter,
  TFormAdapter,
  TMixin
>;
```

::: warning
If used outside a `FieldProvider` component, this hook will throw an error.
:::

An example of the usage:

```tsx
import { useFieldContext, useForm } from '@formsignals/form-react';

type FormValues = {
  name: string;
  email: string;
};

function MyComponent() {
  const field = useFieldContext<FormValues, 'name'>();

  // ...
}

export default function App() {
  const form = useForm<FormValues>()

  return (
    <form.FormProvider>
      <form.FieldProvider name="name">
        <MyComponent />
      </form.FieldProvider>
    </form.FormProvider>
  )
}
```
