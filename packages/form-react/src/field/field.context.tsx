import type {
  FieldLogic,
  Paths,
  ValidatorAdapter,
  ValueAtPath,
} from '@form-signals/form-core'
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
  TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
> extends FieldLogic<TData, TName, TBoundData, TAdapter, TFormAdapter, TMixin> {
  FieldProvider: (props: {
    children: FieldChildren<
      TData,
      TName,
      TBoundData,
      TAdapter,
      TFormAdapter,
      TMixin
    >
  }) => ReactNode
  SubFieldProvider: <
    TChildData extends ValueAtPath<TData, TName>,
    TChildName extends Paths<TChildData>,
    TChildBoundData = never,
    TChildAdapter extends ValidatorAdapter | undefined = undefined,
    TChildMixin extends readonly Exclude<
      Paths<TChildData>,
      TChildName
    >[] = never[],
  >(
    props: FieldProps<
      TChildData,
      TChildName,
      TChildBoundData,
      TChildAdapter,
      TFormAdapter,
      TChildMixin
    >,
  ) => ReactNode
}

export function fieldLogicToFieldContext<
  TData,
  TName extends Paths<TData>,
  TBoundData = never,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
>(
  logic: FieldLogic<TData, TName, TBoundData, TAdapter, TFormAdapter, TMixin>,
): FieldContextType<TData, TName, TBoundData, TAdapter, TFormAdapter, TMixin> {
  const castedLogic = logic as FieldContextType<
    TData,
    TName,
    TBoundData,
    TAdapter,
    TFormAdapter,
    TMixin
  >
  castedLogic.FieldProvider = (props) => (
    <FieldProvider field={castedLogic}>{props.children}</FieldProvider>
  )
  castedLogic.SubFieldProvider = ({ children, ...props }) => (
    <SubField parentField={castedLogic} {...props}>
      {children}
    </SubField>
  )

  castedLogic.handleBlur = castedLogic.handleBlur.bind(castedLogic)
  castedLogic.handleChange = castedLogic.handleChange.bind(castedLogic)
  castedLogic.handleTouched = castedLogic.handleTouched.bind(castedLogic)
  castedLogic.handleSubmit = castedLogic.handleSubmit.bind(castedLogic)

  return castedLogic
}

export const FieldContext = React.createContext<
  FieldContextType<any, any, any, any, any, any> | undefined
>(undefined)

export function useFieldContext<
  TData,
  TName extends Paths<TData>,
  TBoundData = never,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
>(): FieldContextType<
  TData,
  TName,
  TBoundData,
  TAdapter,
  TFormAdapter,
  TMixin
> {
  const field = React.useContext(FieldContext)

  if (!field) {
    throw new Error('useFieldContext must be used within a FieldProvider')
  }

  return field as unknown as FieldContextType<
    TData,
    TName,
    TBoundData,
    TAdapter,
    TFormAdapter,
    TMixin
  >
}
