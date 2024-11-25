import { useForm } from '@formsignals/form-react'
import { ZodAdapter } from '@formsignals/validation-adapter-zod'
import { Button, StyleSheet, Text } from 'react-native'
import { z } from 'zod'
import { FormInput } from './FormInput'
import { IsUsernameTaken } from './server'

export function UserForm() {
  const form = useForm({
    defaultValues: {
      username: '',
      password: '',
      passwordConfirm: '',
    },
    validatorAdapter: ZodAdapter,
  })

  return (
    <form.FormProvider>
      <form.FieldProvider
        name="username"
        validator={z.string().min(1)}
        validatorAsync={async (username) => {
          if (await IsUsernameTaken(username)) {
            return 'Username is taken'
          }
        }}
        validatorAsyncOptions={{
          debounceMs: 500,
        }}
      >
        <Text style={styles.label}>Username</Text>
        <FormInput />
      </form.FieldProvider>

      <form.FieldProvider name="password" validator={z.string().min(8)}>
        <Text style={styles.label}>Password</Text>
        <FormInput secureTextEntry />
      </form.FieldProvider>

      <form.FieldProvider
        name="passwordConfirm"
        validateMixin={['password']}
        validator={([confirm, password]) =>
          password !== confirm ? 'Passwords do not match' : undefined
        }
        validatorOptions={{
          disableOnChangeValidation: true,
        }}
      >
        <Text style={styles.label}>Confirm Password</Text>
        <FormInput secureTextEntry />
      </form.FieldProvider>

      <Button title="Submit" onPress={() => form.handleSubmit()} disabled={!form.canSubmit.value} />
    </form.FormProvider>
  )
}

const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    marginBottom: 4,
  },
})
