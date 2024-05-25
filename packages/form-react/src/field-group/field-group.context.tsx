import type {
  ExcludeAll,
  FieldGroupLogic,
  Paths,
  ValidatorAdapter,
} from '@formsignals/form-core'
import React, { type ReactNode } from 'react'
import { type FieldProps, FieldProvider, useField } from '../field'
import {
  type FieldGroupChildren,
  FieldGroupProvider,
} from './field-group.provider'

/**
 * The context object that is used to provide the field group logic to the field group components.
 * It extends the field group logic object with the provider components.
 *
 * @template TData The type of the form data.
 * @template TMembers The type of the field group members.
 * @template TFieldGroupAdapter The type of the field group validator adapter.
 * @template TFormAdapter The type of the form validator adapter.
 * @template TFieldGroupMixin The type of the field group mixin paths.
 *
 * @property FieldProvider The provider component that provides the field logic to the field components.
 * @property FieldGroupProvider The provider component that provides the field group logic to the field group components.
 * @property handleSubmit The function that handles the submit-event of the form.
 */
export interface FieldGroupContextType<
  TData,
  TMembers extends Paths<TData>[],
  TFieldGroupAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TFieldGroupMixin extends readonly ExcludeAll<
    Paths<TData>,
    TMembers
  >[] = never[],
> extends FieldGroupLogic<
    TData,
    TMembers,
    TFieldGroupAdapter,
    TFormAdapter,
    TFieldGroupMixin
  > {
  /**
   * The provider component that provides the field logic to the field components.
   *
   * @param props - The props of the field logic component.
   */
  FieldProvider: <
    TName extends TMembers[number],
    TBoundData = never,
    TAdapter extends ValidatorAdapter | undefined = undefined,
    TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
  >(
    props: FieldProps<TData, TName, TBoundData, TAdapter, TFormAdapter, TMixin>,
  ) => ReactNode
  /**
   * The provider component that provides the field group logic to the field group components.
   *
   * @param props - The props of the field group logic component.
   */
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

/**
 * Converts a field group logic object to a field group context object.
 *
 * @param logic - The field group logic object.
 *
 * @returns The field group context object.
 */
export function fieldGroupLogicToFieldGroupContext<
  TData,
  TMembers extends Paths<TData>[],
  TFieldGroupAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly ExcludeAll<Paths<TData>, TMembers>[] = never[],
>(
  logic: FieldGroupLogic<
    TData,
    TMembers,
    TFieldGroupAdapter,
    TFormAdapter,
    TMixin
  >,
): FieldGroupContextType<
  TData,
  TMembers,
  TFieldGroupAdapter,
  TFormAdapter,
  TMixin
> {
  const castedLogic = logic as FieldGroupContextType<
    TData,
    TMembers,
    TFieldGroupAdapter,
    TFormAdapter,
    TMixin
  >

  castedLogic.FieldProvider = ({ name, children, ...options }) => {
    const field = useField(castedLogic.form, name, options)
    return <FieldProvider field={field}>{children}</FieldProvider>
  }
  castedLogic.FieldGroupProvider = (props) => (
    <FieldGroupProvider fieldGroup={castedLogic}>
      {props.children}
    </FieldGroupProvider>
  )
  castedLogic.handleSubmit = castedLogic.handleSubmit.bind(castedLogic)

  return castedLogic
}

/**
 * The context object that is used to provide the field group logic to the field group components.
 */
export const FieldGroupContext = React.createContext<
  FieldGroupContextType<any, any, any, any, any> | undefined
>(undefined)

/**
 * The hook that returns the field group context object.
 */
export function useFieldGroupContext<
  TData,
  TMembers extends Paths<TData>[],
  TFieldGroupAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly ExcludeAll<Paths<TData>, TMembers>[] = never[],
>(): FieldGroupContextType<
  TData,
  TMembers,
  TFieldGroupAdapter,
  TFormAdapter,
  TMixin
> {
  const group = React.useContext(FieldGroupContext)

  if (!group) {
    throw new Error(
      'useFieldGroupContext must be used within a FieldGroupProvider',
    )
  }

  return group as unknown as FieldGroupContextType<
    TData,
    TMembers,
    TFieldGroupAdapter,
    TFormAdapter,
    TMixin
  >
}
