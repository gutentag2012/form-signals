# Async Data

Similar to the [core library](/guide/async-data) it is possible to integrate async data with the primitives provided by the library.
There is no built-in functionality for async default values, but you can set the default values passed to the `useForm` hook and disable the form until the async data has been fetched.

::: warning
If you changed the form, changing the default values will not cause the form values to change.
:::

```jsx
import { useForm } from '@formsignals/form-react';

const MyForm = () => {
  const { data, isFetching } = useAsyncData();

  const form = useForm({
    disabled: isFetching,
    defaultValues: data
  });

  return (
    <form.FormProvider>
      {/* Your form fields */}
    </form.FormProvider>
  );
};
```
