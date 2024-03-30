import { DateRangePicker } from '@/components/form/DateRangePicker.tsx'
import { FormTextInput } from '@/components/form/FormTextInput.tsx'
import { PriceTable } from '@/components/form/PriceTable.tsx'
import { VariantCreator } from '@/components/form/VariantCreator.tsx'
import { Label } from '@/components/ui/label'
import { TextareaSignal } from '@/components/ui/textarea'
import type { Product } from '@/types.ts'
import { useForm, useFormContext } from '@form-signals/form-react'
import {
  type ZodAdapter,
  configureZodAdapter,
} from '@form-signals/validation-adapter-zod'
import { createRoot } from 'react-dom/client'
import { z } from 'zod'
import { Button } from './components/ui/button'
import './index.css'

export const Index = () => {
  const form = useForm<Product, typeof ZodAdapter>({
    validatorAdapter: configureZodAdapter({ takeFirstError: true }),
    onSubmit: (values) => {
      window.alert(
        `Form submitted with values\n${JSON.stringify(values, null, 2)}`,
      )
    },
  })

  return (
    <main className="container mt-3">
      <h1 className="text-4xl font-extrabold tracking-tight mb-1">
        Product Configuration
      </h1>
      <p className="text-lg text-gray-300 mb-6">
        This is an example form with a complex data structure demonstrated on a
        form to update product information.
      </p>

      <form.FormProvider>
        <form
          className="flex flex-col gap-4 w-full"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <h5 className="text-lg font-bold">General</h5>

          <form.FieldProvider
            name="name"
            validator={z
              .string()
              .min(5, 'Value must be longer than 5 characters')}
            validatorOptions={{ validateOnChangeIfTouched: true }}
          >
            <FormTextInput label="Name" maxLength={45} />
          </form.FieldProvider>

          <form.FieldProvider name="description">
            {(field) => (
              <div>
                <Label htmlFor={field.name}>Description</Label>
                <TextareaSignal
                  id={field.name}
                  name={field.name}
                  placeholder="Description"
                  rows={4}
                  onBlur={field.handleBlur}
                  value={field.data}
                />
              </div>
            )}
          </form.FieldProvider>

          <DateRangePicker />

          <h5 className="text-lg font-bold">Prices</h5>
          <PriceTable />

          <h5 className="text-lg font-bold">Variants</h5>
          <VariantCreator />

          <SubmitButton />
        </form>
      </form.FormProvider>
    </main>
  )
}

const SubmitButton = () => {
  const form = useFormContext()
  return (
    <Button
      className="mt-2 max-w-[280px]"
      type="submit"
      disabled={!form.canSubmit.value}
    >
      Save configuration
    </Button>
  )
}

// biome-ignore lint/style/noNonNullAssertion: <explanation>
const rootElement = document.getElementById('root')!

createRoot(rootElement).render(<Index />)
