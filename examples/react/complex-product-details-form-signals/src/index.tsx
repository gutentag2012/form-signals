import { DateRangePicker } from '@/components/form/DateRangePicker.tsx'
import { FormTextInput } from '@/components/form/FormTextInput.tsx'
import { PriceTable } from '@/components/form/PriceTable.tsx'
import { VariantCreator } from '@/components/form/VariantCreator.tsx'
import { Label } from '@/components/ui/label'
import { TextareaSignal } from '@/components/ui/textarea'
import type { Product } from '@/types.ts'
import { FormDevTools } from '@formsignals/dev-tools-react'
import { useForm, useFormContext } from '@formsignals/form-react'
import {
  type ZodAdapter,
  configureZodAdapter,
} from '@formsignals/validation-adapter-zod'
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
      <h1 className="mb-1 font-extrabold text-4xl tracking-tight">
        Product Configuration
      </h1>
      <p className="mb-6 text-gray-300 text-lg">
        This is an example form with a complex data structure demonstrated on a
        form to update product information.
      </p>

      <form.FormProvider>
        <FormDevTools />
        <form
          className="flex w-full flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <h5 className="font-bold text-lg">General</h5>

          <form.FieldProvider
            name="name"
            defaultValue=""
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

          <h5 className="font-bold text-lg">Prices</h5>
          <PriceTable />

          <h5 className="font-bold text-lg">Variants</h5>
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
