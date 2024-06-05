import { ErrorText } from '@/components/form/ErrorText.tsx'
import { Button } from '@/components/ui/button.tsx'
import { InputSignal } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import {
  SelectContent,
  SelectItem,
  SelectSignal,
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
import {
  type ValidationError,
  useFieldContext,
  useForm,
  useFormContext,
} from '@formsignals/form-react'
import { ZodAdapter } from '@formsignals/validation-adapter-zod'
import { useComputed, useSignal } from '@preact/signals-react'
import { z } from 'zod'

const NumberToString = (
  value: number | null,
  isValid: boolean,
  buffer?: string,
) => (!isValid ? buffer ?? '' : value === null ? '' : `${value}`)

const numberRegex = /^-?\d+([,.]\d+)?$/
const StringToNumber = (value: string): number | [number, ValidationError] => {
  if (!value) return null as never

  const number = Number.parseFloat(value.replace(',', '.'))
  const isNumber = numberRegex.test(value)
  return [number, !isNumber && 'Value is not a number']
}
const NumberSchema = z
  .number({ invalid_type_error: 'Value must be greater than 0' })
  .min(0, 'Value must be greater than 0')
const TaxRateSchema = z
  .number()
  .refine(
    (value) => value === 19 || value === 7 || value === 0,
    'Value must be 19, 7 or 0',
  )
export const PriceTable = () => {
  const selectedCurrency = useSignal('EUR')
  const form = useFormContext<Product, typeof ZodAdapter>()

  const subForm = useForm<Product['prices'][string][number], typeof ZodAdapter>(
    {
      validatorAdapter: ZodAdapter,
      defaultValues: {
        count: null as never,
        price: null as never,
        taxRate: 19,
      },
      onSubmit: (values) => {
        form.pushValueToArray(`prices.${selectedCurrency.peek()}`, values)
        subForm.reset()
      },
    },
  )

  const currencyCount = useComputed(() => {
    const count = Object.values(form.data.peek().prices.value).filter(
      (prices) => !!prices?.value?.length,
    ).length

    if (count === 1) return '1 currency'
    return `${count} currencies`
  })

  return (
    <div>
      <Label htmlFor="currency">Currency</Label>
      <SelectSignal value={selectedCurrency}>
        <SelectTrigger>
          <SelectValue placeholder="Select a currency" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="EUR">EUR</SelectItem>
          <SelectItem value="USD">USD</SelectItem>
          <SelectItem value="GBP">GBP</SelectItem>
        </SelectContent>
      </SelectSignal>

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
          <form.FieldProvider
            name={`prices.${selectedCurrency.value}`}
            defaultValue={[]}
          >
            <PriceTableBody />
          </form.FieldProvider>
          <form.FieldProvider
            name="prices"
            validator={z
              .record(z.string(), z.array(z.any()))
              .refine(
                (value) =>
                  Object.values(value).some((prices) => prices.length > 0),
                'At least one price for one currency is required',
              )}
            validateOnNestedChange
          >
            <PriceTableErrorText />
          </form.FieldProvider>
        </TableBody>
        <TableFooter>
          <subForm.FormProvider>
            <TableRow disableHoverStyle onKeyDown={subForm.handleSubmitOnEnter}>
              <TableCell className="align-top">
                <subForm.FieldProvider
                  name="count"
                  validator={NumberSchema}
                  transformToBinding={NumberToString}
                  transformFromBinding={StringToNumber}
                >
                  {(field) => (
                    <>
                      <Label htmlFor={field.name}>Min Count</Label>
                      <InputSignal
                        value={field.transformedData}
                        id={field.name}
                        name={field.name}
                        type="text" // This is deliberate to show the error message for the transformation
                        placeholder="Min Count"
                      />
                      <ErrorText />
                    </>
                  )}
                </subForm.FieldProvider>
              </TableCell>
              <TableCell className="align-top">
                <subForm.FieldProvider
                  name="price"
                  validator={NumberSchema}
                  transformToBinding={NumberToString}
                  transformFromBinding={StringToNumber}
                >
                  {(field) => (
                    <>
                      <Label htmlFor={field.name}>New price</Label>
                      <InputSignal
                        value={field.transformedData}
                        id={field.name}
                        name={field.name}
                        type="number"
                        placeholder="Price"
                      />
                      <ErrorText />
                    </>
                  )}
                </subForm.FieldProvider>
              </TableCell>
              <TableCell className="align-top">
                <subForm.FieldProvider
                  name="taxRate"
                  validator={TaxRateSchema}
                  transformToBinding={NumberToString}
                  transformFromBinding={StringToNumber}
                >
                  {(field) => (
                    <>
                      <Label htmlFor={field.name}>Tax Rate</Label>
                      <SelectSignal
                        name={field.name}
                        value={field.transformedData}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="19">19%</SelectItem>
                          <SelectItem value="7">7%</SelectItem>
                          <SelectItem value="0">0%</SelectItem>
                        </SelectContent>
                      </SelectSignal>
                      <ErrorText />
                    </>
                  )}
                </subForm.FieldProvider>
              </TableCell>

              <TableCell align="right" className="align-top">
                <Button
                  className="mt-5"
                  type="button"
                  variant="outline"
                  disabled={!subForm.canSubmit.value}
                  onClick={() => subForm.handleSubmit()}
                >
                  Add new price
                </Button>
              </TableCell>
            </TableRow>
          </subForm.FormProvider>
        </TableFooter>
        <TableCaption>Currently {currencyCount} configured</TableCaption>
      </Table>
    </div>
  )
}

/**
 * @useSignals
 */
const PriceTableBody = () => {
  const field = useFieldContext<Product, `prices.${string}`>()
  if (!field.data.value) return null
  return field.data.value.map((arrayEntry, index) => (
    <TableRow key={arrayEntry.key}>
      <TableCell>{arrayEntry.data.value.count}</TableCell>
      <TableCell>€ {arrayEntry.data.value.price.value.toFixed(2)}</TableCell>
      <TableCell>{arrayEntry.data.value.taxRate}%</TableCell>
      <TableCell align="right">
        <Button
          type="button"
          variant="destructive"
          onClick={() => field.removeValueFromArray(index)}
        >
          Delete
        </Button>
      </TableCell>
    </TableRow>
  ))
}

/**
 * @useSignals
 */
const PriceTableErrorText = () => {
  const field = useFieldContext()
  if (field.isValid.value) return null
  return (
    <TableRow disableHoverStyle>
      <TableCell colSpan={4}>
        <ErrorText />
      </TableCell>
    </TableRow>
  )
}
