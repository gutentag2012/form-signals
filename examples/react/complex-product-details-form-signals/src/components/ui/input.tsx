import * as React from 'react'

import { cn } from '@/lib/utils'
import type { Signal } from '@preact/signals-react'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors disabled:cursor-not-allowed file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export interface InputSignalProps extends Omit<InputProps, 'value'> {
  value?: Signal<string>
}

const InputSignal = ({ value, onChange, ...props }: InputSignalProps) => {
  return (
    <Input
      {...props}
      value={value?.value}
      onChange={
        onChange ??
        ((e) => {
          if (!value) return
          value.value = e.target.value
        })
      }
    />
  )
}
InputSignal.displayName = 'InputSignal'

export { Input, InputSignal }
