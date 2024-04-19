import { Button, type ButtonProps } from '@/components/ui/button.tsx'
import { Calendar } from '@/components/ui/calendar.tsx'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover.tsx'
import { cn } from '@/lib/utils.ts'
import { type Signal, useComputed } from '@preact/signals-react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'

interface DatePickerProps
  extends Omit<ButtonProps, 'value' | 'onChange' | 'disabled'> {
  value: Signal<Date | undefined>
  disabled?: Signal<boolean>
}

export const DatePicker = ({
  className,
  value,
  disabled,
  ...props
}: DatePickerProps) => {
  const selected = useComputed(() =>
    value.value ? format(value.value, 'PPP') : <span>Pick a date</span>,
  )
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            'justify-start text-left font-normal',
            !value.value && 'text-muted-foreground',
            className,
          )}
          disabled={disabled?.value}
          {...props}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected.value}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value.value}
          onSelect={(newValue) => {
            value.value = newValue
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
