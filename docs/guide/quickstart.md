# Quickstart

This is a quickstart guide to get you started with the Form Signals core library.
If you want to use a UI library, check out the other quickstart guides.

- [React](/guide/react/quickstart)

## Installation

To install the package, run:

:::tabs key:pgk
== npm
```bash
npm install @formsignals/form-core @preact/signals-core
```
== yarn
```bash
yarn add @formsignals/form-core @preact/signals-core
```
== pnpm
```bash
pnpm add @formsignals/form-core @preact/signals-core
```
:::

::: info
`@preact/signals-core` is a peer dependency of `@formsignals/form-core` and needs to be installed as well.
:::

If you want to use a schema validation library you can also install the corresponding package.

<!--@include: ./quickstart-validation-libs.md-->

## Creating your first form

This is how you would create a simple registration form with a name and email field would look like.
This example also includes validation using the Zod library.

In a real world project, you would then probably connect the state of the form to a UI, this is not covered in this example.
Check out the [React quickstart guide](/guide/react/quickstart#creating-your-first-form) for an example with the React bindings.

::: code-group
```ts [login_form.ts]
import { FormLogic } from '@formsignals/form-core';
import { ZodAdapter } from "@formsignals/validation-adapter-zod";
import { z } from "zod";

// Setup the form
const form = new FormLogic({
  validatorAdapter: ZodAdapter,
  defaultValues: {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  },
  onSubmit: (values) => {
    console.log('Form submitted with values', values)
  }
})
// Mount the form
form.mount()

// Create the fields
const usernameField = form.getOrCreateField('username', {
  validator: z.string().min(3),
})
const emailField = form.getOrCreateField('email', {
  validator: z.string().email(),
})
const passwordField = form.getOrCreateField('password', {
  validator: z.string().min(8, 'Invalid email address'),
})
const confirmPasswordField = form.getOrCreateField('confirmPassword', {
  validator: z
    .tuple([z.string(), z.string()])
    .refine(
      ([checkValue, originalValue]) => checkValue === originalValue,
      'Passwords do not match',
    ),
  validateMixin: ['password'] as const,
})
// Mount the fields
usernameField.mount()
emailField.mount()
passwordField.mount()
confirmPasswordField.mount()

// Update the data
usernameField.handleChange('john_doe')
emailField.handleChange('not.a.valid.email')
passwordField.handleChange('password')
confirmPasswordField.handleChange('password2')

// Submit the form
form.handleSubmit() // Nothing happens

// Read the errors
console.log(emailField.errors.value) // ["Invalid email"]
console.log(confirmPasswordField.errors.value) // ["Passwords do not match"]

// Fix errors directly through signals
emailField.data.value = "real@email.com"
confirmPasswordField.data.value = "password"

// Submit the form
form.handleSubmit() // Form submitted with values { username: 'john_doe', email: 'real@email.com', password: 'password', confirmPassword: 'password' }
```
:::

[//]: # (TODO Add Stackblitz example)
