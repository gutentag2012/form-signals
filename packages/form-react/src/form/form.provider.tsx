import type { ValidatorAdapter } from '@formsignals/form-core'
// biome-ignore lint/style/useImportType: This is the React import
import React from 'react'
import type { PropsWithChildren } from 'react'
import { FormContext, type FormContextType } from './form.context'

/**
 * The props for the form provider.
 *
 * @template TData - The data type of the form.
 * @template TAdapter - The type of the validator adapter.
 *
 * @param form - The form context object.
 */
export interface FormProviderProps<
  TData,
  TAdapter extends ValidatorAdapter | undefined = undefined,
> extends PropsWithChildren {
  /**
   * The form context object.
   */
  form: FormContextType<TData, TAdapter>
}

/**
 * Provides the form context to the children.
 *
 * @param props - The props to pass to the form provider.
 */
export function FormProvider<
  TData,
  TAdapter extends ValidatorAdapter | undefined = undefined,
>(props: FormProviderProps<TData, TAdapter>): React.JSX.Element {
  return (
    <FormContext.Provider value={props.form}>
      {props.children}
    </FormContext.Provider>
  )
}
