import {
  FormLogic,
  type FormLogicOptions,
  type ValidatorAdapter,
} from '@formsignals/form-core'
import React from 'react'
import { useIsomorphicLayoutEffect } from '../utils'
import { type FormContextType, formLogicToFormContext } from './form.context'

/**
 * Creates a form logic object and returns the form context object.
 * Furthermore, it mounts the form logic object and unmounts it when the component is unmounted.
 *
 * @param options - The options to create the form logic object.
 *
 * @returns The form context object.
 *
 * @note
 * Any change to the options of this hook will reflect in the form logic object.
 */
export function useForm<
  TData,
  TAdapter extends ValidatorAdapter | undefined = undefined,
>(
  options?: FormLogicOptions<TData, TAdapter>,
): FormContextType<TData, TAdapter> {
  // biome-ignore lint/correctness/useExhaustiveDependencies: We only ever want to create a form once, and we have to update the options in a layout effect to avoid setting state during render
  const form = React.useMemo(() => formLogicToFormContext(new FormLogic(options)), [])

  useIsomorphicLayoutEffect(() => {
    form.mount()
    return () => {
      form.unmount()
    }
  }, [form])

  useIsomorphicLayoutEffect(() => {
    // That way we can make sure to not update the options for the first render
    if(!form.isMounted.peek()) return
    form.updateOptions(options)
  }, [form, options]);

  return form
}

/**
 * Attaches the React components to the form logic object.
 *
 * @param form - The form logic object.
 *
 * @returns The form context object.
 */
export function useFormWithComponents<
  TData,
  TAdapter extends ValidatorAdapter | undefined = undefined,
>(form: FormLogic<TData, TAdapter>): FormContextType<TData, TAdapter> {
  return React.useMemo(() => formLogicToFormContext(form), [form])
}
