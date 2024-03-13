import { FormLogic, type FormLogicOptions } from '@signal-forms/form-core'
import { useEffect, useMemo } from 'react'
import { BindFormFieldProviderComponent } from '../field/FieldProvider'
import { BindFormProviderComponent, handleSubmitOnEnterForForm } from './FormProvider'

interface Form<TData> extends FormLogic<TData> {
  FormProvider: ReturnType<typeof BindFormProviderComponent<TData>>
  FieldProvider: ReturnType<typeof BindFormFieldProviderComponent<TData>>
  handleSubmitOnEnterForForm: ReturnType<typeof handleSubmitOnEnterForForm<TData>>
}
// TODO The useFormContext returns the wrong data, since it returns the complete Form type
export function useForm<TData>(
  formOptions: FormLogicOptions<TData>,
): Form<TData> {
  // biome-ignore lint/correctness/useExhaustiveDependencies: We only ever want to create this element once
  const form = useMemo(() => {
    const form = new FormLogic(formOptions) as Form<TData>
    form.FormProvider = BindFormProviderComponent<TData>(form)
    form.FieldProvider = BindFormFieldProviderComponent<TData>(form)
    form.handleSubmitOnEnterForForm = handleSubmitOnEnterForForm<TData>(form)
    return form
  }, [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: We only want to hook into the component render lifecycle once
  useEffect(() => {
    form.mount()
    return () => {
      form.unmount()
    }
  }, [])

  return form
}
