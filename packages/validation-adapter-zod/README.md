<img src="https://github.com/gutentag2012/form-signals/raw/main/assets/repo-banner-light.svg" alt="Signal Form Banner" width="100%">

[![validation-adapter-zod-version](https://img.shields.io/npm/v/%40formsignals%2Fvalidation-adapter-zod?style=for-the-badge&logo=npm&label=validation-adapter-zod)](https://www.npmjs.com/package/@formsignals/validation-adapter-zod) <br/>
![validation-adapter-zod-bundle](https://img.shields.io/bundlephobia/minzip/%40formsignals%2Fvalidation-adapter-zod?style=for-the-badge&label=validation-adapter-zod-size) <br/>

The zod validation adapter for form management with Preact Signals.

## Features

- **TypeScript** - Written in TypeScript with full type support for optimal DX.
- **Reactivity** - Reactivity without abstractions thanks to Preact Signals.
- **Validation** - Built-in validation support, including adapters for validation schema libraries.
- **Transformations** - Transform values for the specific needs of your input fields.
- **Arrays + Dynamic Objects** - Utilize arrays and dynamic objects within your forms.

## Install

```bash
npm install @formsignals/validation-adapter-zod
```

If you have not installed zod yet, you will need to install it as well:

```bash
npm install zod
```

## Quickstart

A form or field needs to receive a validation adapter during configuration to be able to use zod schemas.

```ts
const form = new FormLogic({
  defaultValues: {
    name: '',
    email: '',
  },
  validationAdapter: ZodAdapter,
});
```

Then you can create a field instance and configure it with a zod schema:

```ts
const nameField = form.getOrCreateField('name', {
  validate: Zod.string().min(3),
});
```
