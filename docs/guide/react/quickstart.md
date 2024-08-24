# Quickstart

This is a quickstart guide to get you started with the Form Signals React bindings.
If you want to use a different UI library, check out the other quickstart guides.

- [Core](/guide/quickstart)

## Installation

To install the package, run:

:::tabs key:pgk
== npm

```bash
npm install @formsignals/form-react @preact/signals-react
```

== yarn

```bash
yarn add @formsignals/form-react @preact/signals-react
```

== pnpm

```bash
pnpm add @formsignals/form-react @preact/signals-react
```

:::

::: info
`@preact/signals-react` is a peer dependency of `@formsignals/form-react` and needs to be installed as well.
:::

::: warning
If you are using Babel or are running into issues with the installation of `@preact/signals-react`, you should check out
their installation guide [here](https://github.com/preactjs/signals/blob/main/packages/react/README.md).
:::

If you want to use a schema validation library you can also install the corresponding package.

<!--@include: ./quickstart-validation-libs.md-->

## Creating your first form

This code snippet demonstrates a simple registration form with `name`, `email`, and `password` fields. The example utilizes Zod for validation.

::: tip
Just like in this example it is advised to create your own input components, that accept signals as props.
:::

::: code-group

```tsx [login_form.tsx]
import SignalInput from './SignalInput'
import FieldErrors from './FieldErrors'
import {useForm} from '@formsignals/form-react';
import {ZodAdapter} from "@formsignals/validation-adapter-zod";
import {z} from "zod";

export default function App() {
  const form = useForm({
    validatorAdapter: ZodAdapter,
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    onSubmit: (values) => {
      console.log('Form submitted with values', values)
    },
  })

  return (
    <form.FormProvider>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          event.stopPropagation()
          form.handleSubmit()
        }}
      >
        <form.FieldProvider name="username" validator={z.string().min(3)}>
          {(field) => (
            <>
              <SignalInput
                type="text"
                placeholder="Username"
                name={field.name}
                value={field.data}
              />
              <FieldErrors/>
            </>
          )}
        </form.FieldProvider>
        <form.FieldProvider name="email" validator={z.string().email()}>
          {(field) => (
            <>
              <SignalInput
                type="email"
                placeholder="Email"
                name={field.name}
                value={field.data}
              />
              <FieldErrors/>
            </>
          )}
        </form.FieldProvider>
        <form.FieldProvider name="password" validator={z.string().min(8)}>
          {(field) => (
            <>
              <SignalInput
                type="password"
                placeholder="Password"
                name={field.name}
                value={field.data}
              />
              <FieldErrors/>
            </>
          )}
        </form.FieldProvider>
        <form.FieldProvider
          name="confirmPassword"
          validator={z
            .tuple([z.string(), z.string()])
            .refine(
              ([checkValue, originalValue]) => checkValue === originalValue,
              'Passwords do not match',
            )}
          validateMixin={['password'] as const}
        >
          {(field) => (
            <>
              <SignalInput
                type="password"
                placeholder="Confirm Password"
                name={field.name}
                value={field.data}
              />
              <FieldErrors/>
            </>
          )}
        </form.FieldProvider>
        <button type="submit">Submit</button>
      </form>
    </form.FormProvider>
  )
}
```

```tsx [FormInput.tsx]
import type {Signal} from '@preact/signals-react'
import type {InputHTMLAttributes} from 'react'

interface SignalInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: Signal<string>
}

export default function SignalInput({value, ...props}: SignalInputProps) {
  return (
    <input
      {...props}
      value={value.value}
      onInput={(event) => {
        value.value = event.currentTarget.value
      }}
    />
  )
}
```

```tsx [FieldErrors.tsx]
import {useFieldContext} from '@formsignals/form-react'

export default function FieldErrors() {
  const field = useFieldContext()
  return (
    <div>
      {field.errors.value.map((error, index) => (
        <div key={index}>{error}</div>
      ))}
    </div>
  )
}
```

:::

## Interactive Example

<iframe width="110%" style="margin-left: -5%;" height="500px" src="https://stackblitz.com/fork/github/gutentag2012/form-signals/tree/main/examples/react/simple-form-signals?startScript=example&title=Form%20Signals%20&#124;%20Simple%20Example&file=src%2FApp.tsx&embed=1&ctl=1&hidedevtools=1&terminalHeight=0&hideNavigation=1"></iframe>
