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
import { useState } from 'react'

interface DatePickerProps extends Omit<ButtonProps, 'value' | 'onChange'> {
  value?: Date
  onChange?: (date: Date | undefined) => void
}

export const DatePicker = ({
  className,
  value,
  onChange,
  ...props
}: DatePickerProps) => {
  const [date, setDate] = useState<Date | undefined>(value)
  const realValue = value ?? date

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            'justify-start text-left font-normal',
            !realValue && 'text-muted-foreground',
            className,
          )}
          {...props}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {realValue ? format(realValue, 'PPP') : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={realValue}
          onSelect={onChange ?? setDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
