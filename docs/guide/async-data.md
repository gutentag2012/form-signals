# Async Data

It is possible to integrate async data with the primitives provided by the library.
There is no built-in functionality for async default values, but you can set the default values after the async data has been fetched through the `updateOptions` method.
Furthermore you can also disable the form until the async data has been fetched.

```jsx
import { FormLogic } from '@formsignals/form-core';

type FormValues {
  name: string;
  age: number;
}

const form = new FormLogic<FormValues>({
  disabled: true
});

fetchData().then((data) => {
  form.updateOptions({
    defaultValues: data,
    disabled: false
  });
});
```
