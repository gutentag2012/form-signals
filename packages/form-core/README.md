![Signal Form Banner](https://github.com/gutentag2012/form-signals/raw/main/assets/banner.svg)

[![form-core-version](https://img.shields.io/npm/v/%40formsignals%2Fform-core?style=for-the-badge&logo=npm&label=form-core)](https://www.npmjs.com/package/@formsignals/form-core)
![form-core-bundle](https://img.shields.io/bundlephobia/minzip/%40formsignals%2Fform-core?style=for-the-badge&label=form-core-size)

## Features

- **TypeScript** - Written in TypeScript with full type support.
- **Reactivity** - Reactivity without abstractions due to Preact Signals.
- **Validation** - Built-in validation support, including adapters for validation schema libraries.

## Install

```bash
npm install @formsignals/form-core
```

If you have not installed signals, you will need to install it as well:

```bash
npm install @preact/signals-core
```

## Quickstart

Create a new form instance:

```ts
const form = new FormLogic({
  defaultValues: {
    name: '',
    email: '',
  },
});
```

Then get a field instance from the form and configure it:

```ts
const nameField = form.getOrCreateField('name', {
  validate: (value) => {
    if (!value) {
      return 'Name is required';
    }
  },
});
```

Now you can interact with the field:

```ts
nameField.handleChange('John Doe');
```

You can also access the underlying signal directly:

```ts
const nameLength = computed(() => nameField.value.length);
```
