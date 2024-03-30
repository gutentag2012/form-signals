![Signal Form Banner](https://github.com/gutentag2012/form-signals/raw/main/assets/banner.svg)

[![form-react-version](https://img.shields.io/npm/v/%40formsignals%2Fform-react?style=for-the-badge&logo=npm&label=form-react)](https://www.npmjs.com/package/@formsignals/form-react)
![form-react-bundle](https://img.shields.io/bundlephobia/minzip/%40formsignals%2Fform-react?style=for-the-badge&label=form-react-size)

## Features

- **TypeScript** - Written in TypeScript with full type support.
- **Reactivity** - Reactivity without abstractions due to Preact Signals.
- **Validation** - Built-in validation support, including adapters for validation schema libraries.
- **React** - React bindings for easy integration with React.

## Install

```bash
npm install @formsignals/form-react
```

If you have not installed signals, you will need to install it as well:

```bash
npm install @preact/signals-react
```

If you are having trouble installing the Preact Signals, please consult their documentation.

## Quickstart

Create a new form instance:

```tsx
const form = useForm({
  defaultValues: {
    name: '',
    email: '',
  },
});
```

Then create a field component and configure it:

```tsx
<form.FieldProvider name="name" validate={(value) => {
  if (!value) {
    return 'Name is required';
  }
}}>
  {(field) => (
    <InputSignal signal={field.data} label="Name" />
  )}
</form.FieldProvider>
```

Note that the `InputSignal` component takes a `signal` prop, which is the signal from the field.
Internally, the component then subscribes to the changes.
Due to limitations of signals, it is not possible to directly subscribe to the signal within the child arrow function.

You can also access the field context from children of the `FieldProvider`:

```tsx
const field = useFieldContext();
```
