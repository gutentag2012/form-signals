import * as React from 'react'

import { cn } from '@/lib/utils'
import type { Signal } from '@preact/signals'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export interface InputSignalProps
  extends Omit<InputProps, 'value' | 'onChange'> {
  value: Signal<string>
}

const InputSignal = ({ value, ...props }: InputSignalProps) => {
  return (
    <Input
      {...props}
      value={value.value}
      onChange={(e) => {
        value.value = e.target.value
      }}
    />
  )
}
InputSignal.displayName = 'InputSignal'

export { Input, InputSignal }
