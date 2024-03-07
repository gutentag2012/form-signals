import type {
  FieldLogic,
  FieldLogicOptions,
  FormLogic,
  Paths,
} from '@signal-forms/form-core'
import type React from 'react'
import type { Context } from 'react'
import { FieldContext } from './FieldContext'
import { useField } from './useField'

type FieldChildren<TData, TName extends Paths<TData>, TBoundData> =
  | ((field: FieldLogic<TData, TName, TBoundData>) => React.ReactNode)
  | React.ReactNode

export type FieldProviderComponentProps<
  TData,
  TName extends Paths<TData>,
  TBoundData,
> = {
  field: FieldLogic<TData, TName, TBoundData>
  children: FieldChildren<TData, TName, TBoundData>
}

export type FieldProviderPropsNoField<
  TData,
  TName extends Paths<TData>,
  TBoundData,
> = {
  name: TName
  children: FieldChildren<TData, TName, TBoundData>
} & FieldLogicOptions<TData, TName, TBoundData>

export type FieldProviderProps<
  TData,
  TName extends Paths<TData>,
  TBoundData,
> = {
  form: FormLogic<TData>
} & FieldProviderPropsNoField<TData, TName, TBoundData>

export function BindFormFieldProviderComponent<TData>(form: FormLogic<TData>) {
  return function BoundFormFieldProviderComponent<
    TName extends Paths<TData>,
    TBoundData,
  >({
    children,
    ...props
  }: FieldProviderPropsNoField<TData, TName, TBoundData>) {
    return (
      <FieldProvider form={form} {...props}>
        {children}
      </FieldProvider>
    )
  }
}

export function FieldProviderComponent<
  TData,
  TName extends Paths<TData>,
  TBoundData,
>({ children, field }: FieldProviderComponentProps<TData, TName, TBoundData>) {
  const TypedContext = FieldContext as Context<
    FieldLogic<TData, TName, TBoundData>
  >
  const unwrappedChildren =
    typeof children === 'function' ? children(field) : children
  return (
    <TypedContext.Provider value={field}>
      {unwrappedChildren}
    </TypedContext.Provider>
  )
}

export function FieldProvider<TData, TName extends Paths<TData>, TBoundData>({
  children,
  form,
  name,
  ...props
}: FieldProviderProps<TData, TName, TBoundData>) {
  const field = useField(name, props) as FieldLogic<TData, TName, TBoundData>
  return (
    <FieldProviderComponent field={field}>{children}</FieldProviderComponent>
  )
}
