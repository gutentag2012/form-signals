import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import { cn } from '@/lib/utils.ts'
import { useFormContext } from 'react-hook-form'

export const FormTextInput = ({
  label,
  name,
  maxLength,
}: {
  label: string
  name: string
  maxLength?: number
}) => {
  const form = useFormContext()
  const field = form.register(name)
  const currentCount = form.watch(name)?.length ?? 0

  const errorText = form.formState.errors[name]?.message as string
  const errorClassName = errorText ? 'text-destructive' : ''

  return (
    <div>
      <Label htmlFor={field.name}>{label}</Label>
      <Input
        id={field.name}
        type="text"
        placeholder={label}
        maxLength={maxLength}
        {...field}
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
