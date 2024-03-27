import type {
  FormLogic,
  Paths,
  ValidatorAdapter,
} from '@signal-forms/form-core'
import React, { type PropsWithChildren, type ReactNode } from 'react'
import { type FieldProps, FieldWithForm } from '../field'
import { FormProvider } from './form.provider'
import { handleSubmitOnEnterForForm } from './form.utils'

export interface FormContextType<
  TData,
  TAdapter extends ValidatorAdapter | undefined = undefined,
> extends FormLogic<TData, TAdapter> {
  FormProvider: (props: PropsWithChildren) => ReactNode
  FieldProvider: <
    TName extends Paths<TData>,
    TBoundData,
    TFieldAdapter extends ValidatorAdapter | undefined = undefined,
  >(
    props: FieldProps<TData, TName, TBoundData, TFieldAdapter, TAdapter>,
  ) => ReactNode
  handleSubmitOnEnter: ReturnType<typeof handleSubmitOnEnterForForm>
}

export function formLogicToFormContext<
  TData,
  TAdapter extends ValidatorAdapter | undefined = undefined,
>(logic: FormLogic<TData, TAdapter>): FormContextType<TData, TAdapter> {
  const castedLogic = logic as FormContextType<TData, TAdapter>
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
  FormContextType<any, any> | undefined
>(undefined)

export function useFormContext<
  TData,
  TAdapter extends ValidatorAdapter | undefined = undefined,
>(): FormContextType<TData, TAdapter> {
  const form = React.useContext(FormContext)

  if (!form) {
    throw new Error('useFormContext must be used within a FormProvider')
  }

  return form as FormContextType<TData, TAdapter>
}
