import { DateRangePicker } from '@/components/form/DateRangePicker.tsx'
import { FormTextInput } from '@/components/form/FormTextInput.tsx'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea.tsx'
import { zodResolver } from '@hookform/resolvers/zod'
import { createRoot } from 'react-dom/client'
import { FormProvider, useForm, useFormContext } from 'react-hook-form'
import { z } from 'zod'
import { Button } from './components/ui/button'
import './index.css'
import {PriceTable} from "@/components/form/PriceTable.tsx";
import {VariantCreator} from "@/components/form/VariantCreator.tsx";
import {useEffect} from "react";

const formSchema = z.object({
  name: z.string().min(5, 'Value must be longer than 5 characters'),
  description: z.string().optional(),
  validRange: z
    .tuple([z.date(), z.date()])
    .refine(
      (dates) => (dates[0] && dates[1] ? dates[0] < dates[1] : true),
      'End date must be after start date',
    ),
  prices: z
    .record(z.string(), z.array(z.object({
      count: z.number().min(0, 'Value must be greater than 0'),
      price: z.number().min(0, 'Value must be greater than 0'),
      taxRate: z.number().refine(
        (value) => value === 19 || value === 7 || value === 0,
        'Value must be 19, 7 or 0',
      ),
    })))
    .refine(
      (value) =>
        Object.values(value).some((prices) => prices.length > 0),
      'At least one price for one currency is required',
    ),
  variants: z.array(
    z.object({
      name: z.string().min(1, 'Name is required'),
      options: z.array(z.string())
        .min(1, 'At least one option is required'),
    }),
  ).refine(value => !value.some(
      (variant, index, array) =>
        index !== array.findIndex((v) => v.name === variant.name),
    ), "Variants must be unique."),
}).refine(value => {
  // Due to limitations of zod, this can only be run if the other checks within the object are successful
  if(!value.name.includes("base")) return false
  return value.variants.length > 0
}, {
  message: "Base variant must have at least one variant.",
  path: ['variants']
})

export const Index = () => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
  })

  const name = form.watch('name')
  useEffect(() => {
    form.trigger("")
  }, [name, form.trigger]);

  return (
    <main className="container mt-3">
      <h1 className="text-4xl font-extrabold tracking-tight mb-1">
        Product Configuration
      </h1>
      <p className="text-lg text-gray-300 mb-6">
        This is an example form with a complex data structure demonstrated on a
        form to update product information.
      </p>

      <FormProvider {...form}>
        <form
          className="flex flex-col gap-4 w-full"
          onSubmit={form.handleSubmit((values) => {
            window.alert(
              `Form submitted with values\n${JSON.stringify(values, null, 2)}`,
            )
          })}
        >
          <h5 className="text-lg font-bold">General</h5>

          <FormTextInput name="name" label="Name" maxLength={45} />

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Description"
              rows={4}
              {...form.register('description')}
            />
          </div>

          <DateRangePicker />

          <h5 className="text-lg font-bold">Prices</h5>
          <PriceTable />

          <h5 className="text-lg font-bold">Variants</h5>
          <VariantCreator />

          <SubmitButton />
        </form>
      </FormProvider>
    </main>
  )
}

const SubmitButton = () => {
  const form = useFormContext()
  return (
    <Button
      className="mt-2 max-w-[280px]"
      type="submit"
      disabled={(form.formState.submitCount > 1 && !form.formState.isValid) || form.formState.isSubmitting}
    >
      Save configuration
    </Button>
  )
}

// biome-ignore lint/style/noNonNullAssertion: <explanation>
const rootElement = document.getElementById('root')!

createRoot(rootElement).render(<Index />)
