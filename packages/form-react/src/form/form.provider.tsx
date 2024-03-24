// biome-ignore lint/correctness/noUnusedImports: This is the React import
import React from 'react'
import type { PropsWithChildren } from 'react'
import { FormContext, type FormContextType } from './form.context'

export interface FormProviderProps<TData> extends PropsWithChildren {
  form: FormContextType<TData>
}

export function FormProvider<TData>(props: FormProviderProps<TData>) {
  return (
    <FormContext.Provider value={props.form as FormContextType<never>}>
      {props.children}
    </FormContext.Provider>
  )
}
