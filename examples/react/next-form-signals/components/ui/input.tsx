import * as React from 'react'

import { cn } from '@/lib/utils'
import { useFieldContext } from '@formsignals/form-react'
import { useComputed } from '@preact/signals-react'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export interface InputFormProps
  extends Omit<InputProps, 'value' | 'onChange' | 'onBlur'> {
  useTransformed?: boolean
}

const InputForm = ({ useTransformed, className, ...props }: InputFormProps) => {
  const field = useFieldContext<string, ''>()
  const handleChange = useTransformed
    ? field.handleChangeBound
    : field.handleChange
  const valueSignal = useTransformed ? field.transformedData : field.data
  const errorClassName = useComputed(
    () => !field.isValid.value && 'border-destructive',
  )
  const classNames = cn(className, errorClassName.value)

  return (
    <Input
      className={classNames}
      {...props}
      value={valueSignal?.value}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={field.handleBlur}
    />
  )
}
InputForm.displayName = 'InputForm'

export { Input, InputForm }
