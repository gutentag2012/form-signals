# Roadmap

This document outlines the planned features and improvements for the project. It is a living document and will be updated as the project progresses.

## Version 1.0.0

- [x] **form-core**: Add FieldLogic to handle form fields state and validation
- [x] **form-core**: Add FormLogic to handle form state and validation
- [x] **form-react**: Add FormProvider to provide form state to form fields
- [x] **form-react**: Add useField hook to access form field state and validation
- [x] **form-react**: Add useForm hook to access form state and validation
- [ ] **form-validation-adapter-zod**: Add Validation adapter for zod
- [ ] **examples-react**: Add example for complex nested form
- [ ] **examples-react**: Add example for async form setup
- [ ] **examples-react**: Add example for async default values
- [ ] **examples-react**: Add example for partial default values
- [ ] **examples-react**: Add example for form validation
- [ ] **examples-react**: Add example with hidden fields
- [ ] **examples-react**: Add example for table sorting
- [ ] **examples-react**: Add example for shopping cart on e-commerce site (multipage) (with form outside of react components)
- [ ] **examples-react**: Add example with nested forms (and enter capture without html form element)
- [ ] **examples-react**: Add example how to use with shadcn/ui form components
- [ ] **chore**: Extensive jsdoc documentation with examples and links

## Version 1.1.0

- [ ] **form-core**: Add support for addons
- [ ] **form-core**: Add support for readonly derived fields
- [ ] **form-core**: Add support for either or fields
- [ ] **examples-react**: Add example for readonly derived fields + either or fields (NetPrice, GrossPrice, TaxRate -> Net or Gross is calculated depending on which is entered in the other two fields and disabled)
- [ ] **form-core**: Add support for form enter capture without html form element
- [ ] **form-core**: Add support for async default values
- [ ] **form-core**: Add support for async form setup
- [ ] **form-core**: Add type support for partial default values
- [ ] **form-core**: Add support for dependent fields
- [ ] **form-core**: Add support for form reset
- [ ] **form-core**: Add support for field value typed transformation
- [ ] **form-core**: Add support for validation after transformation onSubmit
- [ ] **form-core**: Add support for parsing server side errors after form submission
- [ ] **chore**: Add documentation website

## Version 1.2.0

- [ ] **debugger-react**: Add debugger component for react forms
- [ ] **form-core**: Add support for server side validation
- [ ] **addon-storage-persistence**: Add addon to persist form state in browser storage (session or local)

## Version 1.3.0

- [ ] **form-core**: Add support for bracket syntax for field names
- [ ] **form-core**: Add support for typed default values
