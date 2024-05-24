<img src="https://github.com/gutentag2012/form-signals/raw/main/assets/repo-banner-light.svg" alt="Signal Form Banner" width="100%">

[![form-core-version](https://img.shields.io/npm/v/%40formsignals%2Fform-core?style=for-the-badge&logo=npm&label=form-core)](https://www.npmjs.com/package/@formsignals/form-core)
![form-core-bundle](https://img.shields.io/bundlephobia/minzip/%40formsignals%2Fform-core?style=for-the-badge&label=form-core-size)

The core library for managing forms with Preact Signals.

## Features

- **TypeScript** - Written in TypeScript with full type support for optimal DX.
- **Reactivity** - Reactivity without abstractions thanks to Preact Signals.
- **Validation** - Built-in validation support, including adapters for validation schema libraries.
- **Transformations** - Transform values for the specific needs of your input fields.
- **Field Groups** - Group fields together to manage parts of a form independently.
- **Async Data** - Easily manage async initialisation, validation and submission.
- **Arrays + Dynamic Objects** - Utilize arrays and dynamic objects within your forms.

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
nameField.handleChange('John Smith');
```

You can also access the underlying signal directly:

```ts
const nameLength = computed(() => nameField.value.length);
```
