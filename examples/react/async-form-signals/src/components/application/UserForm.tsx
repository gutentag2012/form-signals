import { DatePicker } from '@/components/ui/DatePicker.tsx'
import { Button } from '@/components/ui/button.tsx'
import { InputSignal } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import {createUser, getUserById, updateUser} from '@/lib/Server.ts'
import { SelectedUser } from '@/signals.ts'
import type { User } from '@/types.ts'
import {useForm} from '@formsignals/form-react'
import {useQuery, useQueryClient} from '@tanstack/react-query'
import { Loader2Icon } from 'lucide-react'

// TODO Add support for proper field disabled states (when loading)
// TODO Add tests for everything that was fixed
// TODO Add a partial async state once partial data is enabled

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

  const form = useForm<Omit<User, 'id'>>({
    onSubmit: (values) => onSubmit(values).then(() => {
      SelectedUser.value = undefined
      form.reset()
      queryClient.invalidateQueries({
        queryKey: ['users'],
      })
    }),
  })

  return (
    <div className="flex flex-col gap-1">
      {(user.isFetching || form.isSubmitting.value) && <Loader2Icon className="h-6 w-6 animate-spin" />}
      <form.FormProvider>
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            return form.handleSubmit()
          }}
        >
          <form.FieldProvider name="name" defaultValue={user.data?.name ?? ""}>
            {(field) => (
              <div>
                <Label htmlFor={field.name}>Name</Label>
                <InputSignal
                  id={field.name}
                  value={field.data}
                  onBlur={field.handleBlur}
                  placeholder="Name"
                />
              </div>
            )}
          </form.FieldProvider>
          <form.FieldProvider
            name="email"
            defaultValue={user.data?.email ?? ""}
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
                />
              </div>
            )}
          </form.FieldProvider>
          {/* TODO Allow null as a valid default value */}
          <form.FieldProvider name="dob" defaultValue={user.data?.dob ?? null as unknown as Date}>
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
                />
              </div>
            )}
          </form.FieldProvider>

          <div className="flex flex-row gap-1">
            <Button type="submit" className="ml-auto" disabled={!form.canSubmit.value || !form.isDirty.value}>
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
