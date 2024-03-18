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
  useField,
  useFieldContext,
  useForm,
  useFormContext,
} from '@form-signals/form-react'
import { Signal, signal, useComputed, useSignal } from '@preact/signals-react'
import { createRoot } from 'react-dom/client'
import { Button } from './components/ui/button'
import './index.css'
import { useEffect } from 'react'

const emptyDefaultValues: Product = {
  name: '',
  description: '',
  validRange: [undefined, undefined],
  prices: {
    EUR: [
      {
        count: 1,
        price: 20,
        taxRate: 19,
      },
    ],
  },
  variants: [],
} satisfies Product
const supportedCurrency = ['EUR', 'USD', 'GBP'] as const

const selectedCurrency = signal('EUR')
const Test = () => <div>Test</div>
export const Index = () => {
  const form = useForm<Product>({
    defaultValues: emptyDefaultValues,
    onSubmit: (values) => {
      console.log('submit', values)
    },
  })

  useEffect(() => {
    console.log("Changed", form)
  }, [form])

  console.log(form.FieldProvider, form.FormProvider)
  form.FieldProvider ??= Test
  form.FormProvider ??= Test
  
  const subForm = useForm<Product['prices'][string][number]>({
    defaultValues: {
      count: null as unknown as number,
      price: null as unknown as number,
      taxRate: 19,
    },
    onSubmit: (values) => {
      // TODO Add transformer to field to handle this string to number conversion
      // TODO Also add a field transformer to handle default values to form values
      form.pushValueToArray(`prices.${selectedCurrency.peek()}`, values)
      // TODO This is not working rn
      subForm.reset()
    },
  })
  subForm.FieldProvider ??= Test
  subForm.FormProvider ??= Test
  const selectedVariant = useSignal(0)
  const justAddedOption = useSignal(false)

  const currencyCount = useComputed(() => {
    const count = Object.values(form.json.value.prices).filter(
      (prices) => !!prices?.length,
    ).length

    if (count === 1) return '1 currency'
    return `${count} currencies`
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

      <form.FormProvider asForm className="flex flex-col gap-4 w-full">
        <h5 className="text-lg font-bold">General</h5>

        <form.FieldProvider
          name="name"
          validator={(value) =>
            value.length <= 5 && 'Value must be longer than 5 characters'
          }
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
                onBlur={() => field.handleBlur()}
                value={field.signal}
              />
            </div>
          )}
        </form.FieldProvider>

        <div>
          <div className="flex flex-row gap-2">
            <form.FieldProvider
              name="validRange.0"
              validator={(value) => value === undefined && 'Value is required'}
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
                  <ErrorText />
                </div>
              )}
            </form.FieldProvider>
            <form.FieldProvider
              name="validRange.1"
              validator={(value) => value === undefined && 'Value is required'}
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
                  <ErrorText />
                </div>
              )}
            </form.FieldProvider>
          </div>
          <form.FieldProvider
            name="validRange"
            validateOnNestedChange
            validator={(value) => {
              if (!value[0] || !value[1] || value[0] <= value[1]) return
              return 'Valid from must be before valid until'
            }}
          >
            <ErrorText />
          </form.FieldProvider>
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
              {/* TODO When having and error on one tab and then navigating away and to it, the error is not visible anymore */}
              {/* TODO Add support for in-place change of name and values */}
              {supportedCurrency.map(
                (currency) =>
                  currency === selectedCurrency.value && (
                    <form.FieldProvider
                      key={`prices.${currency}`}
                      name={`prices.${currency}`}
                      defaultValue={emptyDefaultValues.prices[currency] ?? []}
                      preserveValueOnUnmount
                      validator={(value) =>
                        !!value &&
                        !value.length &&
                        'At least one price is required'
                      }
                    >
                      <PriceTableBody />
                      <PriceTableErrorText />
                    </form.FieldProvider>
                  ),
              )}
            </TableBody>
            <TableFooter>
                {/* TODO Somehow capture enter on child or add ability to change underlying component */}
                <subForm.FormProvider>
              <TableRow disableHoverStyle onKeyDown={subForm.handleSubmitOnEnterForForm}>
                  <TableCell className="align-top">
                    <subForm.FieldProvider
                      name="count"
                      validator={(value) => {
                        if (value <= 0) return 'Value must be greater than 0'
                        return undefined
                      }}
                      transformToBinding={(value) => value === null ? '' : `${value}`}
                      transformFromBinding={(value: string) =>
                        parseFloat(value ?? '0')
                      }
                    >
                      {(field) => (
                        <>
                          <Label htmlFor={field.name}>Min Count</Label>
                          <InputSignal
                            value={field.transformedSignal}
                            id={field.name}
                            name={field.name}
                            type="number"
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
                      validator={(value) => {
                        if (value <= 0) return 'Value must be greater than 0'
                        return undefined
                      }}
                      transformToBinding={(value) => `${value}`}
                      transformFromBinding={(value: string) =>
                        parseFloat(value)
                      }
                    >
                      {(field) => (
                        <>
                          <Label htmlFor={field.name}>New price</Label>
                          <InputSignal
                            value={field.transformedSignal}
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
                      validator={(value) => {
                        if (value !== 19 && value !== 7 && value !== 0)
                          return 'Value must be 19, 7 or 0'
                        return undefined
                      }}
                      transformToBinding={(value) => `${value}`}
                      transformFromBinding={(value: string) =>
                        parseFloat(value)
                      }
                    >
                      {(field) => (
                        <>
                          <Label htmlFor={field.name}>Tax Rate</Label>
                          <SelectSignal
                            name={field.name}
                            value={field.transformedSignal}
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

        <h5 className="text-lg font-bold">Variants</h5>

        <Tabs
          value={selectedVariant.value.toString()}
          onValueChange={(value) => {
            if(value === 'new') return
            selectedVariant.value = +value
          }}
        >
            <VariantTabsTrigger selectedVariant={selectedVariant} />
          {form.data.value.variants?.value?.map((variant, index) => (
            <TabsContent key={variant.key} value={`${index}`}>
            <form.FieldProvider name={`variants.${index}.name`} preserveValueOnUnmount validator={value => !value && "The variant needs to have a name."}>
              {
                (field) => (
                  <div>
                    <Label htmlFor={field.name}>Name</Label>
                    <div className="flex flex-row gap-2">
                      <InputSignal
                        type="text"
                        placeholder="Name"
                        value={field.signal}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        // TODO Fix this
                        onClick={() => form.removeValueFromArray('variants', index)}
                      >
                        Remove
                      </Button>
                    </div>
                    <ErrorText />
                  </div>
                )
              }
            </form.FieldProvider>
            <div className="mt-2">
              <Label htmlFor={`variant-${index}-options`}>Options</Label>
              <div className="flex flex-col gap-1">
                {/* TODO When not preserving, the array should be empty and not have undefined values instead (add tests) */}
                  <form.FieldProvider name={`variants.${index}.options`} preserveValueOnUnmount validator={value => value.length < 1 && "There must be at least one variant."}>
                    {
                      field => <>
                        <VariantOptionsList justAddedOption={justAddedOption} />
                        <Input
                          id={`variant-${index}-option-new`}
                          name={`variant-${index}-option-new`}
                          type="text"
                          placeholder="Option"
                          onChange={(e) => {
                            field.pushValueToArray(e.target.value)
                            justAddedOption.value = true
                            e.target.value = ''
                          }}
                          />
                          <ErrorText />
                      </>
                    }
                </form.FieldProvider>
              </div>
            </div>
            </TabsContent>
          ))}
        </Tabs>

        <Button
          className="mt-2 max-w-[280px]"
          type="submit"
          disabled={!form.canSubmit.value}
        >
          Save configuration
        </Button>

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
              <CollapsibleTrigger asChild>
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
            <Button
              variant="outline"
              onClick={() => form.validateForEvent('onSubmit')}
            >
              Force Validate Form
            </Button>
            <Button variant="destructive" onClick={() => form.reset()}>
              Reset
            </Button>
          </CardFooter>
        </Card>
      </form.FormProvider>
    </main>
  )
}

const VariantOptionsList = ({justAddedOption}: {justAddedOption: Signal<boolean>}) => {
  const parentField = useFieldContext<Product, `variants.${number}.options`>()
  console.log(parentField.name, parentField.signal?.value, parentField.signal);
  
  return parentField.signal.value.map((option, optionIndex) => (
    <parentField.SubFieldProvider key={option.key} name={`${optionIndex}`} preserveValueOnUnmount>
      {
        (field) => (
          <InputSignal
            type="text"
            placeholder="Option"
            value={field.signal}
            onBlur={() => field.handleBlur()}
            onChange={(e) => {
              if (!e.target.value) {
                return field.unmount()
                // return form.removeValueFromArray(
                //   `variants.${index}.options`,
                //   optionIndex,
                // )
              }
              // TODO This is not working rn
              field.handleChange(e.target.value)
              field.signal.value = e.target.value
            }}
            autoFocus={justAddedOption.peek() && optionIndex === parentField.signal.value.length - 1}
          />
        )
      }
    </parentField.SubFieldProvider>
  ))
}

const VariantTabsTrigger = ({selectedVariant}: {selectedVariant: Signal<number>}) => {
  // TODO Check why this is not validated on mount
  // const field = useField<Product, "variants">("variants", {
  //   validator: {
  //     validate: () => "error",
  //     validateOnMount: true
  //   }
  // })
  const field = useField<Product, "variants">("variants", {
    validator: value => value.some((variant, index, array) => index !== array.findIndex(v => v.name === variant.name)) && "Variants must be unique.",
    validateOnNestedChange: true
  })
    return <field.FieldProvider>
      <TabsList>
  {
    field.signal.value?.map((variant, index) => (
      <TabsTrigger key={variant.key} value={`${index}`}>
        {variant.signal.value.name.value || '...'}
      </TabsTrigger>
    ))
  }
              <TabsTrigger
                value="new"
                onClick={() => {
                  field.pushValueToArray({
                    name: '',
                    options: [],
                  })
                  selectedVariant.value = field.signal.peek().length - 1
                }}
              >
                +
              </TabsTrigger>
  </TabsList>
    <ErrorText />
            </field.FieldProvider>
}

/**
 * TODO Figure out why this needs the useSignals annotation for the babel transformer to work
 * @useSignals
 */
const PriceTableBody = () => {
  const field = useFieldContext<Product, `prices.${string}`, never>()
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

const PriceTableErrorText = () => {
  const field = useFieldContext()
  if (!field.isValid.value) return null
  return (
    <TableRow disableHoverStyle>
      <TableCell colSpan={4}>
        <ErrorText />
      </TableCell>
    </TableRow>
  )
}

const ErrorText = () => {
  const field = useFieldContext()
  if (!field.errors.value.length) return null
  return (
    <p className="text-[0.8rem] font-medium text-destructive">
      {field.errors.value.join(', ')}
    </p>
  )
}

const FormTextInput = ({
  label,
  maxLength,
}: {
  label: string
  maxLength?: number
}) => {
  const field = useFieldContext()

  const currentCount = useComputed(() => {
    const value = field.signal.value
    if (typeof value === 'string') return (value as string).length
    return 0
  })
  const errorText = useComputed(() => {
    return field.errors.value.join(', ')
  })
  const errorClassName = useComputed(() => {
    return !field.isValid.value ? 'text-destructive' : ''
  })

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
          errorClassName.value,
        )}
      >
        <p>{errorText}</p>
        {maxLength && (
          <p>
            {currentCount}/{maxLength}
          </p>
        )}
      </div>
    </div>
  )
}

const FormString = () => {
  const form = useFormContext()
  return <pre>{JSON.stringify(form.json.value, null, 2)}</pre>
}

// biome-ignore lint/style/noNonNullAssertion: <explanation>
const rootElement = document.getElementById('root')!

createRoot(rootElement).render(<Index />)
