import type {
  FieldLogic,
  FieldLogicOptions,
  FormLogic,
  Paths,
  ValidatorAdapter,
} from '@form-signals/form-core'
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
  TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
>(
  field: FieldLogic<TData, TName, TBoundValue, TAdapter, TFormAdapter, TMixin>,
): FieldContextType<TData, TName, TBoundValue, TAdapter, TFormAdapter, TMixin> {
  return React.useMemo(() => fieldLogicToFieldContext(field), [field])
}
