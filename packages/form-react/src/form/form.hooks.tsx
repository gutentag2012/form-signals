import {
  FormLogic,
  type FormLogicOptions,
  type ValidatorAdapter,
} from '@formsignals/form-core'
import React from 'react'
import { useIsomorphicLayoutEffect } from '../utils'
import { type FormContextType, formLogicToFormContext } from './form.context'

export function useForm<
  TData,
  TAdapter extends ValidatorAdapter | undefined = undefined,
>(
  options: FormLogicOptions<TData, TAdapter>,
): FormContextType<TData, TAdapter> {
  // biome-ignore lint/correctness/useExhaustiveDependencies: We only ever want to create a form once
  const finalForm = React.useMemo(() => {
    const form = new FormLogic(options)
    return formLogicToFormContext(form)
  }, [])

  finalForm.updateOptions(options)

  useIsomorphicLayoutEffect(() => {
    finalForm.mount()
    return () => {
      finalForm.unmount()
    }
  }, [finalForm])

  return finalForm
}

export function useFormWithComponents<
  TData,
  TAdapter extends ValidatorAdapter | undefined = undefined,
>(form: FormLogic<TData, TAdapter>): FormContextType<TData, TAdapter> {
  return React.useMemo(() => formLogicToFormContext(form), [form])
}
