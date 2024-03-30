import { ErrorText } from '@/components/form/ErrorText.tsx'
import { DatePicker } from '@/components/ui/DatePicker.tsx'
import { Label } from '@/components/ui/label.tsx'
import type { Product } from '@/types.ts'
import { Controller, useFormContext } from 'react-hook-form'

export const DateRangePicker = () => {
  const form = useFormContext<Product>()
  return (
    <div className="flex flex-row gap-2">
      <Controller
        name="validRange.0"
        render={(field) => (
          <div className="flex flex-col gap-1 flex-1">
            <Label htmlFor="validRange.0">Valid from</Label>
            <DatePicker
              id="validRange.0"
              name={field.field.name}
              variant="outline"
              value={field.field.value}
              onBlur={() => field.field.onBlur()}
              onChange={(date) => {
                field.field.onChange(date)
                return form.trigger('validRange')
              }}
            />
            <ErrorText message={field.fieldState.error?.message} />
          </div>
        )}
      />

      <Controller
        name="validRange.1"
        render={(field) => (
          <div className="flex flex-col gap-1 flex-1">
            <Label htmlFor={field.field.name}>Valid from</Label>
            <DatePicker
              id={field.field.name}
              name={field.field.name}
              variant="outline"
              value={field.field.value}
              onBlur={() => field.field.onBlur()}
              onChange={(date) => {
                field.field.onChange(date)
                return form.trigger('validRange')
              }}
            />
            <ErrorText
              message={
                field.fieldState.error?.message ??
                form.formState.errors?.validRange?.message
              }
            />
          </div>
        )}
      />
    </div>
  )
}
