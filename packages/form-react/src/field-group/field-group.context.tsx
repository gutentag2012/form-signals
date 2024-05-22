import {
  FieldGroupLogic,
  Paths,
  ValidatorAdapter,
  ExcludeAll, type FieldLogicOptions,
} from '@formsignals/form-core'
import React, { type ReactNode } from 'react'
import {
  FieldGroupChildren,
  FieldGroupProvider,
} from './field-group.provider'
import {FieldChildren, FieldProvider, useField} from "../field";

export interface FieldGroupContextType<
  TData,
  TMembers extends Paths<TData>[],
  TFieldGroupAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TFieldGroupMixin extends readonly ExcludeAll<Paths<TData>, TMembers>[] = never[],
> extends FieldGroupLogic<TData, TMembers, TFieldGroupAdapter, TFormAdapter, TFieldGroupMixin> {
  FieldProvider: <TName extends TMembers[number], TBoundData = never, TAdapter extends ValidatorAdapter | undefined = undefined, TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[]>(props: {
    name: TName
    options?: FieldLogicOptions<
      TData,
      TName,
      TBoundData,
      TAdapter extends undefined ? TFormAdapter : TAdapter,
      TMixin
    >
    children: FieldChildren<
      TData,
      TName,
      TBoundData,
      TAdapter,
      TFormAdapter,
      TMixin
    >
  }) => ReactNode
  FieldGroupProvider: (props: {
    children: FieldGroupChildren<
      TData,
      TMembers,
      TFieldGroupAdapter,
      TFormAdapter,
      TFieldGroupMixin
    >
  }) => ReactNode
}

export function fieldGroupLogicToFieldGroupContext<
  TData,
  TMembers extends Paths<TData>[],
  TFieldGroupAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly ExcludeAll<Paths<TData>, TMembers>[] = never[],
>(
  logic: FieldGroupLogic<TData, TMembers, TFieldGroupAdapter, TFormAdapter, TMixin>,
): FieldGroupContextType<TData, TMembers, TFieldGroupAdapter, TFormAdapter, TMixin> {
  const castedLogic = logic as FieldGroupContextType<TData, TMembers, TFieldGroupAdapter, TFormAdapter, TMixin>

  castedLogic.FieldProvider = ({name, options, children}) => {
    const field = useField(castedLogic.form, name, options)
    return (
      <FieldProvider field={field}>{children}</FieldProvider>
    )
  }
  castedLogic.FieldGroupProvider = (props) => (
    <FieldGroupProvider group={castedLogic}>{props.children}</FieldGroupProvider>
  )
  castedLogic.handleSubmit = castedLogic.handleSubmit.bind(castedLogic)

  return castedLogic
}

export const FieldGroupContext = React.createContext<
  FieldGroupContextType<any, any, any, any, any> | undefined
>(undefined)

export function useFieldGroupContext<
  TData,
  TMembers extends Paths<TData>[],
  TFieldGroupAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly ExcludeAll<Paths<TData>, TMembers>[] = never[],
>(): FieldGroupContextType<TData, TMembers, TFieldGroupAdapter, TFormAdapter, TMixin> {
  const group = React.useContext(FieldGroupContext)

  if (!group) {
    throw new Error('useFieldGroupContext must be used within a FieldGroupProvider')
  }

  return group as unknown as FieldGroupContextType<TData, TMembers, TFieldGroupAdapter, TFormAdapter, TMixin>
}
