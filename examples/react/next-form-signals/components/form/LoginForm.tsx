'use client'
import { ErrorText } from '@/components/form/ErrorText'
import { Button } from '@/components/ui/button'
import { InputForm } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormDevTools } from '@formsignals/dev-tools-react'
import { useForm, useFormContext } from '@formsignals/form-react'
import { ZodAdapter } from '@formsignals/validation-adapter-zod'
import { useSignals } from '@preact/signals-react/runtime'
import { z } from 'zod'

export function LoginForm() {
  useSignals()

  const form = useForm({
    validatorAdapter: ZodAdapter,
    defaultValues: {
      username: '',
      password: '',
      passwordRepeat: '',
    },
    onSubmit: (values) => {
      if (
        !window.confirm(
          `Submitted login for ${values.username}. Do you want to reset the form?`,
        )
      )
        return
      form.reset()
    },
  })

  return (
    <form.FormProvider>
      <form
        className="flex flex-col gap-2"
        onSubmit={async (e) => {
          e.preventDefault()
          e.stopPropagation()
          await form.handleSubmit()
        }}
      >
        <form.FieldProvider
          name="username"
          validator={z.string().min(3)}
          validatorOptions={{ validateOnChangeIfTouched: true }}
        >
          <div>
            <Label htmlFor="username">Username</Label>
            <InputForm id="username" />
            <ErrorText />
          </div>
        </form.FieldProvider>
        <form.FieldProvider
          name="password"
          validator={z.string().min(8)}
          validatorOptions={{
            validateOnChangeIfTouched: true,
          }}
        >
          <div>
            <Label htmlFor="password">Password</Label>
            <InputForm id="password" type="password" />
            <ErrorText />
          </div>
        </form.FieldProvider>
        <form.FieldProvider
          name="passwordRepeat"
          validateMixin={['password']}
          validator={z
            .tuple([z.string(), z.string()])
            .refine(
              ([check, password]) => check === password,
              'Passwords did not match',
            )}
          validatorOptions={{
            validateOnChangeIfTouched: true,
          }}
        >
          <div>
            <Label htmlFor="password-repeat">Password (repeat)</Label>
            <InputForm id="password-repeat" type="password" />
            <ErrorText />
          </div>
        </form.FieldProvider>

        <FormSubmitButton />
      </form>
      <FormDevTools />
    </form.FormProvider>
  )
}

function FormSubmitButton() {
  const form = useFormContext()

  return (
    <Button className="mt-2" type="submit" disabled={!form.canSubmit.value}>
      Login
    </Button>
  )
}
