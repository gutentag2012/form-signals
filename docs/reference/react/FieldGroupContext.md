# FieldGroupContext API Reference

The React bindings for this library make use of the React Context API to provide a FieldGroupLogic instance to all child
components.

## FieldGroupContextType

This is the type of object that is provided by the context.
It extends the `FieldGroupLogic` class and adds React components that are bound to the field.
That way you can use the field group components and get type-safety without the need to pass generic types around.

```ts
interface FieldGroupContextType<
  TData,
  TMembers extends Paths<TData>[],
  TFieldGroupAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TFieldGroupMixin extends readonly ExcludeAll<
    Paths<TData>,
    TMembers
  >[] = never[],
> extends FieldGroupLogic<
  TData,
  TMembers,
  TFieldGroupAdapter,
  TFormAdapter,
  TFieldGroupMixin
> {
  FieldProvider: <
    TName extends TMembers[number],
    TBoundData = never,
    TAdapter extends ValidatorAdapter | undefined = undefined,
    TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
  >(props: {
    name: TName
    options?: FieldLogicOptions<
      TData,
      TName,
      TBoundData,
      TAdapter extends undefined ? TFormAdapter : TAdapter,
      TMixin
    >
    children: FieldChildren<
      TData,
      TName,
      TBoundData,
      TAdapter,
      TFormAdapter,
      TMixin
    >
  }) => ReactNode

  FieldGroupProvider: (props: {
    children: FieldGroupChildren<
      TData,
      TMembers,
      TFieldGroupAdapter,
      TFormAdapter,
      TFieldGroupMixin
    >
  }) => ReactNode
}
```

| Property             | Description                                                                                               |
|----------------------|-----------------------------------------------------------------------------------------------------------|
| `FieldProvider`      | A React component that provides the field to all child components.                                        |
| `FieldGroupProvider` | A React component that creates a new field group within the form and provides it to all child components. |

## fieldGroupLogicToFieldGroupContext

This function is used to add the React components to a `FieldGroupLogic` instance.

```ts
declare function fieldGroupLogicToFieldGroupContext<
  TData,
  TMembers extends Paths<TData>[],
  TFieldGroupAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly ExcludeAll<Paths<TData>, TMembers>[] = never[],
>(
  logic: FieldGroupLogic<
    TData,
    TMembers,
    TFieldGroupAdapter,
    TFormAdapter,
    TMixin
  >,
): FieldGroupContextType<
  TData,
  TMembers,
  TFieldGroupAdapter,
  TFormAdapter,
  TMixin
>;
```

An example of the usage:

```tsx
const logic = form.getOrCreateFieldGroup(["name", "age"]);

const context = fieldGroupLogicToFieldGroupContext(logic);

export default function App() {
  return <context.FieldGroupProvider>...</context.FieldGroupProvider>;
}
```

## useFieldGroupContext

This hook is used to get the field group context from the nearest `FieldGroupProvider` component.
You can pass in the required generic types to get type-safety.

```ts
declare function useFieldGroupContext<
  TData,
  TMembers extends Paths<TData>[],
  TFieldGroupAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly ExcludeAll<Paths<TData>, TMembers>[] = never[],
>(): FieldGroupContextType<
  TData,
  TMembers,
  TFieldGroupAdapter,
  TFormAdapter,
  TMixin
>;
```

::: warning
If used outside a `FieldGroupProvider` component, this hook will throw an error.
:::

An example of the usage:

```tsx
import {useFieldContext, useForm} from '@formsignals/form-react';

type FormValues = {
  name: string;
  email: string;
};

function MyComponent() {
  const field = useFieldGroupContext<FormValues, ['name', 'email']>();

  // ...
}

export default function App() {
  const form = useForm<FormValues>()

  return (
    <form.FormProvider>
      <form.FieldGroupProvider members={['name', 'email']}>
        <MyComponent/>
      </form.FieldGroupProvider>
    </form.FormProvider>
  )
}
```
