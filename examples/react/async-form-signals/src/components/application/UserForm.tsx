import { DatePicker } from '@/components/ui/DatePicker.tsx'
import { Button } from '@/components/ui/button.tsx'
import { InputSignal } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import {createUser, getAvailableUserFriends, getUserById, updateUser} from '@/lib/Server.ts'
import { SelectedUser } from '@/signals.ts'
import type { User } from '@/types.ts'
import {unSignalifyValueSubscribed, useField, useFieldContext, useForm} from '@formsignals/form-react'
import {useQuery, useQueryClient} from '@tanstack/react-query'
import { Loader2Icon } from 'lucide-react'
import {Checkbox} from "@/components/ui/checkbox.tsx";

// TODO add proper loading states (disabled fields)
// TODO Add support for proper field disabled states
// TODO Add support for partial default values on the form
// TODO Make API easier to use
// TODO Add tests for everything that was fixed

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
    defaultValues: user.data ?? {
      name: "",
      email: "",
      dob: undefined as unknown as Date,
      friends: [],
      blocked: [],
    },
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
          <form.FieldProvider name="name">
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
          <form.FieldProvider name="dob">
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

          <form.FieldProvider
            name="friends"
          >
            <FriendsList />
          </form.FieldProvider>

          <div className="flex flex-row gap-1">
            <Button type="submit" className="ml-auto">
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

function FriendsList() {
  const selectedUser = SelectedUser.value

  const availableFriends = useQuery({
    queryKey: ['users', selectedUser, 'availableFriends'],
    queryFn: () => getAvailableUserFriends(selectedUser as number),
    enabled: selectedUser !== undefined,
  })

  return <div>
    <Label>Friends</Label>
    {(availableFriends.isFetching) && <Loader2Icon className="h-6 w-6 animate-spin"/>}
    <ul>
      {availableFriends.data?.map((friend) => (
        <FriendListItem key={friend.id} friend={friend} />
      ))}
    </ul>
  </div>
}

function FriendListItem({friend}: {friend: User}) {
  const field = useFieldContext<User, "friends">()
  const friends = unSignalifyValueSubscribed(field.data)

  const blockedField = useField(field.form, "blocked", {
    preserveValueOnUnmount: true
  })
  const blockedUsers = unSignalifyValueSubscribed(blockedField.data)
  const isBlocked = blockedUsers?.includes(friend.id)

  const toggleBlock = () => {
    const indexOfBlock = blockedUsers?.indexOf(friend.id)
    if(indexOfBlock !== -1) {
      blockedField.removeValueFromArray(indexOfBlock)
    } else {
      blockedField.pushValueToArray(friend.id)
    }
  }

  const toggleFriend = (isFriend: boolean) => {
    if(isFriend) {
      field.pushValueToArray(friend.id)
    } else {
      field.removeValueFromArray(friends.indexOf(friend.id))
    }
  }

  return (
    <li className="flex flex-row gap-2 items-center">
      <Checkbox checked={friends.some(u => u === friend.id)} disabled={isBlocked} onCheckedChange={toggleFriend}/>
      {friend.name}
      <Button size="sm" variant="ghost" onClick={toggleBlock} type="button">
        {isBlocked ? "Unblock" : "Block"} User
      </Button>
    </li>
  )
}
