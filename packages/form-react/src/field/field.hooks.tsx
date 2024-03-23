import type {
  FieldLogic,
  FieldLogicOptions,
  FormLogic,
  Paths,
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
>(
  form: FormContextType<TData> | FormLogic<TData>,
  name: TName,
  options: FieldLogicOptions<TData, TName, TBoundValue>,
): FieldContextType<TData, TName, TBoundValue> {
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
>(
  field: FieldLogic<TData, TName, TBoundValue>,
): FieldContextType<TData, TName, TBoundValue> {
  return React.useMemo(() => fieldLogicToFieldContext(field), [field])
}
