import { ErrorText } from '@/components/form/ErrorText.tsx'
import { Button } from '@/components/ui/button.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx'
import type { Product } from '@/types.ts'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
} from 'react-hook-form'
import { z } from 'zod'

const NumberToString = (value: number | null) =>
  value === null ? '' : `${value}`
const StringToNumber = (value: string) => Number.parseFloat(value)

const subFormSchema = z.object({
  count: z
    .number({ invalid_type_error: 'Value must be greater than 0' })
    .min(0, 'Value must be greater than 0'),
  price: z
    .number({ invalid_type_error: 'Value must be greater than 0' })
    .min(0, 'Value must be greater than 0'),
  taxRate: z
    .number()
    .refine(
      (value) => value === 19 || value === 7 || value === 0,
      'Value must be 19, 7 or 0',
    ),
})

export const PriceTable = () => {
  const [selectedCurrency, setSelectedCurrency] = useState<string>('EUR')

  const form = useFormContext<Product>()
  const pricesField = useFieldArray({
    name: `prices.${selectedCurrency}`,
  })

  const subForm = useForm<Product['prices'][string][number]>({
    resolver: zodResolver(subFormSchema),
    defaultValues: {
      count: null as never,
      price: null as never,
      taxRate: 19,
    },
  })

  const currentPrices = form.watch('prices')
  const currencyCountValue = currentPrices
    ? Object.values(currentPrices).filter((prices) => !!prices?.length).length
    : 0
  const currencyCount =
    currencyCountValue === 1 ? '1 currency' : `${currencyCountValue} currencies`

  return (
    <div>
      <Label htmlFor="currency">Currency</Label>
      <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
        <SelectTrigger>
          <SelectValue placeholder="Select a currency" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="EUR">EUR</SelectItem>
          <SelectItem value="USD">USD</SelectItem>
          <SelectItem value="GBP">GBP</SelectItem>
        </SelectContent>
      </Select>

      <Table className="mt-2">
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/3">Min Count</TableHead>
            <TableHead className="w-1/3">Price</TableHead>
            <TableHead className="w-1/3">Tax Rate</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <PriceTableBody selectedCurrency={selectedCurrency} />
          <PriceTableErrorText
            message={form.formState.errors.prices?.message as unknown as string}
          />
        </TableBody>
        <TableFooter>
          <FormProvider {...subForm}>
            <TableRow disableHoverStyle>
              <Controller
                name="count"
                render={(field) => (
                  <TableCell className="align-top">
                    <Label htmlFor={field.field.name}>Min Count</Label>
                    <Input
                      value={NumberToString(field.field.value)}
                      onChange={(e) =>
                        field.field.onChange(StringToNumber(e.target.value))
                      }
                      id={field.field.name}
                      name={field.field.name}
                      type="number"
                      placeholder="Min Count"
                    />
                    <ErrorText message={field.fieldState.error?.message} />
                  </TableCell>
                )}
              />
              <Controller
                name="price"
                render={(field) => (
                  <TableCell className="align-top">
                    <Label htmlFor={field.field.name}>New price</Label>
                    <Input
                      value={NumberToString(field.field.value)}
                      onChange={(e) =>
                        field.field.onChange(StringToNumber(e.target.value))
                      }
                      id={field.field.name}
                      name={field.field.name}
                      type="number"
                      placeholder="New price"
                    />
                    <ErrorText message={field.fieldState.error?.message} />
                  </TableCell>
                )}
              />
              <Controller
                name="taxRate"
                render={(field) => (
                  <TableCell className="align-top">
                    <Label htmlFor={field.field.name}>Tax Rate</Label>
                    <Select
                      name={field.field.name}
                      value={NumberToString(field.field.value)}
                      onValueChange={(value) =>
                        field.field.onChange(StringToNumber(value))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="19">19%</SelectItem>
                        <SelectItem value="7">7%</SelectItem>
                        <SelectItem value="0">0%</SelectItem>
                      </SelectContent>
                    </Select>
                    <ErrorText message={field.fieldState.error?.message} />
                  </TableCell>
                )}
              />

              <TableCell align="right" className="align-top">
                <Button
                  className="mt-5"
                  type="button"
                  variant="outline"
                  disabled={
                    (subForm.formState.submitCount > 1 &&
                      !subForm.formState.isValid) ||
                    subForm.formState.isSubmitting
                  }
                  onClick={subForm.handleSubmit(async (values) => {
                    pricesField.append(values)
                    await form.trigger('prices')
                    subForm.reset(undefined, {
                      keepSubmitCount: false,
                    })
                  })}
                >
                  Add new price
                </Button>
              </TableCell>
            </TableRow>
          </FormProvider>
        </TableFooter>
        <TableCaption>Currently {currencyCount} configured</TableCaption>
      </Table>
    </div>
  )
}

const PriceTableBody = ({ selectedCurrency }: { selectedCurrency: string }) => {
  const form = useFormContext<Product>()

  const selectedPrices = useFieldArray({
    name: `prices.${selectedCurrency}`,
  })
  const priceData = form.watch(`prices.${selectedCurrency}`)
  if (!priceData) return null

  return priceData.map((arrayEntry, index) => (
    <TableRow key={index}>
      <TableCell>{arrayEntry.count}</TableCell>
      <TableCell>€ {arrayEntry.price.toFixed(2)}</TableCell>
      <TableCell>{arrayEntry.taxRate}%</TableCell>
      <TableCell align="right">
        <Button
          type="button"
          variant="destructive"
          onClick={() => {
            selectedPrices.remove(index)
            form.trigger('prices')
          }}
        >
          Delete
        </Button>
      </TableCell>
    </TableRow>
  ))
}

const PriceTableErrorText = ({ message }: { message?: string }) => {
  if (!message) return null
  return (
    <TableRow disableHoverStyle>
      <TableCell colSpan={4}>
        <ErrorText message={message} />
      </TableCell>
    </TableRow>
  )
}
