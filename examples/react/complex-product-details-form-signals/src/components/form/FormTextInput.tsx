import { InputSignal } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import { cn } from '@/lib/utils.ts'
import { useFieldContext } from '@formsignals/form-react'
import { type Signal, useComputed } from '@preact/signals-react'

export const FormTextInput = ({
  label,
  maxLength,
}: {
  label: string
  maxLength?: number
}) => {
  const field = useFieldContext<string | unknown, ''>()

  const currentCount = useComputed(() => {
    const value = field.data.value
    return typeof value === 'string' ? value.length : 0
  })
  const errorText = useComputed(() => {
    return field.errors.value.join(', ')
  })
  const errorClassName = useComputed(() => {
    return !field.isValid.value ? 'text-destructive' : ''
  })

  return (
    <div>
      <Label htmlFor={field.name}>{label}</Label>
      <InputSignal
        id={field.name}
        name={field.name}
        type="text"
        placeholder={label}
        onBlur={field.handleBlur}
        value={field.data as Signal<string>}
        maxLength={maxLength}
      />
      <div
        className={cn(
          'mb-[-16px] flex flex-row justify-between font-medium text-[0.8rem]',
          errorClassName.value,
        )}
      >
        <p>{errorText}</p>
        {maxLength && (
          <p>
            {currentCount}/{maxLength}
          </p>
        )}
      </div>
    </div>
  )
}
