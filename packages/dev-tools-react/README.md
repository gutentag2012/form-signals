<img src="https://github.com/gutentag2012/form-signals/raw/main/assets/repo-banner-light.svg" alt="Signal Form Banner" width="100%">

[![form-react-version](https://img.shields.io/npm/v/%40formsignals%2Fdev-tools-react?style=for-the-badge&logo=npm&label=dev-tools-react)](https://www.npmjs.com/package/@formsignals/dev-tools-react)
![form-react-bundle](https://img.shields.io/bundlephobia/minzip/%40formsignals%2Fdev-tools-react?style=for-the-badge&label=dev-tools-react-size)

A React component containing the dev tools for the React binding of Form Signals.

## Features

- **TypeScript** - Written in TypeScript with full type support for optimal DX.
- **Reactivity** - Reactivity without abstractions thanks to Preact Signals.
- **Validation** - Built-in validation support, including adapters for validation schema libraries.
- **Transformations** - Transform values for the specific needs of your input fields.
- **Arrays + Dynamic Objects** - Utilize arrays and dynamic objects within your forms.
- **React** - React bindings for easy integration with React.

## Install

```bash
npm install @formsignals/dev-tools-react
```

If you have not installed the React bindings of the form library, check out [@formsignals/form-react](https://github.com/gutentag2012/form-signals/blob/main/packages/form-react/README.md#install) installation.

## Quickstart

Just add the `FormDevTools` component to your React app within the `FormProvider` you want to debug.

```tsx
import { useForm } from '@formsignals/form-react';
import { FormDevTools } from '@formsignals/dev-tools-react';

export default function App() {
  const form = useForm()

  return (
    <form.FormProvider>
      <FormDevTools />
      {/* Your app here */}
    </form.FormProvider>
  );
}
```
