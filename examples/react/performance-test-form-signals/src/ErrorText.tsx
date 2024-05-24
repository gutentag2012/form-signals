import { useFieldContext } from '@formsignals/form-react'

export function ErrorText() {
  const field = useFieldContext()
  if (field.isValid.value) return null
  return (
    <p
      style={{
        color: 'red',
        marginTop: 4,
        marginBottom: 8,
        fontSize: '0.85rem',
      }}
    >
      {field.errors.value.join(', ')}
    </p>
  )
}
