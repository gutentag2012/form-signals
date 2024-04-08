import { UserForm } from '@/components/application/UserForm.tsx'
import { UserList } from '@/components/application/UserList.tsx'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx'
import { SelectedUser } from '@/signals.ts'
import { useComputed } from '@preact/signals-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'
import './index.css'

const queryClient = new QueryClient()

export const Index = () => {
  const userFormTitle = useComputed(() =>
    SelectedUser.value !== undefined ? 'Edit User' : 'Create User',
  )
  return (
    <main className="container mt-3 flex flex-col gap-2">
      <h1 className="mb-2 font-extrabold text-4xl tracking-tight">Users</h1>
      <Card>
        <CardHeader className="flex flex-row justify-between">
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <UserList />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row justify-between">
          <CardTitle>{userFormTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm />
        </CardContent>
      </Card>
    </main>
  )
}

// biome-ignore lint/style/noNonNullAssertion: <explanation>
const rootElement = document.getElementById('root')!

createRoot(rootElement).render(
  <QueryClientProvider client={queryClient}>
    <Index />
  </QueryClientProvider>,
)
