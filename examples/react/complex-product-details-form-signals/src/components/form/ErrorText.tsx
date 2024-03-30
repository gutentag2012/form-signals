import { useFieldContext } from '@form-signals/form-react'

/**
 * @useSignals
 */
export const ErrorText = () => {
  const field = useFieldContext()
  if (!field.errors.value.length) return null
  return (
    <p className="text-[0.8rem] font-medium text-destructive">
      {field.errors.value.join(', ')}
    </p>
  )
}
