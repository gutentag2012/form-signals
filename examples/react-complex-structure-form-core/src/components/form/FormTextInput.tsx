import { InputSignal } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import { cn } from '@/lib/utils.ts'
import { useFieldContext } from '@form-signals/form-react'
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
          'flex flex-row justify-between text-[0.8rem] font-medium mb-[-16px]',
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
