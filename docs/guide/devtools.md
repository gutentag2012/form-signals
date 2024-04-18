# Devtools

This library offers a separate package for debugging your form state. Currently, this package is only available for React since there is also only a React binding for this library.

## Installation

To install the devtools, run:

:::tabs key:pgk
== npm

```bash
npm install @formsignals/dev-tools-react
```

== yarn

```bash
yarn add @formsignals/dev-tools-react
```

== pnpm

```bash
pnpm add @formsignals/dev-tools-react
```

:::

::: info
`@formsignals/form-react` is a peer dependency of `@formsignals/dev-tools-react` and needs to be installed and set up as well.
:::

## Usage

To use the devtools, you simply add the `FormDevTools` component to your app within the `FormProvider` you want to debug.

```tsx
import {useForm} from '@formsignals/form-react';
import {FormDevTools} from '@formsignals/dev-tools-react';

const App = () => {
  const form = useForm({
    // Your form configuration
  });

  return (
    <FormProvider form={form}>
      <FormDevTools />
      {/* Your form UI */}
    </FormProvider>
  );
};
```

## Preview

The devtools offers a simple interface to inspect your form state. You can see the current form values, errors, mounted fields and much more.
It is further possible to reset the form and each of its fields respectively.

![Dev Tools Screenshot](..%2Fpublic%2Fdev-tool-screenshot.webp)
