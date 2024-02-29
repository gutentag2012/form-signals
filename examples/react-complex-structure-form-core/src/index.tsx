import { DatePicker } from '@/components/DatePicker.tsx'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible.tsx'
import { Input, InputSignal } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSignal,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TextareaSignal } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { Product } from '@/types.ts'
import {
  FieldLogic,
  type FieldLogicOptions,
  FormLogic,
  type Paths,
  type ValueAtPath,
} from '@form-signals/form-core'
import { type Signal, useSignal, useSignalEffect } from '@preact/signals-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { z } from 'zod'
import { Button } from './components/ui/button'
import './index.css'

const emptyDefaultValues = {
  name: '',
  description: '',
  validRange: [undefined, undefined],
  prices: {},
  variants: [],
} satisfies Product

// TODO Typesafety is not where I want/need it
const form = new FormLogic<Product>({
  defaultValues: emptyDefaultValues,
  onSubmit: (values) => {
    console.log('submit', values)
  },
})
const subForm = new FormLogic<Product['prices'][string][number]>({
  defaultValues: {
    taxRate: 19,
  },
  onSubmit: (values) => {
    console.log('submit sub form', values)
  },
})

// TODO Fix stuff currently noted
// TODO Add react bindings before doing more

export const Index = () => {
  const selectedCurrency = useSignal('EUR')
  const selectedVariant = useSignal(0)

  const justAddedOption = useSignal(false)

  return (
    <main className="container mt-3">
      <h1 className="text-4xl font-extrabold tracking-tight mb-1">
        Product Configuration
      </h1>
      <p className="text-lg text-gray-300 mb-6">
        This is an example form with a complex data structure demonstrated on a
        form to update product information.
      </p>

      <form
        className="flex flex-col gap-4 w-full"
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          void form.handleSubmit()
        }}
      >
        <h5 className="text-lg font-bold">General</h5>

        <FormField
          name="name"
          validators={[
            {
              validate: (value) =>
                value.length <= 5 && 'Value must be longer than 5 characters',
              onChange: true,
              onBlur: true,
            },
          ]}
        >
          {(field) => (
            <FormTextInput label="Name" maxLength={45} field={field} />
          )}
        </FormField>

        <FormField name="description">
          {(field) => (
            <div>
              <Label>Description</Label>
              <TextareaSignal
                id={field.name}
                name={field.name}
                placeholder="Description"
                rows={4}
                onBlur={() => field.handleBlur()}
                value={field.signal}
              />
            </div>
          )}
        </FormField>

        <div className="flex flex-row gap-2">
          {/*TODO Allow parent field + allow to subscribe to child values*/}
          <FormField
            name="validRange.0"
            validators={[
              {
                validate: (value) => {
                  if (value === undefined) return 'Value is required'
                  return undefined
                },
                onChange: true,
                onBlur: true,
              },
            ]}
          >
            {(field) => (
              <div className="flex flex-col gap-1 flex-1">
                <Label htmlFor={field.name}>Valid from</Label>
                <DatePicker
                  id={field.name}
                  variant="outline"
                  value={field.signal}
                  onBlur={() => field.handleBlur()}
                />
                <ErrorText errors={field.errors} />
              </div>
            )}
          </FormField>
          <FormField
            name="validRange.1"
            validators={[
              {
                validate: (value) => {
                  if (value === undefined) return 'Value is required'
                  return undefined
                },
                onChange: true,
                onBlur: true,
              },
            ]}
          >
            {(field) => (
              <div className="flex flex-col gap-1 flex-1">
                <Label htmlFor={field.name}>Valid until</Label>
                <DatePicker
                  id={field.name}
                  variant="outline"
                  value={field.signal}
                  onBlur={() => field.handleBlur()}
                />
                <ErrorText errors={field.errors} />
              </div>
            )}
          </FormField>
        </div>

        <h5 className="text-lg font-bold">Prices</h5>

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
              {/* TODO Validate rising count */}
              <FormField
                name={`prices.${selectedCurrency.value}`}
                preserveValueOnUnmount
                defaultValue={
                  selectedCurrency.value === 'EUR'
                    ? [{ count: 1, price: 20, taxRate: 19 }]
                    : []
                }
                validators={[
                  {
                    validate: (value) => {
                      if (!value?.length)
                        return 'At least one price is required'
                      return undefined
                    },
                    onChange: true,
                    onMount: true,
                  },
                ]}
              >
                {(field) => (
                  <>
                    <PriceTableBody field={field} />
                    <PriceTableErrorText errors={field.errors} />
                  </>
                )}
              </FormField>
            </TableBody>
            <TableFooter>
              <TableRow disableHoverStyle>
                <TableCell className="align-top">
                  <FormField name="minCount">
                    {(field) => (
                      <InputSignal
                        value={field.signal}
                        id={field.name}
                        name={field.name}
                        type="number"
                        placeholder="Min Count"
                      />
                    )}
                  </FormField>
                  <Label htmlFor="new-min-count">Min Count</Label>
                  <Input
                    id="new-min-count"
                    name="new-min-count"
                    type="number"
                    placeholder="Min Count"
                  />
                  {false && (
                    <p className="text-[0.8rem] font-medium text-destructive">
                      {'field.state.meta.errors'}
                    </p>
                  )}
                </TableCell>
                <TableCell className="align-top">
                  <Label htmlFor="new-price">New price</Label>
                  <Input
                    id="new-price"
                    name="new-price"
                    type="number"
                    placeholder="Price"
                  />
                  {false && (
                    <p className="text-[0.8rem] font-medium text-destructive">
                      {'field.state.meta.errors'}
                    </p>
                  )}
                </TableCell>
                <TableCell className="align-top">
                  <Label htmlFor="new-tax-rate">Tax Rate</Label>
                  <Select defaultValue="19">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="19">19%</SelectItem>
                      <SelectItem value="7">7%</SelectItem>
                      <SelectItem value="0">0%</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>

                <TableCell align="right" className="align-top">
                  <Button className="mt-5" type="button" variant="outline">
                    Add new price
                  </Button>
                </TableCell>
              </TableRow>
            </TableFooter>
            <TableCaption>Currently {0} currencies configured</TableCaption>
          </Table>
        </div>

        <h5 className="text-lg font-bold">Variants</h5>

        <Tabs
          value={selectedVariant.toString()}
          onValueChange={(value) => setSelectedVariant(+value)}
        >
          <TabsList>
            {emptyDefaultValues.variants?.map(({ name }, index) => (
              <TabsTrigger key={index} value={`${index}`}>
                {name || '...'}
              </TabsTrigger>
            ))}
            <TabsTrigger value={'new'}>+</TabsTrigger>
          </TabsList>
          {emptyDefaultValues.variants?.map((_, index) => (
            <TabsContent key={index} value={`${index}`}>
              <div>
                <Label>Name</Label>
                <div className="flex flex-row gap-2">
                  <Input type="text" placeholder="Name" />
                  <Button type="button" variant="destructive">
                    Remove
                  </Button>
                </div>
                {false && (
                  <p className="text-[0.8rem] font-medium text-destructive">
                    {'field.state.meta.errors'}
                  </p>
                )}
              </div>
              <div className="mt-2">
                <Label htmlFor={`variant-${index}-options`}>Options</Label>
                <div className="flex flex-col gap-1">
                  {([] as string[])?.map((_, optionIndex) => (
                    <Input
                      type="text"
                      placeholder="Option"
                      autoFocus={justAddedOption.current && optionIndex === 1}
                    />
                  ))}
                  <Input
                    id={`variant-${index}-option-new`}
                    name={`variant-${index}-option-new`}
                    type="text"
                    placeholder="Option"
                  />
                  {false && (
                    <p className="text-[0.8rem] font-medium text-destructive">
                      {'optionField.state.meta.errors'}
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <Button
          className="mt-2 max-w-[280px]"
          type="submit"
          disabled={form.canSubmit.value}
        >
          Save configuration
        </Button>
      </form>

      <Card className="mt-3">
        <CardHeader>
          <CardTitle>Form stats</CardTitle>
          <CardDescription>
            This shows the current values from within the form for debugging
            purposes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Collapsible>
            <CollapsibleTrigger>
              <Button variant="secondary" type="button">
                + Show values
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <FormString />
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
        <CardFooter className="flex flex-row gap-2">
          <Button variant="outline" onClick={() => form.validate('submit')}>
            Force Validate Form
          </Button>
          <Button
            variant="outline"
            onClick={() => form.validateAllFields('submit')}
          >
            Force Validate Fields
          </Button>
          <Button variant="destructive" onClick={() => form.reset()}>
            Reset
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}

/**
 * TODO Figure out why this needs the useSignals annotation for the babel transformer to work
 * @useSignals
 */
const PriceTableBody = ({
  field,
}: { field: FieldLogic<Product, `prices.${string}`> }) => {
  return field.signal.value?.map((arrayEntry, index) => (
    <TableRow key={arrayEntry.key}>
      {/* TODO This might not be so nice to deal with (being forced to use nested signals) */}
      <TableCell>{arrayEntry.signal.value.count.value}</TableCell>
      <TableCell>€ {arrayEntry.signal.value.price.value.toFixed(2)}</TableCell>
      <TableCell>{arrayEntry.signal.value.taxRate.value}%</TableCell>
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

const PriceTableErrorText = ({ errors }: { errors: Signal<Array<string>> }) => {
  if (!errors.value.length) return null
  return (
    <TableRow disableHoverStyle>
      <TableCell colSpan={4}>
        <ErrorText errors={errors} />
      </TableCell>
    </TableRow>
  )
}

type FormFieldProps<TName extends Paths<Product>> = {
  name: TName
  children: (field: FieldLogic<ValueAtPath<Product, TName>, TName>) => ReactNode
} & FieldLogicOptions<Product, TName>

const useEqualityMemorizedValue = (newValue: unknown) => {
  const [value, setValue] = useState(newValue)

  useEffect(() => {
    const newValueString = JSON.stringify(newValue)
    const valueString = JSON.stringify(value)

    if (newValueString === valueString) {
      return
    }

    setValue(newValue)
  }, [newValue, value])

  return value
}

const FormField = <TName extends Paths<Product>>({
  name,
  children,
  ...options
}: FormFieldProps<TName>) => {
  const memoName = useEqualityMemorizedValue(name)
  const memoOptions = useEqualityMemorizedValue(options)
  const [field, setField] = useState<FieldLogic<Product, TName>>()

  useEffect(() => {
    const fieldFromForm = form.getFieldForPath(memoName)
    if (fieldFromForm) {
      console.log('Mounting existing field', memoName)
      setField(fieldFromForm)
      fieldFromForm.mount()
      return () => fieldFromForm.unmount()
    }
    console.log('Mounting new field', memoName)
    const newField = new FieldLogic(form, memoName, memoOptions)
    setField(newField)
    newField.mount()
    return () => newField.unmount()
  }, [memoName, memoOptions])

  console.log('Rendering thing', field?.name, !!field)
  if (!field) return null

  return children(field)
}

const ErrorText = ({ errors }: { errors: Signal<Array<string>> }) => {
  if (!errors.value.length) return null
  return (
    <p className="text-[0.8rem] font-medium text-destructive">
      {errors.value.join(', ')}
    </p>
  )
}

const FormTextInput = <TName extends Paths<Product>>({
  label,
  maxLength,
  field,
}: {
  label: string
  field: FieldLogic<Product, TName>
  maxLength?: number
}) => {
  return (
    <div>
      <Label htmlFor={field.name}>{label}</Label>
      <InputSignal
        id={field.name}
        name={field.name}
        type="text"
        placeholder={label}
        // TODO Find out why method reference is not working here
        onBlur={() => field.handleBlur()}
        value={field.signal}
        maxLength={maxLength}
      />
      <div
        className={cn(
          'flex flex-row justify-between text-[0.8rem] font-medium mb-[-16px]',
          field.errors.value.length && 'text-destructive',
        )}
      >
        <p>{field.errors.value}</p>
        {maxLength && (
          <p>
            {field.signal.value.length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  )
}

const FormString = () => {
  return <pre>{JSON.stringify(form.json.value, null, 2)}</pre>
}

// biome-ignore lint/style/noNonNullAssertion: <explanation>
const rootElement = document.getElementById('root')!

createRoot(rootElement).render(<Index />)
