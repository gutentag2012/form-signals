import type { FormLogic, Paths } from '@signal-forms/form-core'
import React, { type PropsWithChildren, type ReactNode } from 'react'
import { type FieldProps, FieldWithForm } from '../field'
import { FormProvider } from './form.provider'
import { handleSubmitOnEnterForForm } from './form.utils'

export interface FormContextType<TData> extends FormLogic<TData> {
  FormProvider: (props: PropsWithChildren) => ReactNode
  FieldProvider: <TName extends Paths<TData>, TBoundData>(
    props: FieldProps<TData, TName, TBoundData>,
  ) => ReactNode
  handleSubmitOnEnter: ReturnType<typeof handleSubmitOnEnterForForm>
}

export function formLogicToFormContext<TData>(
  logic: FormLogic<TData>,
): FormContextType<TData> {
  const castedLogic = logic as FormContextType<TData>
  castedLogic.FormProvider = (props) => (
    <FormProvider form={castedLogic}>{props.children}</FormProvider>
  )
  castedLogic.FieldProvider = ({ children, ...props }) => (
    <FieldWithForm form={castedLogic} {...props}>
      {children}
    </FieldWithForm>
  )
  castedLogic.handleSubmitOnEnter = handleSubmitOnEnterForForm(castedLogic)
  return castedLogic
}

export const FormContext = React.createContext<
  FormContextType<never> | undefined
>(undefined)

export function useFormContext<TData>(): FormContextType<TData> {
  const form = React.useContext(FormContext)

  if (!form) {
    throw new Error('useFormContext must be used within a FormProvider')
  }

  return form as FormContextType<TData>
}
