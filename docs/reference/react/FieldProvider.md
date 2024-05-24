# FieldProvider API Reference

The following references are used to propagate the `FieldLogic` instance in the React context.

## FieldChildren

The children that can be passed to a field component can either be a function that accepts the field, or a React element
that consumes the field via context.

```ts
type FieldChildren<
  TData,
  TName extends Paths<TData>,
  TBoundData = never,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
> =
  | ((
  field: FieldLogic<
    TData,
    TName,
    TBoundData,
    TAdapter,
    TFormAdapter,
    TMixin
  >,
) => React.ReactNode)
  | React.ReactNode
```

## FieldProvider

This component creates the React context and provides a given `FieldLogic` instance to its children.

```ts
declare function FieldProvider<
  TData,
  TName extends Paths<TData>,
  TBoundData = never,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
>(
  props: FieldProviderProps<
    TData,
    TName,
    TBoundData,
    TAdapter,
    TFormAdapter,
    TMixin
  >,
): React.ReactElement
```

An example of the usage:

```tsx
import {FieldProvider, useField} from '@formsignals/form-react';

export default function App() {
  const field = useField('name');
  return (
    <FieldProvider field={field}>
      {/* ... */}
    </FieldProvider>
  );
}
```

## FieldWithForm

This component creates a new field within a given form.

```ts
declare function FieldWithForm<
  TData,
  TName extends Paths<TData>,
  TBoundData = never,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
>(props: FieldWithFormProps<
  TData,
  TName,
  TBoundData,
  TAdapter,
  TFormAdapter,
  TMixin
>): React.ReactElement
```

An example of the usage:

```tsx
import {FieldWithForm, useForm} from '@formsignals/form-react';

export default function App() {
  const form = useForm();
  return (
    <FieldWithForm form={form} name="name">
      {/* ... */}
    </FieldWithForm>
  );
}
```

## Field

This component creates a new field within the current form context.

```ts
declare function Field<
  TData,
  TName extends Paths<TData>,
  TBoundData = never,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
>({
    name,
    children,
    ...props
  }: FieldProps<
  TData,
  TName,
  TBoundData,
  TAdapter,
  TFormAdapter,
  TMixin
>): React.ReactElement
```

An example of the usage:

```tsx
import {Field, useForm} from '@formsignals/form-react';

export default function App() {
  const form = useForm();
  return (
    <Field name="name">
      {/* ... */}
    </Field>
  );
}
```

## SubField

This component creates a new field that is connected to the same form as the parent field and starts with the name of the parent field.

```ts
declare function SubField<
  TParentData,
  TParentName extends Paths<TParentData>,
  TParentBoundData,
  TData extends ValueAtPath<TParentData, TParentName>,
  TName extends Paths<TData>,
  TBoundData = never,
  TParentAdapter extends ValidatorAdapter | undefined = undefined,
  TParentFormAdapter extends ValidatorAdapter | undefined = undefined,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TParentMixin extends readonly Exclude<
    Paths<TParentData>,
    TParentName
  >[] = never[],
  TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
>({
    parentField,
    name,
    children,
    ...props
  }: SubFieldProps<
  TParentData,
  TParentName,
  TParentBoundData,
  TData,
  TName,
  TBoundData,
  TParentAdapter,
  TParentFormAdapter,
  TAdapter,
  TFormAdapter,
  TParentMixin,
  TMixin
>): React.ReactElement
```

An example of the usage:

```tsx
import {SubField, useField} from '@formsignals/form-react';

export default function App() {
  const parentField = useField('name');
  return (
    <SubField parentField={parentField} name="subName">
      {/* ... */}
    </SubField>
  );
}
```
