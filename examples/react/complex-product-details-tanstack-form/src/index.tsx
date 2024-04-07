import { DateRangePicker } from '@/components/form/DateRangePicker.tsx'
import { FormTextInput } from '@/components/form/FormTextInput.tsx'
import { PriceTable } from '@/components/form/PriceTable.tsx'
import { VariantCreator } from '@/components/form/VariantCreator.tsx'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea.tsx'
import type { Product } from '@/types.ts'
import { type FormApi, useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { createRoot } from 'react-dom/client'
import { z } from 'zod'
import { Button } from './components/ui/button'
import './index.css'

export const Index = () => {
  const form = useForm<Product, typeof zodValidator>({
    validatorAdapter: zodValidator,
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

      <form
        className="flex w-full flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
      >
        <h5 className="font-bold text-lg">General</h5>

        <form.Field
          name="name"
          validators={{
            onChange: z
              .string()
              .min(5, 'Value must be longer than 5 characters'),
          }}
        >
          {(field) => (
            <FormTextInput label="Name" maxLength={45} field={field} />
          )}
        </form.Field>

        <form.Field name="description">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>Description</Label>
              <Textarea
                id={field.name}
                name={field.name}
                placeholder="Description"
                rows={4}
                onBlur={field.handleBlur}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </div>
          )}
        </form.Field>

        <DateRangePicker form={form} />

        <h5 className="font-bold text-lg">Prices</h5>
        <PriceTable form={form} />

        <h5 className="font-bold text-lg">Variants</h5>
        <VariantCreator form={form} />

        <SubmitButton form={form} />
      </form>
    </main>
  )
}

const SubmitButton = ({ form }: { form: FormApi<any, any> }) => {
  return (
    <>
      <pre>
        {JSON.stringify(
          {
            canSubmit: form.state.canSubmit,
            isSubmitting: form.state.isSubmitting,
            isValid: form.state.isValid,
            isDirty: form.state.isDirty,
            isTouched: form.state.isTouched,
            errors: form.state.errors,
            errorMap: form.state.errorMap,
            fieldErrorMaps: form.state.fieldMeta,
          },
          null,
          2,
        )}
      </pre>
      <Button
        className="mt-2 max-w-[280px]"
        type="submit"
        disabled={!form.state.canSubmit}
      >
        Save configuration
      </Button>
    </>
  )
}

// biome-ignore lint/style/noNonNullAssertion: <explanation>
const rootElement = document.getElementById('root')!

createRoot(rootElement).render(<Index />)
