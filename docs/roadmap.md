---
sidebar: false
---

# Roadmap

Do not take this roadmap as a commitment.
It is a living document that will be updated as we go.
We are open to feedback and suggestions.

Any points marked down here are added to arbitrary versions and might get moved around or discarded.

## Version 0.1.0

- :white_check_mark: <LibraryChip library="form-core" /> Add FieldLogic to handle form fields state and validation
- :white_check_mark: <LibraryChip library="form-core" /> Add FormLogic to handle form state and validation
- :white_check_mark: <LibraryChip library="form-core" /> Add support for form enter capture without html form element
- :white_check_mark: <LibraryChip library="form-core" /> Add support for field value typed transformation
- :white_check_mark: <LibraryChip library="form-core" /> Add support for `.moveItemToIndex(index: number, options)` method
- :white_check_mark: <LibraryChip library="form-core" /> Add support for `.pushItemToIndex(item: any, index: number, options)` method
- :white_check_mark: <LibraryChip library="form-core" /> Add support for dynamic object helpers
- :white_check_mark: <LibraryChip library="form-core" /> Add support for form reset
- :white_check_mark: <LibraryChip library="form-core" /> Add support for validation mixins
- :white_check_mark: <LibraryChip library="form-core" /> Add possibility to set errors from onSubmit response
- :white_check_mark: <LibraryChip library="validation-adapter-zod" /> Add Validation adapter for zod
- :white_check_mark: <LibraryChip library="form-react" /> Add FormProvider to provide form state to form fields
- :white_check_mark: <LibraryChip library="form-react" /> Add useField hook to access form field state and validation
- :white_check_mark: <LibraryChip library="form-react" /> Add useForm hook to access form state and validation
- :white_check_mark: <LibraryChip library="form-react" /> Add example for complex nested form
- :white_check_mark: <LibraryChip library="form-react" /> Add example for form validation
- :white_check_mark: <LibraryChip library="form-react" /> Add example how to use with shadcn/ui form components
- :white_check_mark: <LibraryChip library="chore" /> Extensive jsdoc documentation with examples and links
- :white_check_mark: <LibraryChip library="chore" /> Add documentation website

## Version 0.2.0

- :x: <LibraryChip library="form-core" /> Add support for async default values
- :x: <LibraryChip library="form-core" /> Add support for async form setup
- :x: <LibraryChip library="form-core" /> Add support for disabled fields
- :x: <LibraryChip library="form-core" /> Add core support for sub forms, that can handle parts of the outer form and can be submitted independently
- :x: <LibraryChip library="form-core" /> Add support for readonly derived fields
- :x: <LibraryChip library="form-core" /> Add support for either or fields
- :x: <LibraryChip library="form-core" /> Add support for dependent fields
- :x: <LibraryChip library="form-core" /> Add support for parsing server side errors after form submission
- :x: <LibraryChip library="form-react" /> Add example for readonly derived fields + either or fields (NetPrice, GrossPrice, TaxRate -> Net or Gross is calculated depending on which is entered in the other two fields and disabled)
- :x: <LibraryChip library="form-react" /> Add example for StepWizard
- :x: <LibraryChip library="form-react" /> Add example for async default values
- :x: <LibraryChip library="form-react" /> Add example for async form setup
- :x: <LibraryChip library="form-react" /> Add example for table sorting
- :x: <LibraryChip library="form-react" /> Add example for shopping cart on e-commerce site (multipage) (with form outside of react components)
- :x: <LibraryChip library="form-react" /> Allow usage of form outside of react components + example
- :x: <LibraryChip library="form-react-native" /> Add example for react-native

## Version 0.3.0

- :x: <LibraryChip library="form-core" /> Add type support for partial default values
- :x: <LibraryChip library="debugger-react" /> Add debugger component for react forms
- :x: <LibraryChip library="form-core" /> Add support for server side validation
- :x: <LibraryChip library="form-core" /> Add support for addons
- :x: <LibraryChip library="addon-storage-persistence" /> Add addon to persist form state in browser storage (session or local)

## Version 0.4.0

- :x: <LibraryChip library="form-react" /> Measure performance and optimize with `React.memo` and `useMemo`
- :x: <LibraryChip library="form-core" /> Add support for bracket syntax for field names
- :x: <LibraryChip library="form-core" /> Add support for typed default values

## Version 1.0.0

- :x: <LibraryChip library="form-core" /> Reach stable API
- :x: <LibraryChip library="form-react" /> Reach stable API
- :x: <LibraryChip library="form-react-native" /> Reach stable API
- :x: <LibraryChip library="validation-adapter-zod" /> Reach stable API
- :x: <LibraryChip library="addon-storage-persistence" /> Reach stable API
- :x: <LibraryChip library="debugger-react" /> Reach stable API
