import { useFieldContext } from '@formsignals/form-react'

/**
 * @useSignals
 */
export const ErrorText = () => {
  const field = useFieldContext()
  if (field.isValidating.value)
    return <p className="text-[0.8rem] opacity-70">Validating...</p>
  if (field.isValid.value) return null
  return (
    <p className="font-medium text-[0.8rem] text-destructive">
      {field.errors.value.join(', ')}
    </p>
  )
}
