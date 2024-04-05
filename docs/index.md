---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Form Signals"
  text: "Reactive form state management"
  tagline: Zero abstraction with full reactivity
  image:
    src: /home-page-icon.webp
    alt: Form Signals
  actions:
    - theme: brand
      text: What are Signals?
      link: /guide/what-are-signals
    - theme: alt
      text: Quickstart
      link: /guide/quickstart
    - theme: alt
      text: View on Github
      link: https://github.com/gutentag2012/form-signals
      rel: external

features:
  - title: Flexible Validation
    details: Use powerful validation through validation mixins, nested validation and schema adapters.
    link: /guide/validation
    icon:
      light: /shield-check.svg
      dark: /shield-check-dark.svg
      alt: Validation
  - title: Fine-grained Reactivity
    details: Only re-render what is necessary with the help of Preact Signals.
    link: /guide/what-are-signals
    icon:
      light: /refresh-cw.svg
      dark: /refresh-cw-dark.svg
      alt: Reactivity
  - title: Transformations
    details: Transform your form data for different input types and back again.
    link: /guide/basic-usage#add-transformation
    icon:
      light: /arrow-left-right.svg
      dark: /arrow-left-right-dark.svg
      alt: Transformations
  - title: Arrays + Dynamic Objects
    details: Make use of arrays and dynamic objects within your forms.
    link: /guide/array-fields
    icon:
      light: /brackets.svg
      dark: /brackets-dark.svg
      alt: Arrays + Objects
  - title: Type-safety
    details: Utilize the best of TypeScript for optimal developer experience.
    icon:
      src: /ts-logo-128.svg
      alt: TypeScript
  - title: Headless
    details: Use the core library without any framework-specific bindings.
    icon:
      light: /replace-all.svg
      dark: /replace-all-dark.svg
      alt: Headless
---
