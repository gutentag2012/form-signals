import { useFormContext } from '@formsignals/form-react'

/**
 * @useSignals
 */
export const ErrorTextForm = () => {
  const form = useFormContext()
  if (form.isValid.value) return null
  return (
    <p className="font-medium text-[0.8rem] text-destructive">
      {form.errors.value.join(', ')}
    </p>
  )
}
