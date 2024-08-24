import type {
  ExcludeAll,
  FieldGroupLogicOptions,
  Paths,
  ValidatorAdapter,
} from '@formsignals/form-core'
// biome-ignore lint/style/useImportType: This is the React import
import React from 'react'
import { type FormContextType, useFormContext } from '../form'
import {
  FieldGroupContext,
  type FieldGroupContextType,
} from './field-group.context'
import { useFieldGroup } from './field-group.hooks'

/**
 * The type children of the field group component can be.
 */
export type FieldGroupChildren<
  TData,
  TMembers extends Paths<TData>[],
  TFieldGroupAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TFieldGroupMixin extends readonly ExcludeAll<
    Paths<TData>,
    TMembers
  >[] = never[],
> =
  | ((
      fieldGroup: FieldGroupContextType<
        TData,
        TMembers,
        TFieldGroupAdapter,
        TFormAdapter,
        TFieldGroupMixin
      >,
    ) => React.ReactNode)
  | React.ReactNode

function useUnwrappedChildren<
  TData,
  TMembers extends Paths<TData>[],
  TFieldGroupAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TFieldGroupMixin extends readonly ExcludeAll<
    Paths<TData>,
    TMembers
  >[] = never[],
>(
  children: FieldGroupChildren<
    TData,
    TMembers,
    TFieldGroupAdapter,
    TFormAdapter,
    TFieldGroupMixin
  >,
  field: FieldGroupContextType<
    TData,
    TMembers,
    TFieldGroupAdapter,
    TFormAdapter,
    TFieldGroupMixin
  >,
): React.ReactNode {
  if (typeof children === 'function') {
    return children(field)
  }

  return children
}

/**Ü
 * The props for the field group provider.
 */
export interface FieldGroupProviderProps<
  TData,
  TMembers extends Paths<TData>[],
  TFieldGroupAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TFieldGroupMixin extends readonly ExcludeAll<
    Paths<TData>,
    TMembers
  >[] = never[],
> {
  /**
   * The field group context to provide.
   */
  fieldGroup: FieldGroupContextType<
    TData,
    TMembers,
    TFieldGroupAdapter,
    TFormAdapter,
    TFieldGroupMixin
  >
  /**
   * The children to render.
   */
  children: FieldGroupChildren<
    TData,
    TMembers,
    TFieldGroupAdapter,
    TFormAdapter,
    TFieldGroupMixin
  >
}

/**
 * The field group provider component.
 *
 * @param props - The props to pass to the field group context.
 */
export function FieldGroupProvider<
  TData,
  TMembers extends Paths<TData>[],
  TFieldGroupAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TFieldGroupMixin extends readonly ExcludeAll<
    Paths<TData>,
    TMembers
  >[] = never[],
>(
  props: FieldGroupProviderProps<
    TData,
    TMembers,
    TFieldGroupAdapter,
    TFormAdapter,
    TFieldGroupMixin
  >,
): React.JSX.Element {
  return (
    <FieldGroupContext.Provider value={props.fieldGroup}>
      {useUnwrappedChildren(props.children, props.fieldGroup)}
    </FieldGroupContext.Provider>
  )
}

/**
 * The props for the field group component.
 */
export interface FieldGroupWithFormProps<
  TData,
  TMembers extends Paths<TData>[],
  TFieldGroupAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TFieldGroupMixin extends readonly ExcludeAll<
    Paths<TData>,
    TMembers
  >[] = never[],
> extends FieldGroupProps<
    TData,
    TMembers,
    TFieldGroupAdapter,
    TFormAdapter,
    TFieldGroupMixin
  > {
  /**
   * The form context to use.
   */
  form: FormContextType<TData, TFormAdapter>
}

/**
 * The field group component with an explicit form not taken from context.
 *
 * @param form - The form context to use.
 * @param members - The members of the field group.
 * @param children - The children to render.
 * @param props - The props to pass to the field group logic.
 */
export function FieldGroupWithForm<
  TData,
  TMembers extends Paths<TData>[],
  TFieldGroupAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TFieldGroupMixin extends readonly ExcludeAll<
    Paths<TData>,
    TMembers
  >[] = never[],
>({
  form,
  members,
  children,
  ...props
}: FieldGroupWithFormProps<
  TData,
  TMembers,
  TFieldGroupAdapter,
  TFormAdapter,
  TFieldGroupMixin
>): React.JSX.Element {
  const group = useFieldGroup(form, members, props)
  return <FieldGroupProvider fieldGroup={group}>{children}</FieldGroupProvider>
}

/**
 * The props for the field group component.
 * The form for this component is taken from the context.
 */
export interface FieldGroupProps<
  TData,
  TMembers extends Paths<TData>[],
  TFieldGroupAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TFieldGroupMixin extends readonly ExcludeAll<
    Paths<TData>,
    TMembers
  >[] = never[],
> extends FieldGroupLogicOptions<
    TData,
    TMembers,
    TFieldGroupAdapter extends undefined ? TFormAdapter : TFieldGroupAdapter,
    TFieldGroupMixin
  > {
  children: FieldGroupChildren<
    TData,
    TMembers,
    TFieldGroupAdapter,
    TFormAdapter,
    TFieldGroupMixin
  >
  members: TMembers
}

/**
 * The field group component.
 *
 * @param members - The members of the field group.
 * @param children - The children to render.
 * @param props - The props to pass to the field group logic.
 */
export function FieldGroup<
  TData,
  TMembers extends Paths<TData>[],
  TFieldGroupAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TFieldGroupMixin extends readonly ExcludeAll<
    Paths<TData>,
    TMembers
  >[] = never[],
>({
  members,
  children,
  ...props
}: FieldGroupProps<
  TData,
  TMembers,
  TFieldGroupAdapter,
  TFormAdapter,
  TFieldGroupMixin
>): React.JSX.Element {
  const form = useFormContext<TData, TFormAdapter>()
  return (
    <FieldGroupWithForm form={form} members={members} {...props}>
      {children}
    </FieldGroupWithForm>
  )
}
