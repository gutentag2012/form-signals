import {
  FieldLogic,
  type FieldLogicOptions,
  type FormLogic,
  type Paths,
  type PathsDefaultValue,
} from '@signal-forms/form-core'
import { useEffect, useMemo } from 'react'
import type { BindFormProviderComponent } from '../components'
import { useFormContext } from '../form/FormContext'

export function useFieldInstance<
  TData,
  TName extends Paths<TData>,
  TBoundData = never,
>(
  form: FormLogic<TData>,
  name: TName,
  fieldOptions?: FieldLogicOptions<TData, TName, TBoundData>,
) {
  // biome-ignore lint/correctness/useExhaustiveDependencies: We only ever want to create this element once
  return useMemo(() => new FieldLogic(form, name, fieldOptions), [])
}

interface Field<TData, TName extends Paths<TData>, TBoundData>
  extends FieldLogic<TData, TName, TBoundData> {
  FormProvider?: ReturnType<typeof BindFormProviderComponent<TData>>
}

export function useFieldWithForm<
  TData = PathsDefaultValue,
  TName extends Paths<TData> = Paths<TData>,
  TBoundData = never,
>(
  form: FormLogic<TData>,
  name: TName,
  fieldOptions?: FieldLogicOptions<TData, TName, TBoundData>,
) {
  const field = useFieldInstance(form, name, fieldOptions) as Field<
    TData,
    TName,
    TBoundData
  >

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
>(name: TName, fieldOptions?: FieldLogicOptions<TData, TName, TBoundData>) {
  const form = useFormContext<TData>()
  return useFieldWithForm(form, name, fieldOptions) as Field<
    TData,
    TName,
    TBoundData
  >
}
