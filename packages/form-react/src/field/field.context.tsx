import type { FieldLogic, Paths, ValueAtPath } from '@signal-forms/form-core'
import React, { type ReactNode } from 'react'
import {
  type FieldChildren,
  type FieldProps,
  FieldProvider,
  SubField,
} from './field.provider'

export interface FieldContextType<
  TData,
  TName extends Paths<TData>,
  TBoundData = never,
> extends FieldLogic<TData, TName, TBoundData> {
  FieldProvider: (props: {
    children: FieldChildren<TData, TName, TBoundData>
  }) => ReactNode
  SubFieldProvider: <
    TChildData extends ValueAtPath<TData, TName>,
    TChildName extends Paths<TChildData>,
    TChildBoundData = never,
  >(
    props: FieldProps<TChildData, TChildName, TChildBoundData>,
  ) => ReactNode
}

export function fieldContextToFieldLogic<
  TData,
  TName extends Paths<TData>,
  TBoundData = never,
>(
  context: FieldContextType<TData, TName, TBoundData>,
): FieldLogic<TData, TName, TBoundData> {
  const castedContext = context as FieldLogic<TData, TName, TBoundData>
  ;(castedContext as any).FieldProvider = undefined
  ;(castedContext as any).SubFieldProvider = undefined
  return castedContext
}

export function fieldLogicToFieldContext<
  TData,
  TName extends Paths<TData>,
  TBoundData = never,
>(
  logic: FieldLogic<TData, TName, TBoundData>,
): FieldContextType<TData, TName, TBoundData> {
  const castedLogic = logic as FieldContextType<TData, TName, TBoundData>
  castedLogic.FieldProvider = (props) => (
    <FieldProvider field={castedLogic}>{props.children}</FieldProvider>
  )
  castedLogic.SubFieldProvider = ({ children, ...props }) => (
    <SubField parentField={castedLogic} {...props}>
      {children}
    </SubField>
  )
  return castedLogic
}

export const FieldContext = React.createContext<
  FieldContextType<never, never, unknown> | undefined
>(undefined)

export function useFieldContext<
  TData,
  TName extends Paths<TData>,
  TBoundData = never,
>(): FieldContextType<TData, TName, TBoundData> {
  const field = React.useContext(FieldContext)

  if (!field) {
    throw new Error('useFieldContext must be used within a FieldProvider')
  }

  return field as unknown as FieldContextType<TData, TName, TBoundData>
}
