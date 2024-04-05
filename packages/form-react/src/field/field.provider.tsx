import type {
  FieldLogic,
  FieldLogicOptions,
  Paths,
  ValidatorAdapter,
  ValueAtPath,
} from '@formsignals/form-core'
// biome-ignore lint/style/useImportType: This is the React import
import React from 'react'
import { type FormContextType, useFormContext } from '../form'
import { FieldContext, type FieldContextType } from './field.context'
import { useField } from './field.hooks'

/**
 * The type children of the field component can be.
 */
export type FieldChildren<
  TData,
  TName extends Paths<TData>,
  TBoundData = never,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
> =
  | ((
      field: FieldLogic<
        TData,
        TName,
        TBoundData,
        TAdapter,
        TFormAdapter,
        TMixin
      >,
    ) => React.ReactNode)
  | React.ReactNode

function useUnwrappedChildren<
  TData,
  TName extends Paths<TData>,
  TBoundData = never,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
>(
  children: FieldChildren<
    TData,
    TName,
    TBoundData,
    TAdapter,
    TFormAdapter,
    TMixin
  >,
  field: FieldContextType<
    TData,
    TName,
    TBoundData,
    TAdapter,
    TFormAdapter,
    TMixin
  >,
): React.ReactNode {
  if (typeof children === 'function') {
    return children(field)
  }

  return children
}

/**
 * The props for the field provider.
 */
export interface FieldProviderProps<
  TData,
  TName extends Paths<TData>,
  TBoundData = never,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
> {
  /**
   * The field context to provide.
   */
  field: FieldContextType<
    TData,
    TName,
    TBoundData,
    TAdapter,
    TFormAdapter,
    TMixin
  >
  /**
   * The children to render.
   */
  children: FieldChildren<
    TData,
    TName,
    TBoundData,
    TAdapter,
    TFormAdapter,
    TMixin
  >
}

/**
 * Provides the field context to the children.
 *
 * @param props - The props to pass to the field provider.
 */
export function FieldProvider<
  TData,
  TName extends Paths<TData>,
  TBoundData = never,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
>(
  props: FieldProviderProps<
    TData,
    TName,
    TBoundData,
    TAdapter,
    TFormAdapter,
    TMixin
  >,
): React.ReactElement {
  return (
    <FieldContext.Provider value={props.field}>
      {useUnwrappedChildren(props.children, props.field)}
    </FieldContext.Provider>
  )
}

/**
 * The props for the field with an explicit form not taken from context.
 */
export interface FieldWithFormProps<
  TData,
  TName extends Paths<TData>,
  TBoundData = never,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
> extends FieldProps<TData, TName, TBoundData, TAdapter, TFormAdapter, TMixin> {
  form: FormContextType<TData, TFormAdapter>
}

/**
 * Creates the field context with an explicit form.
 *
 * @param form - The form context object.
 * @param name - The name of the field.
 * @param children - The children to render.
 * @param props - The props to pass to the field logic.
 */
export function FieldWithForm<
  TData,
  TName extends Paths<TData>,
  TBoundData = never,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
>({
  form,
  name,
  children,
  ...props
}: FieldWithFormProps<
  TData,
  TName,
  TBoundData,
  TAdapter,
  TFormAdapter,
  TMixin
>): React.ReactElement {
  const field = useField(form, name, props)
  return <FieldProvider field={field}>{children}</FieldProvider>
}

/**
 * The props for the field component.
 * The form for this component is taken from the context.
 */
export interface FieldProps<
  TData,
  TName extends Paths<TData>,
  TBoundData = never,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
> extends FieldLogicOptions<
    TData,
    TName,
    TBoundData,
    TAdapter extends undefined ? TFormAdapter : TAdapter,
    TMixin
  > {
  children: FieldChildren<
    TData,
    TName,
    TBoundData,
    TAdapter,
    TFormAdapter,
    TMixin
  >
  name: TName
}

/**
 * The field component.
 *
 * @param name - The name of the field.
 * @param children - The children to render.
 * @param props - The props to pass to the field logic.
 */
export function Field<
  TData,
  TName extends Paths<TData>,
  TBoundData = never,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
>({
  name,
  children,
  ...props
}: FieldProps<
  TData,
  TName,
  TBoundData,
  TAdapter,
  TFormAdapter,
  TMixin
>): React.ReactElement {
  const form = useFormContext<TData, TFormAdapter>()
  return (
    <FieldWithForm form={form} name={name} {...props}>
      {children}
    </FieldWithForm>
  )
}

/**
 * The props for the subfield component.
 */
export interface SubFieldProps<
  TParentData,
  TParentName extends Paths<TParentData>,
  TParentBoundData,
  TData,
  TName extends Paths<TData>,
  TBoundData = never,
  TParentAdapter extends ValidatorAdapter | undefined = undefined,
  TParentFormAdapter extends ValidatorAdapter | undefined = undefined,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TParentMixin extends readonly Exclude<
    Paths<TParentData>,
    TParentName
  >[] = never[],
  TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
> extends FieldProps<TData, TName, TBoundData, TAdapter, TFormAdapter, TMixin> {
  parentField: FieldContextType<
    TParentData,
    TParentName,
    TParentBoundData,
    TParentAdapter,
    TParentFormAdapter,
    TParentMixin
  >
}

/**
 * The subfield component.
 *
 * @param parentField - The parent field context object.
 * @param name - The name of the field.
 * @param children - The children to render.
 * @param props - The props to pass to the field logic.
 */
export function SubField<
  TParentData,
  TParentName extends Paths<TParentData>,
  TParentBoundData,
  TData extends ValueAtPath<TParentData, TParentName>,
  TName extends Paths<TData>,
  TBoundData = never,
  TParentAdapter extends ValidatorAdapter | undefined = undefined,
  TParentFormAdapter extends ValidatorAdapter | undefined = undefined,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TParentMixin extends readonly Exclude<
    Paths<TParentData>,
    TParentName
  >[] = never[],
  TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
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
  TBoundData,
  TParentAdapter,
  TParentFormAdapter,
  TAdapter,
  TFormAdapter,
  TParentMixin,
  TMixin
>): React.ReactElement {
  const field = useField(
    parentField.form as unknown as FormContextType<TData, TFormAdapter>,
    `${parentField.name}.${name}` as unknown as TName,
    props,
  )
  return <FieldProvider field={field}>{children}</FieldProvider>
}
