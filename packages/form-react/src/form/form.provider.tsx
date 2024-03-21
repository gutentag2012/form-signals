import type { FormLogicOptions } from '@signal-forms/form-core'
import type { PropsWithChildren } from 'react'
import { FormContext, type FormContextType } from './form.context'
import { useForm } from './form.hooks'

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

export interface FormProps<TData>
  extends PropsWithChildren,
    FormLogicOptions<TData> {}

export function Form<TData>({ children, ...props }: FormProps<TData>) {
  const form = useForm(props)
  return (
    <FormContext.Provider value={form as FormContextType<never>}>
      {children}
    </FormContext.Provider>
  )
}
