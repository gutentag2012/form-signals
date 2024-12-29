import { useFieldContext, useFieldGroupContext } from '@formsignals/form-react'

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

export const ErrorTextGroup = () => {
  const group = useFieldGroupContext()
  if (group.isValidating.value)
    return <p className="text-[0.8rem] opacity-70">Validating...</p>
  if (group.isValid.value) return null
  return (
    <p className="font-medium text-[0.8rem] text-destructive">
      {group.errors.value.join(', ')}
    </p>
  )
}
