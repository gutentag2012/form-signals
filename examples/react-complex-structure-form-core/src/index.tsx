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
  FieldLogic,
  type FieldLogicOptions,
  FormLogic,
  type Paths,
} from '@form-signals/form-core'
import {
  useFieldContext,
  useForm,
  useFormContext,
} from '@form-signals/form-react'
import { signal, useComputed, useSignal } from '@preact/signals-react'
import { type ReactNode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Button } from './components/ui/button'
import './index.css'

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
// TODO Typesafety is not where I want/need it

export const Index = () => {
  const form = useForm<Product>({
    defaultValues: emptyDefaultValues,
    onSubmit: (values) => {
      console.log('submit', values)
    },
  })
  const subForm = useForm<Product['prices'][string][number]>({
    defaultValues: {
      count: 1,
      price: 30,
      taxRate: 19,
    },
    onSubmit: (values) => {
      // TODO Add transformer to field to handle this string to number conversion
      // TODO Also add a field transformer to handle default values to form values
      form.pushValueToArray(`prices.${selectedCurrency.peek()}`, values)
    },
  })
  const selectedVariant = useSignal(0)
  const justAddedOption = useSignal(false)

  const currencyCount = useComputed(() => {
    const count = Object.values(form.json.value.prices).filter(
      (prices) => !!prices?.length,
    ).length

    if (count === 1) return '1 currency'
    return `${count} currencies`
  })

  // TODO The outer layer is rendered if there is an error or if the error is resolved
  console.log('Render outer')

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
              <TableRow disableHoverStyle>
                {/* TODO Somehow capture enter on child */}
                <subForm.FormProvider>
                  <TableCell className="align-top">
                    <subForm.FieldProvider
                      name="count"
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
                          <Label htmlFor={field.name}>Min Count</Label>
                          <InputSignal
                            value={field.transformedSignal}
                            id={field.name}
                            name={field.name}
                            type="number"
                            placeholder="Min Count"
                          />
                          <ErrorText errors={field.errors} />
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
                          <ErrorText errors={field.errors} />
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
                          <ErrorText errors={field.errors} />
                        </>
                      )}
                    </subForm.FieldProvider>
                  </TableCell>

                  <TableCell align="right" className="align-top">
                    <Button
                      className="mt-5"
                      type="button"
                      variant="outline"
                      // disabled={!subForm.canSubmit.value}
                      onClick={() => subForm.handleSubmit()}
                    >
                      Add new price
                    </Button>
                  </TableCell>
                </subForm.FormProvider>
              </TableRow>
            </TableFooter>
            <TableCaption>Currently {currencyCount} configured</TableCaption>
          </Table>
        </div>

        <h5 className="text-lg font-bold">Variants</h5>

        <Tabs
          value={selectedVariant.value.toString()}
          onValueChange={(value) => {
            selectedVariant.value = +value
          }}
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
                      autoFocus={justAddedOption.value && optionIndex === 1}
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
          // disabled={!form.canSubmit.value}
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
  console.log(field)
  if (!field.isValid.value) return null
  return (
    <TableRow disableHoverStyle>
      <TableCell colSpan={4}>
        <ErrorText />
      </TableCell>
    </TableRow>
  )
}

type FormFieldProps<TData, TName extends Paths<TData>, TBoundValue> = {
  form: FormLogic<TData>
  name: TName
  children: (field: FieldLogic<TData, TName, TBoundValue>) => ReactNode
} & FieldLogicOptions<TData, TName, TBoundValue>

const useEqualityMemorizedValue = <T,>(newValue: T) => {
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

const FormField = <TData, TName extends Paths<TData>, TBoundValue>({
  form,
  name,
  children,
  ...options
}: FormFieldProps<TData, TName, TBoundValue>) => {
  const memoName = useEqualityMemorizedValue(name)
  const memoOptions = useEqualityMemorizedValue(options)
  const [field, setField] = useState<FieldLogic<TData, TName, TBoundValue>>()

  useEffect(() => {
    const fieldFromForm = form.getFieldForPath(memoName)
    if (fieldFromForm) {
      setField(fieldFromForm)
      fieldFromForm.mount()
      return () => fieldFromForm.unmount()
    }
    const newField = new FieldLogic(form, memoName, memoOptions)
    setField(newField)
    newField.mount()
    return () => newField.unmount()
  }, [form, memoName, memoOptions])

  if (!field) return null

  return children(field)
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
