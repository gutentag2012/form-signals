import { FormLogic, type FormLogicOptions } from '@signal-forms/form-core'
import React from 'react'
import { type FormContextType, formLogicToFormContext } from './form.context'

export function useForm<TData>(
  options: FormLogicOptions<TData>,
): FormContextType<TData> {
  // biome-ignore lint/correctness/useExhaustiveDependencies: We only ever want to create a form once
  const finalForm = React.useMemo(() => {
    const form = new FormLogic(options)
    return formLogicToFormContext(form)
  }, [])

  React.useEffect(() => {
    finalForm.mount()
    return () => {
      finalForm.unmount()
    }
  }, [finalForm])

  return finalForm
}
