import {
  FieldLogic,
  type FieldLogicOptions,
  type FormLogic,
  type Paths,
  type PathsDefaultValue,
} from '@signal-forms/form-core'
import { useEffect, useMemo } from 'react'
import { useFormContext } from '../form'
import { BindFieldProviderComponent } from './FieldProvider'

interface Field<TData, TName extends Paths<TData>, TBoundData = never>
  extends FieldLogic<TData, TName, TBoundData> {
  FieldProvider: ReturnType<
    typeof BindFieldProviderComponent<TData, TName, TBoundData>
  >
}

export function useFieldWithForm<
  TData = PathsDefaultValue,
  TName extends Paths<TData> = Paths<TData>,
  TBoundData = never,
>(
  form: FormLogic<TData>,
  name: TName,
  fieldOptions?: FieldLogicOptions<TData, TName, TBoundData>,
): Field<TData, TName, TBoundData> {
  // TODO This possibly needs to listen to changes in the name to create new fields (but in that case we should include a `form.getOrCreateField` method)
  // biome-ignore lint/correctness/useExhaustiveDependencies: We only ever want to create this element once
  const field = useMemo(() => {
    const field = new FieldLogic(form, name, fieldOptions) as Field<
      TData,
      TName,
      TBoundData
    >

    field.FieldProvider = BindFieldProviderComponent<TData, TName, TBoundData>(
      field,
    )

    return field
  }, [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: We only want to hook into the component render lifecycle once
  useEffect(() => {
    field.mount()
    return () => {
      field.unmount()
    }
  }, [])

  return field
}
export function useField<
  TData = PathsDefaultValue,
  TName extends Paths<TData> = Paths<TData>,
  TBoundData = never,
>(
  name: TName,
  fieldOptions?: FieldLogicOptions<TData, TName, TBoundData>,
): Field<TData, TName, TBoundData> {
  const form = useFormContext<TData>()
  return useFieldWithForm(form, name, fieldOptions) as Field<
    TData,
    TName,
    TBoundData
  >
}
