import type {
  FieldLogic,
  FieldLogicOptions,
  FormLogic,
  Paths,
  ValidatorAdapter,
} from '@signal-forms/form-core'
import React from 'react'
import type { FormContextType } from '../form'
import { useIsomorphicLayoutEffect } from '../utils'
import {
  type FieldContextType,
  fieldLogicToFieldContext,
} from './field.context'

export function useField<
  TData,
  TName extends Paths<TData>,
  TBoundValue = never,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
>(
  form: FormContextType<TData, TFormAdapter> | FormLogic<TData, TFormAdapter>,
  name: TName,
  options?: FieldLogicOptions<
    TData,
    TName,
    TBoundValue,
    TAdapter extends undefined ? TFormAdapter : TAdapter
  >,
): FieldContextType<TData, TName, TBoundValue, TAdapter, TFormAdapter> {
  const field = form.getOrCreateField(name, options)
  const finalField = React.useMemo(
    () => fieldLogicToFieldContext(field),
    [field],
  )

  useIsomorphicLayoutEffect(() => {
    finalField.mount()
    return () => {
      finalField.unmount()
    }
  }, [finalField])

  return finalField
}

export function useFieldWithComponents<
  TData,
  TName extends Paths<TData>,
  TBoundValue = never,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
>(
  field: FieldLogic<TData, TName, TBoundValue, TAdapter, TFormAdapter>,
): FieldContextType<TData, TName, TBoundValue, TAdapter, TFormAdapter> {
  return React.useMemo(() => fieldLogicToFieldContext(field), [field])
}
