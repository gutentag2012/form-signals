import * as React from 'react'

import { cn } from '@/lib/utils'
import type { Signal } from '@preact/signals-react'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Textarea.displayName = 'Textarea'

export interface TextareaSignalProps
  extends Omit<TextareaProps, 'value' | 'onChange'> {
  value: Signal<string>
}

const TextareaSignal = ({ value, ...props }, ref) => {
  return (
    <Textarea
      value={value.value}
      onChange={(e) => {
        value.value = e.target.value
      }}
      {...props}
    />
  )
}
TextareaSignal.displayName = 'TextareaSignal'

export { Textarea, TextareaSignal }
