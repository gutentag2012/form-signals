import {
  ExcludeAll,
  FieldGroupLogicOptions,
  Paths,
  ValidatorAdapter,
} from '@formsignals/form-core'
// biome-ignore lint/style/useImportType: This is the React import
import React from 'react'
import { type FormContextType, useFormContext } from '../form'
import {FieldGroupContext, FieldGroupContextType} from './field-group.context'
import {useFieldGroup} from './field-group.hooks'

export type FieldGroupChildren<
  TData,
  TMembers extends Paths<TData>[],
  TFieldGroupAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TFieldGroupMixin extends readonly ExcludeAll<Paths<TData>, TMembers>[] = never[],
> =
  | ((
      group: FieldGroupContextType<
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
  TFieldGroupMixin extends readonly ExcludeAll<Paths<TData>, TMembers>[] = never[],
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

export interface FieldGroupProviderProps<
  TData,
  TMembers extends Paths<TData>[],
  TFieldGroupAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TFieldGroupMixin extends readonly ExcludeAll<Paths<TData>, TMembers>[] = never[],
> {
  group: FieldGroupContextType<
    TData,
    TMembers,
    TFieldGroupAdapter,
    TFormAdapter,
    TFieldGroupMixin
  >
  children: FieldGroupChildren<
    TData,
    TMembers,
    TFieldGroupAdapter,
    TFormAdapter,
    TFieldGroupMixin
  >
}

export function FieldGroupProvider<
  TData,
  TMembers extends Paths<TData>[],
  TFieldGroupAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TFieldGroupMixin extends readonly ExcludeAll<Paths<TData>, TMembers>[] = never[],
>(
  props: FieldGroupProviderProps<
    TData,
    TMembers,
    TFieldGroupAdapter,
    TFormAdapter,
    TFieldGroupMixin
  >,
): React.ReactElement {
  return (
    <FieldGroupContext.Provider value={props.group}>
      {useUnwrappedChildren(props.children, props.group)}
    </FieldGroupContext.Provider>
  )
}

export interface FieldGroupWithFormProps<
  TData,
  TMembers extends Paths<TData>[],
  TFieldGroupAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TFieldGroupMixin extends readonly ExcludeAll<Paths<TData>, TMembers>[] = never[],
> extends FieldGroupProps<TData, TMembers, TFieldGroupAdapter, TFormAdapter, TFieldGroupMixin> {
  form: FormContextType<TData, TFormAdapter>
}

export function FieldGroupWithForm<
  TData,
  TMembers extends Paths<TData>[],
  TFieldGroupAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TFieldGroupMixin extends readonly ExcludeAll<Paths<TData>, TMembers>[] = never[],
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
>): React.ReactElement {
  const group = useFieldGroup(form, members, props)
  return <FieldGroupProvider group={group}>{children}</FieldGroupProvider>
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
  TFieldGroupMixin extends readonly ExcludeAll<Paths<TData>, TMembers>[] = never[],
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
  >,
  members: TMembers
}

/**
 * The field group component.
 *
 * @param name - The name of the field.
 * @param children - The children to render.
 * @param props - The props to pass to the field logic.
 */
export function FieldGroup<
  TData,
  TMembers extends Paths<TData>[],
  TFieldGroupAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TFieldGroupMixin extends readonly ExcludeAll<Paths<TData>, TMembers>[] = never[],
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
>): React.ReactElement {
  const form = useFormContext<TData, TFormAdapter>()
  return (
    <FieldGroupWithForm form={form} members={members} {...props}>
      {children}
    </FieldGroupWithForm>
  )
}
