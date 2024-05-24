# FieldGroupProvider API Reference

The following references are used to propagate the `FieldGroupLogic` instance in the React context.

## FieldGroupChildren

The children that can be passed to a field group component can either be a function that accepts the field group, or a React element
that consumes the field group via context.

```ts
type FieldGroupChildren<
  TData,
  TMembers extends Paths<TData>[],
  TFieldGroupAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TFieldGroupMixin extends readonly ExcludeAll<
    Paths<TData>,
    TMembers
  >[] = never[],
> =
  | ((
  group: FieldGroupContextType<
    TData,
    TMembers,
    TFieldGroupAdapter,
    TFormAdapter,
    TFieldGroupMixin
  >,
) => React.ReactNode)
  | React.ReactNode
```

## FieldGroupProvider

This component creates the React context and provides a given `FieldGroupLogic` instance to its children.

```ts
declare function FieldGroupProvider<
  TData,
  TMembers extends Paths<TData>[],
  TFieldGroupAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TFieldGroupMixin extends readonly ExcludeAll<
    Paths<TData>,
    TMembers
  >[] = never[],
>(
  props: FieldGroupProviderProps<
    TData,
    TMembers,
    TFieldGroupAdapter,
    TFormAdapter,
    TFieldGroupMixin
  >,
): React.ReactElement
```

An example of the usage:

```tsx
import {FieldGroupProvider, useFieldGroup} from '@formsignals/form-react';

export default function App() {
  const group = useFieldGroup('name');
  return (
    <FieldGroupProvider fieldGroup={group}>
      {/* ... */}
    </FieldGroupProvider>
  );
}
```

## FieldGroupWithForm

This component creates a new field group within a given form.

```ts
declare function FieldGroupWithForm<
  TData,
  TMembers extends Paths<TData>[],
  TFieldGroupAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TFieldGroupMixin extends readonly ExcludeAll<
    Paths<TData>,
    TMembers
  >[] = never[],
>({
    form,
    members,
    children,
    ...props
  }: FieldGroupWithFormProps<
  TData,
  TMembers,
  TFieldGroupAdapter,
  TFormAdapter,
  TFieldGroupMixin
>): React.ReactElement
```

An example of the usage:

```tsx
import {FieldGroupWithForm, useForm} from '@formsignals/form-react';

export default function App() {
  const form = useForm();
  return (
    <FieldGroupWithForm form={form} members={["name"]}>
      {/* ... */}
    </FieldGroupWithForm>
  );
}
```

## FieldGroup

This component creates a new field group within the current form context.

```ts
declare function FieldGroup<
  TData,
  TMembers extends Paths<TData>[],
  TFieldGroupAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TFieldGroupMixin extends readonly ExcludeAll<
    Paths<TData>,
    TMembers
  >[] = never[],
>({
    members,
    children,
    ...props
  }: FieldGroupProps<
  TData,
  TMembers,
  TFieldGroupAdapter,
  TFormAdapter,
  TFieldGroupMixin
>): React.ReactElement
```

An example of the usage:

```tsx
import {FieldGroup, useForm} from '@formsignals/form-react';

export default function App() {
  const form = useForm();
  return (
    <FieldGroup members={["name"]}>
      {/* ... */}
    </FieldGroup>
  );
}
```
