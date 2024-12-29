# Form Signals Example | Next Form Signals

This is an example application that demonstrates how to use the `form-signals` library within Next.js.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/fork/github/gutentag2012/form-signals/tree/main/examples/react/next-form-signals?startScript=example&title=Form%20Signals%20&#124;%20Next%2Ejs%20Example)

> [!NOTE]
> For now I did not find a way to use the `@preact/signals-react-transform` package to automatically track signals, that is why you will finde the manual use of the `useSignals()` hook.

## Quick Start

Install the dependencies:

```bash
pnpm install
```

Run the example:

```bash
pnpm example
```

## Relevant Files

- [`components/form/LoginForm.tsx`](./components/form/LoginForm.tsx): The main form components for the example.
