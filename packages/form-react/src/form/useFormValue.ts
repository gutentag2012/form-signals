import { type Paths } from "@signal-forms/form-core"
import { useFormContext } from "./FormContext"

export const useFormValue = <TData, TName extends Paths<TData>>(name: TName) => {
    const form = useFormContext<TData>()
    if(!form) throw new Error('useFormSignal must be used within a FormProvider')

    return form.getValueForPath(name)
}