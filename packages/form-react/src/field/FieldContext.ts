import React from 'react'
import type { FieldLogic, Paths } from '@signal-forms/form-core'

/**
 * Context of the current field.
 * @note The type has to be case since it cannot be generically determined at this point in time.
 */
export const FieldContext = React.createContext<
  FieldLogic<never, never, unknown> | undefined
>(undefined)

/**
 * Hook to access the current {@link FieldContext}.
 * It also casts the context to the correct type.
 *
 * @throws Error If the hook is used outside a {@link FieldProvider}.
 */
export function useFieldContext<
  TData,
  TName extends Paths<TData>,
  TBoundData=never,
>(): FieldLogic<TData, TName, TBoundData> {
  const field = React.useContext(FieldContext)

  if (!field) {
    throw new Error('useFieldContext must be used within a FieldProvider')
  }

  return field as FieldLogic<TData, TName, TBoundData>
}
