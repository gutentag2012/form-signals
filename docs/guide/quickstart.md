---
next:
  text: Concepts
  link: /guide/concepts
---

# Quickstart

This is a quickstart guide to get you started with the Form Signals core library.
If you want to use a UI library, check out the other quickstart guides.

- [React](/guide/quickstart-react)

## Installation

To install the package, run:

:::tabs key:pgk
== npm
```bash
npm install @form-signals/core @preact/signals-core
```
== yarn
```bash
yarn add @form-signals/core @preact/signals-core
```
== pnpm
```bash
pnpm add @form-signals/core @preact/signals-core
```
:::

::: info
`@preact/signals-core` is a peer dependency of `@form-signals/core` and needs to be installed as well.
:::

If you want to use a schema validation library you can also install the corresponding package.

## [Zod](https://zod.dev/)

:::tabs key:pgk
== npm
```bash
npm install @form-signals/validation-adapter-zod
```
== yarn
```bash
yarn add @form-signals/validation-adapter-zod
```
== pnpm
```bash
pnpm add @form-signals/validation-adapter-zod
```
:::
