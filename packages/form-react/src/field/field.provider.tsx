import type {
  FieldLogic,
  FieldLogicOptions,
  Paths,
  ValueAtPath,
} from '@signal-forms/form-core'
// biome-ignore lint/style/useImportType: This is the React import
import React from 'react'
import { type FormContextType, useFormContext } from '../form'
import { FieldContext, type FieldContextType } from './field.context'
import { useField } from './field.hooks'

export type FieldChildren<TData, TName extends Paths<TData>, TBoundData> =
  | ((field: FieldLogic<TData, TName, TBoundData>) => React.ReactNode)
  | React.ReactNode

function useUnwrappedChildren<TData, TName extends Paths<TData>, TBoundData>(
  children: FieldChildren<TData, TName, TBoundData>,
  field: FieldContextType<TData, TName, TBoundData>,
): React.ReactNode {
  if (typeof children === 'function') {
    return children(field)
  }

  return children
}

export interface FieldProviderProps<
  TData,
  TName extends Paths<TData>,
  TBoundData,
> {
  field: FieldContextType<TData, TName, TBoundData>
  children: FieldChildren<TData, TName, TBoundData>
}

export function FieldProvider<TData, TName extends Paths<TData>, TBoundData>(
  props: FieldProviderProps<TData, TName, TBoundData>,
): React.ReactElement {
  return (
    <FieldContext.Provider
      value={props.field as unknown as FieldContextType<never, never, unknown>}
    >
      {useUnwrappedChildren(props.children, props.field)}
    </FieldContext.Provider>
  )
}

export interface FieldProps<TData, TName extends Paths<TData>, TBoundData>
  extends FieldLogicOptions<TData, TName, TBoundData> {
  children: FieldChildren<TData, TName, TBoundData>
  name: TName
}
export function Field<TData, TName extends Paths<TData>, TBoundData>({
  name,
  children,
  ...props
}: FieldProps<TData, TName, TBoundData>): React.ReactElement {
  const form = useFormContext<TData>()
  const field = useField(form, name, props)
  return <FieldProvider field={field}>{children}</FieldProvider>
}

export interface FieldWithFormProps<
  TData,
  TName extends Paths<TData>,
  TBoundData,
> extends FieldProps<TData, TName, TBoundData> {
  form: FormContextType<TData>
}
export function FieldWithForm<TData, TName extends Paths<TData>, TBoundData>({
  form,
  name,
  children,
  ...props
}: FieldWithFormProps<TData, TName, TBoundData>) {
  const field = useField(form, name, props)
  return <FieldProvider field={field}>{children}</FieldProvider>
}

export interface SubFieldProps<
  TParentData,
  TParentName extends Paths<TParentData>,
  TParentBoundData,
  TData,
  TName extends Paths<TData>,
  TBoundData,
> extends FieldProps<TData, TName, TBoundData> {
  parentField: FieldContextType<TParentData, TParentName, TParentBoundData>
}
export function SubField<
  TParentData,
  TParentName extends Paths<TParentData>,
  TParentBoundData,
  TData extends ValueAtPath<TParentData, TParentName>,
  TName extends Paths<TData>,
  TBoundData,
>({
  parentField,
  name,
  children,
  ...props
}: SubFieldProps<
  TParentData,
  TParentName,
  TParentBoundData,
  TData,
  TName,
  TBoundData
>) {
  const field = useField(
    parentField.form as unknown as FormContextType<TData>,
    `${parentField.name}.${name}` as unknown as TName,
    props,
  )
  return <FieldProvider field={field}>{children}</FieldProvider>
}
