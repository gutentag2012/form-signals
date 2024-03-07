import type { FieldLogic, Paths } from '@signal-forms/form-core'
import { createContext, useContext } from 'react'

export const FieldContext = createContext<
  FieldLogic<unknown, never, unknown> | undefined
>(undefined)

export const useFieldContext = <
  TData,
  TName extends Paths<TData>,
  TBoundData,
>(): FieldLogic<TData, TName, TBoundData> => {
  const field = useContext(FieldContext)

  if (!field) {
    throw new Error('useFieldContext must be used within a FieldProvider')
  }

  return field as FieldLogic<TData, TName, TBoundData>
}
