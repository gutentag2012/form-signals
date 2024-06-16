import { ErrorText } from '@/components/form/ErrorText.tsx'
import { ErrorTextForm } from '@/components/form/ErrorTextForm.tsx'
import { DatePicker } from '@/components/ui/DatePicker.tsx'
import { Button } from '@/components/ui/button.tsx'
import { InputSignal } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import {
  createUser,
  getUserById,
  isEmailTaken,
  updateUser,
} from '@/lib/Server.ts'
import { SelectedUser } from '@/signals.ts'
import type { User } from '@/types.ts'
import { FormDevTools } from '@formsignals/dev-tools-react'
import { useForm } from '@formsignals/form-react'
import { ZodAdapter } from '@formsignals/validation-adapter-zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2Icon } from 'lucide-react'
import { z } from 'zod'

export function UserForm() {
  const selectedUser = SelectedUser.value
  const queryClient = useQueryClient()

  const user = useQuery({
    queryKey: ['users', selectedUser],
    queryFn: () => getUserById(selectedUser as number),
    enabled: selectedUser !== undefined,
  })

  const onSubmit = (values: Omit<User, 'id'>) => {
    if (selectedUser) {
      return updateUser(selectedUser, values)
    }
    return createUser(values)
  }

  const form = useForm<Omit<User, 'id'>, typeof ZodAdapter>({
    disabled: user.isFetching,
    validatorAdapter: ZodAdapter,
    defaultValues: {
      name: user?.data?.name ?? '',
      email: user?.data?.email ?? '',
      dob: user?.data?.dob ?? (null as unknown as Date),
    },
    onSubmit: (values, addErrors) =>
      onSubmit(values).then((error) => {
        if (error) {
          addErrors({
            [error.path]: error.message,
          })
          return
        }

        SelectedUser.value = undefined
        form.reset()
        queryClient.invalidateQueries({
          queryKey: ['users'],
        })
      }),
  })

  return (
    <div className="flex flex-col gap-1">
      {(user.isFetching || form.isSubmitting.value) && (
        <Loader2Icon className="h-6 w-6 animate-spin" />
      )}
      <form.FormProvider>
        <FormDevTools position="bottom-left" />
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            return form.handleSubmit()
          }}
        >
          <form.FieldProvider name="name" validator={z.string().min(1)}>
            {(field) => (
              <div>
                <Label htmlFor={field.name}>Name</Label>
                <InputSignal
                  id={field.name}
                  value={field.data}
                  onBlur={field.handleBlur}
                  placeholder="Name"
                  disabled={field.disabled}
                />
                <ErrorText />
              </div>
            )}
          </form.FieldProvider>
          <form.FieldProvider
            name="email"
            validator={z.string().email()}
            validatorAsync={async (value) => {
              if(value === user?.data?.email) return undefined
              const isTaken = await isEmailTaken(value)
              return isTaken ? 'Email is already taken' : undefined
            }}
            validatorAsyncOptions={{
              validateOnChangeIfTouched: true,
              debounceMs: 700,
            }}
          >
            {(field) => (
              <div>
                <Label htmlFor={field.name}>Email</Label>
                <InputSignal
                  id={field.name}
                  value={field.data}
                  onBlur={field.handleBlur}
                  placeholder="Email"
                  type="email"
                  disabled={field.disabled}
                />
                <ErrorText />
              </div>
            )}
          </form.FieldProvider>
          <form.FieldProvider name="dob" validator={z.date().max(new Date())}>
            {(field) => (
              <div>
                <Label htmlFor={field.name}>Date of Birth</Label>
                <br />
                <DatePicker
                  id={field.name}
                  value={field.data}
                  onBlur={field.handleBlur}
                  variant="outline"
                  className="w-full"
                  disabled={field.disabled}
                />
                <ErrorText />
              </div>
            )}
          </form.FieldProvider>

          <ErrorTextForm />

          <div className="flex flex-row gap-1">
            <Button
              type="submit"
              className="ml-auto"
              disabled={!form.canSubmit.value || !form.isDirty.value}
            >
              Submit
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                SelectedUser.value = undefined
                form.reset()
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </form.FormProvider>
    </div>
  )
}
