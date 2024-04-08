export interface User {
  id: number
  name: string
  email: string
  dob: Date
  // Emulates foreign keys to other users
  friends: number[]
  // Emulates foreign keys to other users
  blocked: number[]
}
