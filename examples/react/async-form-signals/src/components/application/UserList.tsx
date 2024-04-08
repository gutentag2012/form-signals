import { Button } from '@/components/ui/button.tsx'
import { getUsers } from '@/lib/Server.ts'
import { SelectedUser } from '@/signals.ts'
import { useQuery } from '@tanstack/react-query'
import { EditIcon, Loader2Icon } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'

export function UserList() {
  // For some reason, I have to destructure isFetching to _ to be able to get the newest data
  const {isLoading, data, isFetching: _} = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })

  return (
    <div className="flex flex-col gap-1">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="w-1/2">Email</TableHead>
            <TableHead>Date of Birth</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={4} className="text-center">
                <Loader2Icon className="mx-auto animate-spin" size={32} />
              </TableCell>
            </TableRow>
          )}
          {data && data.map((user) => (
              <TableRow key={user.id.toString()}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.dob.toLocaleDateString('en-US', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      SelectedUser.value =
                        SelectedUser.peek() === user.id ? undefined : user.id
                    }}
                  >
                    <EditIcon size={16} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  )
}
