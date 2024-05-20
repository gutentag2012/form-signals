# Quickstart

This library supports react-native out of the box through the React bindings.
Please refer to the [React documentation](/guide/react/quickstart) for more detailed information.

An example of how to use this library in a react-native project is shown below:

```jsx
import {View} from 'react-native';
import {useForm} from '@formsignals/form-react';

export default function App() {
  const form = useForm({
    defaultValues: {
      username: '',
      password: '',
      passwordConfirm: '',
    }
  });

  return (
    <form.FormProvider>
      <form.FieldProvider name="username">
        <Text style={styles.label}>Username</Text>
        <FormInput/>
      </form.FieldProvider>

      <form.FieldProvider name="password">
        <Text style={styles.label}>Password</Text>
        <FormInput secureTextEntry/>
      </form.FieldProvider>

      <form.FieldProvider
        name="passwordConfirm"
        validateMixin={['password']}
        validator={([confirm, password]) =>
          password !== confirm ? 'Passwords do not match' : undefined
        }
      >
        <Text style={styles.label}>Confirm Password</Text>
        <FormInput secureTextEntry/>
      </form.FieldProvider>

      <Button title="Submit" onPress={form.handleSubmit}/>
    </form.FormProvider>
  );
}
```

::: info
This example assumes that you have a `FormInput` component that is a controlled input component.
An example of a controlled input component is shown below:

```tsx
import { useFieldContext } from '@formsignals/form-react'
import { Text, TextInput, type TextInputProps, View } from 'react-native'

export function FormInput(props: Omit<TextInputProps, 'value' | 'onChangeText'>) {
  const field = useFieldContext<string, ''>()

  return (
    <View>
      <TextInput
        value={field.data.value}
        onChangeText={field.handleChange}
        {...props}
      />
      <Text>{field.errors.value.join(', ')}</Text>
    </View>
  )
}
```

:::
