export interface FormValues {
  // Personal
  firstName: string
  lastName: string
  email: string
  phone?: string
  dateOfBirth: Date
  // Address
  street: string
  city: string
  state: string
  zip: string
  country: string
  // Account
  username: string
  password: string
  confirmPassword: string
  // Preferences
  newsletter?: boolean
  contact: 'email' | 'phone' | 'both'
  language: string
  terms?: boolean
}

export const MAX_STEPS = 5
