import type {
  FieldLogic,
  FieldLogicOptions,
  FormLogic,
  Paths,
} from '@signal-forms/form-core'
// biome-ignore lint/nursery/useImportType: This is the React import and should never be a type import
import React from 'react'
import { FieldContext } from './FieldContext'
import { useField } from './useField'

/**
 * The children of a {@link FieldProvider}.
 * They can either be a function
 * that receives the {@link FieldLogic} or a React node that can then use the {@link useFieldContext} hook on its own.
 * @internal
 */
type FieldChildren<TData, TName extends Paths<TData>, TBoundData> =
  | ((field: FieldLogic<TData, TName, TBoundData>) => React.ReactNode)
  | React.ReactNode

/**
 * Props for the {@link FieldProviderComponent}.
 * It takes in the {@link FieldLogic} and the children, to create a context provider for that field.
 * @internal
 */
type FieldProviderComponentProps<
  TData,
  TName extends Paths<TData>,
  TBoundData,
> = {
  field: FieldLogic<TData, TName, TBoundData>
  children: FieldChildren<TData, TName, TBoundData>
}

/**
 * Props for the {@link FieldProvider}.
 * It takes in the name and {@link FieldLogicOptions} to create a {@link FieldLogic} and a context for that field.
 * @internal
 */
type FieldProviderPropsNoField<
  TData,
  TName extends Paths<TData>,
  TBoundData,
> = {
  name: TName
  children: FieldChildren<TData, TName, TBoundData>
} & FieldLogicOptions<TData, TName, TBoundData>

/**
 * Props for the {@link FieldProvider}.
 * It takes in the name, {@link FormLogic} and {@link FieldLogicOptions} to create a {@link FieldLogic} and a context for that field.
 * @internal
 */
type FieldProviderProps<TData, TName extends Paths<TData>, TBoundData> = {
  form: FormLogic<TData>
} & FieldProviderPropsNoField<TData, TName, TBoundData>

/**
 * A function that creates a {@link React.FC} that renders a {@link FieldProvider} with a given form.
 * @param form The form to bind to the components the returned function renders
 * @returns A component that renders a {@link FieldProvider} with the given form
 * @internal
 */
export function BindFormFieldProviderComponent<TData>(
  form: FormLogic<TData>,
): <TName extends Paths<TData>, TBoundData>(
  props: FieldProviderPropsNoField<TData, TName, TBoundData>,
) => React.ReactNode {
  return function BoundFormFieldProviderComponent({ children, ...props }) {
    return (
      <FieldProvider form={form} {...props}>
        {children}
      </FieldProvider>
    )
  }
}

/**
 * A function that creates a {@link React.FC} that renders a {@link FieldProvider} with a given field.
 * @param field The field to bind to the components the returned function renders
 * @returns A component that renders a {@link FieldProvider} with the given field
 * @internal
 */
export function BindFieldProviderComponent<
  TData,
  TName extends Paths<TData>,
  TBoundData,
>(
  field: FieldLogic<TData, TName, TBoundData>,
): (props: {
  children: FieldChildren<TData, TName, TBoundData>
}) => React.ReactNode {
  return function BoundFormFieldProviderComponent({ children }) {
    return (
      <FieldProviderComponent field={field}>{children}</FieldProviderComponent>
    )
  }
}

/**
 * A Provider of the {@link FieldContext} that takes in a {@link FieldLogic} and a children prop to render.
 * @param children The children, to render within the context of the field
 * @param field The field to provide to the children
 * @returns A component that renders the children within the context of the field
 */
export function FieldProviderComponent<
  TData,
  TName extends Paths<TData>,
  TBoundData = never,
>({
  children,
  field,
}: FieldProviderComponentProps<TData, TName, TBoundData>): React.ReactNode {
  const TypedContext = FieldContext as React.Context<
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

/**
 * A Provider of the {@link FieldContext} that takes in a name,
 * a {@link FormLogic} and a children prop to create a new {@link FieldLogic} and provide it as a context.
 * @param children The children, to render within the context of the field
 * @param form The form to bind to the field
 * @param name The name of the field
 * @param props The options to create the field with
 * @returns A component that renders the children within the context of the field
 */
export function FieldProvider<
  TData,
  TName extends Paths<TData>,
  TBoundData = never,
>({
  children,
  form,
  name,
  ...props
}: FieldProviderProps<TData, TName, TBoundData>): React.ReactNode {
  const field = useField(name, props) as FieldLogic<TData, TName, TBoundData>
  return (
    <FieldProviderComponent field={field}>{children}</FieldProviderComponent>
  )
}
