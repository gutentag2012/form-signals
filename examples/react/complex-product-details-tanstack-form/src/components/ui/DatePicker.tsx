import { Button, type ButtonProps } from '@/components/ui/button.tsx'
import { Calendar } from '@/components/ui/calendar.tsx'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover.tsx'
import { cn } from '@/lib/utils.ts'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'

interface DatePickerProps extends Omit<ButtonProps, 'value' | 'onChange'> {
  value: Date | undefined
  onChange: (value: Date | undefined) => void
}

export const DatePicker = ({
  className,
  value,
  onChange,
  ...props
}: DatePickerProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            'justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className,
          )}
          {...props}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, 'PPP') : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
