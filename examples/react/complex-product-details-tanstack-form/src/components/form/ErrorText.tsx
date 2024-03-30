import type { FieldApi } from '@tanstack/react-form'

/**
 * @useSignals
 */
export const ErrorText = ({
  field,
}: { field: FieldApi<any, any, any, any, any> }) => {
  if (!field.state.meta.errors.length) return null
  return (
    <p className="text-[0.8rem] font-medium text-destructive">
      {field.state.meta.errors.join(', ')}
    </p>
  )
}
