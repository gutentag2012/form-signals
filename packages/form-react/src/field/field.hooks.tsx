import type {
  FieldLogic,
  FieldLogicOptions,
  FormLogic,
  Paths,
  ValidatorAdapter,
} from '@formsignals/form-core'
import React from 'react'
import type { FormContextType } from '../form'
import { useIsomorphicLayoutEffect } from '../utils'
import {
  type FieldContextType,
  fieldLogicToFieldContext,
} from './field.context'

/**
 * Creates a field logic object and returns the field context object.
 * Furthermore, it mounts the field logic object and unmounts it when the component is unmounted.
 *
 * @param form - The form to create the field for
 * @param name - The name of the field
 * @param options - The options to create the field with
 *
 * @returns The field context
 */
export function useField<
  TData,
  TName extends Paths<TData>,
  TBoundValue = never,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
>(
  form: FormContextType<TData, TFormAdapter> | FormLogic<TData, TFormAdapter>,
  name: TName,
  options?: FieldLogicOptions<
    TData,
    TName,
    TBoundValue,
    TAdapter extends undefined ? TFormAdapter : TAdapter,
    TMixin
  >,
): FieldContextType<TData, TName, TBoundValue, TAdapter, TFormAdapter, TMixin> {
  // biome-ignore lint/correctness/useExhaustiveDependencies: We only ever want to create a field once, and we have to update the options in a layout effect to avoid setting state during render
  const field = React.useMemo(
    () => fieldLogicToFieldContext(form.getOrCreateField(name, options)),
    [form, name],
  )

  useIsomorphicLayoutEffect(() => {
    field.mount()
    return () => {
      field.unmount()
    }
  }, [field])

  useIsomorphicLayoutEffect(() => {
    // That way we can make sure to not update the options for the first render
    if (!field.isMounted.peek()) return
    field.updateOptions(options)
  }, [field, options])

  return field
}

/**
 * Attaches the React components to the field logic object.
 *
 * @param field - The field logic object.
 *
 * @returns The field context object.
 */
export function useFieldWithComponents<
  TData,
  TName extends Paths<TData>,
  TBoundValue = never,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
>(
  field: FieldLogic<TData, TName, TBoundValue, TAdapter, TFormAdapter, TMixin>,
): FieldContextType<TData, TName, TBoundValue, TAdapter, TFormAdapter, TMixin> {
  return React.useMemo(() => fieldLogicToFieldContext(field), [field])
}
