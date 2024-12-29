import { LoginForm } from '@/components/form/LoginForm'

export default function Home() {
  return (
    <main className="mx-auto max-w-xl">
      <h1 className="mt-8 text-center font-bold text-3xl">Login</h1>
      <LoginForm />
    </main>
  )
}
