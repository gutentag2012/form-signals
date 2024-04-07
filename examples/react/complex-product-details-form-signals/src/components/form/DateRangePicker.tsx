import { ErrorText } from '@/components/form/ErrorText.tsx'
import { DatePicker } from '@/components/ui/DatePicker.tsx'
import { Label } from '@/components/ui/label.tsx'
import type { Product } from '@/types.ts'
import { useFormContext } from '@formsignals/form-react'
import type { ZodAdapter } from '@formsignals/validation-adapter-zod'
import { z } from 'zod'

export const DateRangePicker = () => {
  const form = useFormContext<Product, typeof ZodAdapter>()

  return (
    <div className="flex flex-row gap-2">
      <form.FieldProvider name="validRange.0" validator={z.date()}>
        {(field) => (
          <div className="flex flex-1 flex-col gap-1">
            <Label htmlFor={field.name}>Valid from</Label>
            <DatePicker
              id={field.name}
              variant="outline"
              value={field.data}
              onBlur={() => field.handleBlur()}
            />
            <ErrorText />
          </div>
        )}
      </form.FieldProvider>
      <form.FieldProvider
        name="validRange.1"
        validator={z
          .tuple([z.date(), z.date().optional()])
          .refine(
            (dates) => (dates[0] && dates[1] ? dates[0] > dates[1] : true),
            'End date must be after start date',
          )}
        validateMixin={['validRange.0']}
      >
        {(field) => (
          <div className="flex flex-1 flex-col gap-1">
            <Label htmlFor={field.name}>Valid until</Label>
            <DatePicker
              id={field.name}
              variant="outline"
              value={field.data}
              onBlur={() => field.handleBlur()}
            />
            <ErrorText />
          </div>
        )}
      </form.FieldProvider>
    </div>
  )
}
