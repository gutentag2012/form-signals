import { FormLogic, type FormLogicOptions } from '@signal-forms/form-core'
import { useEffect, useMemo } from 'react'
import { BindFormProviderComponent } from '../components'
import { BindFormFieldProviderComponent } from '../field/FieldProvider'

export function useFormInstance<TData>(formOptions: FormLogicOptions<TData>) {
  // biome-ignore lint/correctness/useExhaustiveDependencies: We only ever want to create this element once
  return useMemo(() => new FormLogic(formOptions), [])
}

interface Form<TData> extends FormLogic<TData> {
  FormProvider: ReturnType<typeof BindFormProviderComponent<TData>>
  FieldProvider: ReturnType<typeof BindFormFieldProviderComponent<TData>>
}

export function useForm<TData>(formOptions: FormLogicOptions<TData>) {
  const form = useFormInstance(formOptions) as Form<TData>
  // biome-ignore lint/correctness/useExhaustiveDependencies: We only want to hook into the component render lifecycle once
  useEffect(() => {
    form.mount()
    return () => {
      form.unmount()
    }
  }, [])
  form.FormProvider = BindFormProviderComponent<TData>(form)
  form.FieldProvider = BindFormFieldProviderComponent<TData>(form)
  return form
}
