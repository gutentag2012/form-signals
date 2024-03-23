import { FormLogic, type FormLogicOptions } from '@signal-forms/form-core'
import React from 'react'
import { useIsomorphicLayoutEffect } from '../utils'
import { type FormContextType, formLogicToFormContext } from './form.context'

export function useForm<TData>(
  options: FormLogicOptions<TData>,
): FormContextType<TData> {
  // biome-ignore lint/correctness/useExhaustiveDependencies: We only ever want to create a form once
  const finalForm = React.useMemo(() => {
    const form = new FormLogic(options)
    return formLogicToFormContext(form)
  }, [])

  useIsomorphicLayoutEffect(() => {
    finalForm.mount()
    return () => {
      finalForm.unmount()
    }
  }, [finalForm])

  return finalForm
}

export function useFormWithComponents<TData>(
  form: FormLogic<TData>,
): FormContextType<TData> {
  return React.useMemo(() => formLogicToFormContext(form), [form])
}
