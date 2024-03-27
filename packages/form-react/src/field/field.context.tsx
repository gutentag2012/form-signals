import type {
  FieldLogic,
  Paths,
  ValidatorAdapter,
  ValueAtPath,
} from '@signal-forms/form-core'
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
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
> extends FieldLogic<TData, TName, TBoundData, TAdapter, TFormAdapter> {
  FieldProvider: (props: {
    children: FieldChildren<TData, TName, TBoundData, TAdapter, TFormAdapter>
  }) => ReactNode
  SubFieldProvider: <
    TChildData extends ValueAtPath<TData, TName>,
    TChildName extends Paths<TChildData>,
    TChildBoundData = never,
    TChildAdapter extends ValidatorAdapter | undefined = undefined,
  >(
    props: FieldProps<
      TChildData,
      TChildName,
      TChildBoundData,
      TChildAdapter,
      TFormAdapter
    >,
  ) => ReactNode
}

export function fieldLogicToFieldContext<
  TData,
  TName extends Paths<TData>,
  TBoundData = never,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
>(
  logic: FieldLogic<TData, TName, TBoundData, TAdapter, TFormAdapter>,
): FieldContextType<TData, TName, TBoundData, TAdapter, TFormAdapter> {
  const castedLogic = logic as FieldContextType<
    TData,
    TName,
    TBoundData,
    TAdapter,
    TFormAdapter
  >
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
  FieldContextType<any, any, any, any, any> | undefined
>(undefined)

export function useFieldContext<
  TData,
  TName extends Paths<TData>,
  TBoundData = never,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
>(): FieldContextType<TData, TName, TBoundData, TAdapter, TFormAdapter> {
  const field = React.useContext(FieldContext)

  if (!field) {
    throw new Error('useFieldContext must be used within a FieldProvider')
  }

  return field as unknown as FieldContextType<
    TData,
    TName,
    TBoundData,
    TAdapter,
    TFormAdapter
  >
}
