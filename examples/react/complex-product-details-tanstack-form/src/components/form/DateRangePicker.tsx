import { ErrorText } from '@/components/form/ErrorText.tsx'
import { DatePicker } from '@/components/ui/DatePicker.tsx'
import { Label } from '@/components/ui/label.tsx'
import type { Product } from '@/types.ts'
import type { ReactFormApi } from '@tanstack/react-form'
import type { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'

export const DateRangePicker = ({
  form,
}: { form: ReactFormApi<Product, ReturnType<typeof zodValidator>> }) => {
  return (
    <div className="flex flex-row gap-2">
      <form.Field
        name="validRange[0]"
        validators={{
          onChange: z.date(),
        }}
      >
        {(field) => (
          <div className="flex flex-1 flex-col gap-1">
            <Label htmlFor={field.name}>Valid from</Label>
            <DatePicker
              id={field.name}
              variant="outline"
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={() => field.handleBlur()}
            />
            <ErrorText field={field} />
          </div>
        )}
      </form.Field>
      <form.Field
        name="validRange[1]"
        validators={{
          onChangeListenTo: ['validRange[0]'],
          onChange: ({ value, fieldApi }) => {
            const startDate = fieldApi.form.getFieldValue('validRange[0]')
            if (value && startDate && value < startDate) {
              return 'End date must be after start date'
            }
            return undefined
          },
        }}
      >
        {(field) => (
          <div className="flex flex-1 flex-col gap-1">
            <Label htmlFor={field.name}>Valid until</Label>
            <DatePicker
              id={field.name}
              variant="outline"
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={() => field.handleBlur()}
            />
            <ErrorText field={field} />
          </div>
        )}
      </form.Field>
    </div>
  )
}
