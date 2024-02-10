# Ideas

## API

- Validation is on a per-field basis
- Validation Strategies can be applied for when the validation should happen
  - On change
  - On blur
  - on touched (only on the first blur event)
  - On submit
  - On change and blur (and submit, but that is done by default)
  - Allow different validator per strategy (only pro usage)
- Default values can be given if they are static while async default values can be given as a function or just defined
  - Typesafety for default and async default values
  - Asnyc default values have a loading state
  - Async default values have their own error state if the async function fails
- The form can be reset to its initial state
- Errors can be specific to fields (validation + unknown error)
- Errors can be specific to the form (unknown error)
