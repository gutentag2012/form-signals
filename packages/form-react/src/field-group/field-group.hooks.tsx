import {
  ExcludeAll,
  FieldGroupLogic,
  FieldGroupLogicOptions,
  FormLogic, isEqualDeep,
  Paths,
  ValidatorAdapter,
} from '@formsignals/form-core'
import React from 'react'
import type { FormContextType } from '../form'
import { useIsomorphicLayoutEffect } from '../utils'
import {
  type FieldGroupContextType,
  fieldGroupLogicToFieldGroupContext,
} from './field-group.context'

function useEqualityMemoized<T>(value: T): T {
  const [state, setState] = React.useState(value)

  React.useEffect(() => {
    if(isEqualDeep(value, state)) return
    setState(value)
  }, [value, state])

  return state
}

/**
 * Creates a field group logic object and returns the field group context object.
 *
 * @param form - The form to create the field group for
 * @param members - The members of the field group
 * @param options - The options to create the field group with
 *
 * @returns The field group context
 */
export function useFieldGroup<
  TData,
  TMembers extends Paths<TData>[],
  TFieldGroupAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TFieldGroupMixin extends readonly ExcludeAll<
    Paths<TData>,
    TMembers
  >[] = never[],
>(
  form: FormContextType<TData, TFormAdapter> | FormLogic<TData, TFormAdapter>,
  members: TMembers,
  options?: FieldGroupLogicOptions<
    TData,
    TMembers,
    TFieldGroupAdapter extends undefined ? TFormAdapter : TFieldGroupAdapter,
    TFieldGroupMixin
  >,
): FieldGroupContextType<
  TData,
  TMembers,
  TFieldGroupAdapter,
  TFormAdapter,
  TFieldGroupMixin
> {
  const memoizedMembers = useEqualityMemoized(members)
  // biome-ignore lint/correctness/useExhaustiveDependencies: We only ever want to create a field once, and we have to update the options in a layout effect to avoid setting state during render
  const group = React.useMemo(
    () =>
      fieldGroupLogicToFieldGroupContext(
        form.getOrCreateFieldGroup(memoizedMembers, options),
      ),
    [form, memoizedMembers],
  )

  useIsomorphicLayoutEffect(() => {
    // That way we can make sure to not update the options for the first render
    if (!group.isMounted.peek()) return
    group.updateOptions(options)
  }, [group, options])

  useIsomorphicLayoutEffect(() => {
    group.mount()
    return () => {
      group.unmount()
    }
  }, [group])

  return group
}

/**
 * Attaches the React components to the field group logic object.
 *
 * @param field - The field group logic object.
 *
 * @returns The field group context object.
 */
export function useFieldGroupWithComponents<
  TData,
  TMembers extends Paths<TData>[],
  TFieldGroupAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TFieldGroupMixin extends readonly ExcludeAll<
    Paths<TData>,
    TMembers
  >[] = never[],
>(
  field: FieldGroupLogic<
    TData,
    TMembers,
    TFieldGroupAdapter,
    TFormAdapter,
    TFieldGroupMixin
  >,
): FieldGroupContextType<
  TData,
  TMembers,
  TFieldGroupAdapter,
  TFormAdapter,
  TFieldGroupMixin
> {
  return React.useMemo(() => fieldGroupLogicToFieldGroupContext(field), [field])
}
