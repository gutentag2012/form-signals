import { Button, type ButtonProps } from '@/components/ui/button.tsx'
import { Calendar } from '@/components/ui/calendar.tsx'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover.tsx'
import { cn } from '@/lib/utils.ts'
import type { Signal } from '@preact/signals-react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'

interface DatePickerProps extends Omit<ButtonProps, 'value' | 'onChange'> {
  value: Signal<Date | undefined>
}

export const DatePicker = ({ className, value, ...props }: DatePickerProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            'justify-start text-left font-normal',
            !value?.value && 'text-muted-foreground',
            className,
          )}
          {...props}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value?.value ? (
            format(value?.value, 'PPP')
          ) : (
            <span>Pick a date</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value?.value}
          onSelect={(newValue) => {
            value.value = newValue
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
