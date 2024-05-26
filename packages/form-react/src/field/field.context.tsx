import type {
  FieldLogic,
  Paths,
  ValidatorAdapter,
  ValueAtPath,
} from '@formsignals/form-core'
import React, { type ReactNode } from 'react'
import {
  type FieldChildren,
  type FieldProps,
  FieldProvider,
  SubField,
} from './field.provider'

/**
 * The context object that is used to provide the field logic to the field components.
 * It extends the field logic object with the provider components.
 *
 * @template TData The type of the form data.
 * @template TName The type of the field name.
 * @template TBoundData The type of the bound data used by the transformer function {@link FormLogicOptions#transformFromBinding} and {@link FormLogicOptions#transformToBinding}.
 * @template TAdapter The type of the validator adapter.
 * @template TFormAdapter The type of the form validator adapter.
 * @template TMixin The type of the mixin paths.
 *
 * @property FieldProvider The provider component that provides the field logic to the field components.
 * @property SubFieldProvider The component that creates a field that is a subfield of the current field.
 */
export interface FieldContextType<
  TData,
  TName extends Paths<TData>,
  TBoundData = never,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
> extends FieldLogic<TData, TName, TBoundData, TAdapter, TFormAdapter, TMixin> {
  /**
   * The provider component that provides the field logic to the field components.
   *
   * @param props - The props of the field logic component.
   */
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
  /**
   * The component that creates a field that is a subfield of the current field.
   *
   * @param props - The props of the subfield component.
   */
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

/**
 * Converts a field logic object to a field context object.
 *
 * @param logic - The field logic object.
 *
 * @returns The field context object.
 */
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
  castedLogic.handleChangeBound = castedLogic.handleChangeBound.bind(castedLogic)
  castedLogic.handleTouched = castedLogic.handleTouched.bind(castedLogic)

  return castedLogic
}

/**
 * The context object that is used to provide the field logic to the field components.
 */
export const FieldContext = React.createContext<
  FieldContextType<any, any, any, any, any, any> | undefined
>(undefined)

/**
 * The hook that returns the field context object.
 */
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
