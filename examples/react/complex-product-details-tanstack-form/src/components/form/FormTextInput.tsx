import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import { cn } from '@/lib/utils.ts'
import type { FieldApi } from '@tanstack/react-form'

export const FormTextInput = ({
  label,
  maxLength,
  field,
}: {
  label: string
  maxLength?: number
  field: FieldApi<any, any, any, any, any>
}) => {
  const currentCount = field.state.value?.length ?? 0
  const errorText = field.state.meta.errors.join(', ')
  const errorClassName = errorText?.length ? 'text-destructive' : ''

  return (
    <div>
      <Label htmlFor={field.name}>{label}</Label>
      <Input
        id={field.name}
        name={field.name}
        type="text"
        placeholder={label}
        onBlur={field.handleBlur}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        maxLength={maxLength}
      />
      <div
        className={cn(
          'mb-[-16px] flex flex-row justify-between font-medium text-[0.8rem]',
          errorClassName,
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
