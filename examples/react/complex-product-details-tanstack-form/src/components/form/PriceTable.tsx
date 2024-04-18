import { ErrorText } from '@/components/form/ErrorText.tsx'
import { Button } from '@/components/ui/button.tsx'
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
import {
  type FieldApi,
  type FormApi,
  type FormState,
  useForm,
} from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { useState } from 'react'
import { z } from 'zod'
import { Input } from '../ui/input'

const NumberToString = (value: number | null) =>
  value === null ? '' : `${value}`
const StringToNumber = (value: string) => Number.parseFloat(value)
const NumberSchema = z
  .number({ invalid_type_error: 'Value must be greater than 0' })
  .min(0, 'Value must be greater than 0')
const TaxRateSchema = z
  .number()
  .refine(
    (value) => value === 19 || value === 7 || value === 0,
    'Value must be 19, 7 or 0',
  )

const supportedCurrencies = ['EUR', 'USD', 'GBP']
export const PriceTable = ({
  form,
}: { form: FormApi<Product, typeof zodValidator> }) => {
  const [selectedCurrency, setSelectedCurrency] = useState('EUR')

  const pricesField = form.useField({
    name: 'prices',
    defaultMeta: { isTouched: true },
    validators: {
      onChange: ({ value }) =>
        value &&
        Object.values(value).some((prices) => prices.length === 0) &&
        'At least one price for one currency is required',
    },
  })
  const subForm = useForm<
    Product['prices'][string][number],
    typeof zodValidator
  >({
    validatorAdapter: zodValidator,
    defaultValues: {
      count: null as never,
      price: null as never,
      taxRate: 19,
    },
    onSubmit: (values) => {
      form.pushFieldValue(`prices.${selectedCurrency}`, values.value, {
        touch: true,
      })
      pricesField.validate('change')
      subForm.reset()
    },
  })

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
          {supportedCurrencies
            .filter((currency) => currency === selectedCurrency)
            .map((currency) => (
              <form.Field
                key={`prices.${currency}`}
                name={`prices.${currency}`}
                // Cannot use defaultValue={[]} here, since that would set the value to [] every time it mounts again
                preserveValue
              >
                {(field) => (
                  <PriceTableBody field={field} pricesField={pricesField} />
                )}
              </form.Field>
            ))}
          <PriceTableErrorText field={pricesField} />
        </TableBody>
        <TableFooter>
          <TableRow disableHoverStyle>
            <TableCell className="align-top">
              <subForm.Field
                name="count"
                validators={{ onChange: NumberSchema }}
              >
                {(field) => (
                  <>
                    <Label htmlFor={field.name}>Min Count</Label>
                    <Input
                      value={NumberToString(field.state.value)}
                      onChange={(e) =>
                        field.handleChange(StringToNumber(e.target.value))
                      }
                      id={field.name}
                      name={field.name}
                      type="number"
                      placeholder="Min Count"
                    />
                    <ErrorText field={field} />
                  </>
                )}
              </subForm.Field>
            </TableCell>
            <TableCell className="align-top">
              <subForm.Field
                name="price"
                validators={{ onChange: NumberSchema }}
              >
                {(field) => (
                  <>
                    <Label htmlFor={field.name}>New price</Label>
                    <Input
                      value={NumberToString(field.state.value)}
                      onChange={(e) =>
                        field.handleChange(StringToNumber(e.target.value))
                      }
                      id={field.name}
                      name={field.name}
                      type="number"
                      placeholder="Price"
                    />
                    <ErrorText field={field} />
                  </>
                )}
              </subForm.Field>
            </TableCell>
            <TableCell className="align-top">
              <subForm.Field
                name="taxRate"
                validators={{ onChange: TaxRateSchema }}
              >
                {(field) => (
                  <>
                    <Label htmlFor={field.name}>Tax Rate</Label>
                    <Select
                      name={field.name}
                      value={NumberToString(field.state.value)}
                      onValueChange={(value) =>
                        field.handleChange(StringToNumber(value))
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
                    <ErrorText field={field} />
                  </>
                )}
              </subForm.Field>
            </TableCell>

            <TableCell align="right" className="align-top">
              <Button
                className="mt-5"
                type="button"
                variant="outline"
                disabled={!subForm.state.canSubmit}
                onClick={() => subForm.handleSubmit()}
              >
                Add new price
              </Button>
            </TableCell>
          </TableRow>
        </TableFooter>
        <form.Subscribe
          selector={(state: FormState<Product>): [Product['prices']] => [
            state.values.prices,
          ]}
        >
          {([prices]) => {
            if (!prices)
              return (
                <TableCaption>Currently 0 currencies configured</TableCaption>
              )
            const count = Object.values(prices).filter(
              (prices) => !!prices?.length,
            ).length

            const currencyCount =
              count === 1 ? '1 currency' : `${count} currencies`
            return (
              <TableCaption>Currently {currencyCount} configured</TableCaption>
            )
          }}
        </form.Subscribe>
      </Table>
    </div>
  )
}

const PriceTableBody = ({
  field,
  pricesField,
}: {
  field: FieldApi<Product, `prices.${string}`, undefined, typeof zodValidator>
  pricesField: FieldApi<Product, `prices`, undefined, typeof zodValidator>
}) => {
  if (!field.state.value) return null
  return field.state.value.map((arrayEntry, index) => (
    <TableRow key={index}>
      <TableCell>{arrayEntry.count}</TableCell>
      <TableCell>€ {arrayEntry.price.toFixed(2)}</TableCell>
      <TableCell>{arrayEntry.taxRate}%</TableCell>
      <TableCell align="right">
        <Button
          type="button"
          variant="destructive"
          onClick={() => {
            field.removeValue(index)
            pricesField.validate('change')
          }}
        >
          Delete
        </Button>
      </TableCell>
    </TableRow>
  ))
}

const PriceTableErrorText = ({
  field,
}: { field: FieldApi<Product, any, undefined, typeof zodValidator> }) => {
  if (!field.state.meta.errors.length) return null
  return (
    <TableRow disableHoverStyle>
      <TableCell colSpan={4}>
        <ErrorText field={field} />
      </TableCell>
    </TableRow>
  )
}
