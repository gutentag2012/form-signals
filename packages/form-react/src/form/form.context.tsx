import type { FormLogic, Paths, ValidatorAdapter } from '@formsignals/form-core'
import React, { type PropsWithChildren, type ReactNode } from 'react'
import { type FieldProps, FieldWithForm } from '../field'
import { FormProvider } from './form.provider'
import { handleSubmitOnEnterForForm } from './form.utils'

/**
 * The context object that is used to provide the form logic to the form components.
 *
 * @template TData The type of the form data.
 * @template TAdapter The type of the validator adapter.
 *
 * @property FormProvider The provider component that provides the form logic to the form components.
 * @property FieldProvider The component that creates a field logic component bound to the form.
 * @property handleSubmitOnEnter The function that handles the submit-event when the enter key is pressed.
 */
export interface FormContextType<
  TData,
  TAdapter extends ValidatorAdapter | undefined = undefined,
> extends FormLogic<TData, TAdapter> {
  /**
   * The form logic component that is bound to the form.
   * @param props - The props of the form logic component.
   */
  FormProvider: (props: PropsWithChildren) => ReactNode
  /**
   * The field logic component that is bound to the form.
   * @param props - The props of the field logic component.
   */
  FieldProvider: <
    TName extends Paths<TData>,
    TBoundData,
    TFieldAdapter extends ValidatorAdapter | undefined = undefined,
    TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
  >(
    props: FieldProps<
      TData,
      TName,
      TBoundData,
      TFieldAdapter,
      TAdapter,
      TMixin
    >,
  ) => ReactNode
  /**
   * The function that handles the submit-event when the enter key is pressed.
   * This can be passed into the `onKeyDown` event of an element.
   */
  handleSubmitOnEnter: ReturnType<typeof handleSubmitOnEnterForForm>
}

/**
 * Converts a form logic object to a form context object.
 * @param logic - The form logic object.
 * @returns The form context object.
 */
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

  castedLogic.handleSubmit = castedLogic.handleSubmit.bind(castedLogic)
  castedLogic.handleBlur = castedLogic.handleBlur.bind(castedLogic)
  castedLogic.handleChange = castedLogic.handleChange.bind(castedLogic)

  return castedLogic
}

/**
 * The context object that is used to provide the form logic to the form components.
 */
export const FormContext = React.createContext<
  FormContextType<any, any> | undefined
>(undefined)

/**
 * The hook that returns the form context object.
 * @returns The form context object.
 */
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
