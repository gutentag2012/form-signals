import type { User } from '@/types.ts'

let idCounter = 0

const users: User[] = [
  {
    id: ++idCounter,
    name: 'Alice',
    email: 'alice@example.com',
    dob: new Date('1990-01-01'),
  },
  {
    id: ++idCounter,
    name: 'Sam',
    email: 'sam@example.com',
    dob: new Date('1992-04-07'),
  },
  {
    id: ++idCounter,
    name: 'Sally',
    email: 'sally@example.com',
    dob: new Date('1991-02-18'),
  },
]

function serverDelay() {
  const randomDelay = Math.random() * 1000 + 500
  return new Promise((resolve) => setTimeout(resolve, randomDelay))
}

export async function getUsers(): Promise<User[]> {
  await serverDelay()
  return users
}

export async function createUser(user: Omit<User, 'id'>) {
  const currentUsers = await getUsers()
  if (currentUsers.some((u) => u.email === user.email)) {
    throw new Error('Email already exists')
  }

  await serverDelay()
  const newUser = { ...user, id: ++idCounter }
  users.push(newUser)
}

export async function getUserById(id: number): Promise<User | null> {
  await serverDelay()
  return users.find((u) => u.id === id) ?? null
}

export async function updateUser(id: number, user: Omit<Partial<User>, 'id'>) {
  const currentUser = await getUserById(id)
  if (!currentUser) {
    throw new Error('User not found')
  }

  await serverDelay()
  Object.assign(currentUser, user)
}
