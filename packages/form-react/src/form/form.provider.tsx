import type { ValidatorAdapter } from '@formsignals/form-core'
// biome-ignore lint/correctness/noUnusedImports: This is the React import
import React from 'react'
import type { PropsWithChildren } from 'react'
import { FormContext, type FormContextType } from './form.context'

export interface FormProviderProps<
  TData,
  TAdapter extends ValidatorAdapter | undefined = undefined,
> extends PropsWithChildren {
  form: FormContextType<TData, TAdapter>
}

export function FormProvider<
  TData,
  TAdapter extends ValidatorAdapter | undefined = undefined,
>(props: FormProviderProps<TData, TAdapter>) {
  return (
    <FormContext.Provider value={props.form}>
      {props.children}
    </FormContext.Provider>
  )
}
