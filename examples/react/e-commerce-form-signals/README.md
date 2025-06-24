# Form Signals Example | E-Commerce Form Signals

This is an example application that demonstrates how to use the `form-signals` library to create a form outside a component and include it in different locations through a global import.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/fork/github/gutentag2012/form-signals/tree/main/examples/react/e-commerce-form-signals?startScript=example&title=Form%20Signals%20&#124;%20E-Commerce%20Example)

[![Open in Codeanywhere](https://codeanywhere.com/img/open-in-codeanywhere-btn.svg)](https://app.codeanywhere.com/#https://github.com/gutentag2012/form-signals)

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

- [`src/index.tsx`](src/index.tsx): The main component that structures the UI.
- [`src/lib/CardForm.ts`](src/lib/CartForm.ts): The form definition.
- [`src/components/application/CheckoutDialog.tsx`](src/components/application/CheckoutDialog.tsx): The checkout dialog that uses the form.
- [`src/components/application/ProductList.tsx`](src/components/application/ProductList.tsx): The product list that that adds products to the form.
