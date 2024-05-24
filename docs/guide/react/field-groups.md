# Field Groups

::: info
Please read through the [Core Field Groups](/guide/field-groups) guide before continuing.
It explains the basic concepts of field groups, this section will focus on showing how to use the React bindings.
:::

Field groups have similar React bindings as fields and forms.
It provides the possibility to create a field group through hooks and components.
These components are also bound to the form context for easy access and added type-safety.

## Using the `useFieldGroup` hook

Under the hood, the `useFieldGroup` hook is using the `form.getOrCreateFieldGroup` method from the core library,
therefore, the same options apply.

```tsx
import {useForm, useFieldGroup} from "@formsignals/form-react";

export default function MyForm() {
  const form = useForm<FormValues>();
  const fieldGroup = useFieldGroup(form, ["field1", "field2"], {
    validator: (value) => {
      if (value.field1 > value.field2) {
        return "Field 1 must be smaller than Field 2";
      }
    },
  });

  return (
    <form.FormProvider>
      <fieldGroup.FieldGroupProvider>
        {/* Your form fields here */}
        <ErrorText />
        <button type="button" onClick={fieldGroup.handleSubmit}>
          Check this Part
        </button>
      </fieldGroup.FieldGroupProvider>
    </form.FormProvider>
  )
}
```

::: info
Similar to the previously described ErrorText, this ErrorText reads the fieldGroupContext and displays the error message if there is one.
:::

## Using the `FieldGroupProvider` component

The `FieldGroupProvider` component can also be used to create a field group in a more declarative way.

```tsx
import {useForm} from "@formsignals/form-react";

export default function MyForm() {
  const form = useForm<FormValues>();

  return (
    <form.FormProvider>
      <form.FieldGroupProvider members={["field1", "field2"]}>
        {group => (<>
          {/* Your form fields here */}
          <ErrorText />
          <button type="button" onClick={group.handleSubmit}>
            Check this Part
          </button>
        </>)}
      </form.FieldGroupProvider>
    </form.FormProvider>
  )
}
```

## Context

Just like the fields and form, the field group also exposes a context through the `FieldGroupProvider` component.
This context can be consumed using the `useFieldGroupContext` hook.

```tsx
import {useForm, useFieldGroupContext} from "@formsignals/form-react";

export default function Child() {
  const form = useFieldGroupContext();

  // ...
}
```
