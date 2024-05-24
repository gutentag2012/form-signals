# Field Groups

In some scenarios, it might be required to look at multiple fields at once independent of the rest of the form.
In those cases, field groups can make it easier to manage the data.
Some of those scenarios might be a date range picker or a multistep form.

## What can it do?

A field group is a mix of concepts from the form and the field.
Similar to a field, it does not own any data, but references the data of multiple paths within the form.
It is, however, fully read-only and does not provide any handlers to change the data.

A field group also has a submission logic built in to make it possible to submit parts of a form.
This is useful for multistep forms or forms with multiple sections.
Additionally, a field group has all the validation logic of a field, including [validation mixins](/guide/validation#validation-mixins).

## Usage

To create a new field group, use the `getOrCreateFieldGroup` function on the form.
You pass in the paths to all the fields that should be included in the field group as well as the usual options for validation.

:::tip
Not all fields in a field group have to be registered as fields on the form.
:::

```ts
const fieldGroup = form.getOrCreateFieldGroup(["field1", "field1"], {
  validator: (value) => {
    if (value.field1 > value.field2) {
      return "Field 1 must be smaller than Field 2";
    }
  },
})
```

The data of the field group can be accessed via the `data` property.
This property is similar to the `json` property of the form in that it is read-only and not a deep signal.

```ts
const data = fieldGroup.data.value;
```

:::warning
Due to technical limitations, there is no fine-grained reactivity for the field group data.
Whenever **ANY** of the data within the form changes, all field group data will be updated no matter if it was changed or not.
:::

## Submission

If needed a group can also have an `onSubmit` handler.

```ts
const fieldGroup = form.getOrCreateFieldGroup(["field1", "field1"], {
  onSubmit: (data) => {
    console.log(data);
  },
})
fieldGroup.handleSubmit()
```

All rules as described in the [Basic Usage](/guide/basic-usage#add-validation) guide apply to the field group as well.

:::info
Since the field group is read-only, it cannot be blurred or touched.
:::
