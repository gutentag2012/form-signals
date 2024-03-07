import type { FormLogic } from '@signal-forms/form-core'
import { createContext, useContext } from 'react'

export const FormContext = createContext<FormLogic<unknown> | undefined>(
  undefined,
)

export const useFormContext = <TData>(): FormLogic<TData> => {
  const form = useContext(FormContext)

  if (!form) {
    throw new Error('useFormContext must be used within a FormProvider')
  }

  return form as FormLogic<TData>
}
