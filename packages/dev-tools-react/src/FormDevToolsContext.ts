import { createContext, useContext } from 'react'

type FormDevToolsContextType = {
  bgColor?: string
  bgSecondaryColor?: string
  textColor?: string
  accentColor?: string
  onAccentColor?: string
  errorColor?: string
  successColor?: string

  initialOpen?: boolean
  verticalKey?: 'top' | 'bottom'
  horizontalKey?: 'left' | 'right'
}

export const defaultContext = {
  bgColor: '#1c1917',
  bgSecondaryColor: '#44403c',
  textColor: '#fafaf9',
  accentColor: '#0369a1',
  onAccentColor: '#f0f9ff',
  errorColor: '#b91c1c',
  successColor: '#15803d',

  initialOpen: false,
  verticalKey: 'bottom',
  horizontalKey: 'right',
} satisfies FormDevToolsContextType

export const formDevToolsContext =
  createContext<FormDevToolsContextType | null>(defaultContext)

export const useFormDevToolsContext = () => {
  const context = useContext(formDevToolsContext)
  if (context === null) {
    throw new Error(
      'useFormDevToolsContext must be used within a FormDevToolsProvider',
    )
  }
  return context
}
