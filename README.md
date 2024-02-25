# SignalForms

## Philosophy

### What is a form?

A form is encapsulating a state of values and orchestrates the change of this state.
To do so, it can use a set of fields, which are responsible for the validation and transformation of the values.
A form can be seen as a state machine,
which is transitioning between different states, depending on the input of the user.

Without fields, a form can only view its values as a whole.

### What is a field?

A field is always a part of a form and responsible for keeping additional state for the single value stored in the form.
It can validate and transform the value, and it can be used to render the value in a specific way.
It does not own the value, rather only a reference to it.
Any errors or validation is not specific to a form value, but rather to a specific field.
