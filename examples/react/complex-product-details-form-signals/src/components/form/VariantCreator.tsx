import { ErrorText } from '@/components/form/ErrorText.tsx'
import { Button } from '@/components/ui/button.tsx'
import { Input, InputSignal } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import {
  TabsContent,
  TabsList,
  TabsSignal,
  TabsTrigger,
} from '@/components/ui/tabs.tsx'
import type { Product } from '@/types.ts'
import {
  useField,
  useFieldContext,
  useFormContext,
} from '@form-signals/form-react'
import type { ZodAdapter } from '@form-signals/validation-adapter-zod'
import { type Signal, useSignal } from '@preact/signals-react'
import { z } from 'zod'

export const VariantCreator = () => {
  const form = useFormContext<Product, typeof ZodAdapter>()
  const field = useField(form, 'variants', {
    defaultValue: [],
    validateOnNestedChange: true,
    validator: ([value, name]) => {
      if (
        value.some(
          (variant, index, array) =>
            index !== array.findIndex((v) => v.name === variant.name),
        )
      ) {
        return 'Variants must be unique.'
      }
      if (name.includes('base') && value.length < 1) {
        return 'Base variant must have at least one variant.'
      }
    },
    validateMixin: ['name'],
  })

  const selectedVariant = useSignal('0')

  return (
    <TabsSignal
      value={selectedVariant}
      onValueChange={(value) => {
        if (value === 'new') return
        selectedVariant.value = value
      }}
    >
      <field.FieldProvider>
        <VariantTabsTrigger selectedVariant={selectedVariant} />
        {field.data.value?.map((variant, index) => (
          <TabsContent key={variant.key} value={`${index}`}>
            <VariantTab index={index} />
          </TabsContent>
        ))}
      </field.FieldProvider>
    </TabsSignal>
  )
}

const VariantTab = ({ index }: { index: number }) => {
  const field = useFieldContext<
    Product,
    `variants`,
    never,
    never,
    typeof ZodAdapter
  >()

  // Determines whether the last option was just added to focus it
  const justAddedOption = useSignal(false)

  return (
    <>
      <field.SubFieldProvider
        name={`${index}.name`}
        preserveValueOnUnmount
        validator={z.string().min(1, 'Name is required')}
        validatorOptions={{
          validateOnMount: true,
        }}
      >
        {(nameField) => (
          <div>
            <Label htmlFor={nameField.name}>Name</Label>
            <div className="flex flex-row gap-2">
              <InputSignal
                type="text"
                placeholder="Name"
                value={nameField.data}
              />
              <Button
                type="button"
                variant="destructive"
                onClick={() => field.removeValueFromArray(index)}
              >
                Remove
              </Button>
            </div>
            <ErrorText />
          </div>
        )}
      </field.SubFieldProvider>

      <div className="mt-2">
        <Label>Options</Label>
        <div className="flex flex-col gap-1">
          <field.SubFieldProvider
            name={`${index}.options`}
            preserveValueOnUnmount
            validator={z
              .array(z.string())
              .min(1, 'At least one option is required')}
          >
            {(field) => (
              <>
                <VariantOptionsList justAddedOption={justAddedOption} />
                <Input
                  id={field.name}
                  name={field.name}
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
            )}
          </field.SubFieldProvider>
        </div>
      </div>
    </>
  )
}

/**
 * @useSignals
 */
const VariantOptionsList = ({
  justAddedOption,
}: { justAddedOption: Signal<boolean> }) => {
  const parentField = useFieldContext<Product, `variants.${number}.options`>()

  return parentField.data.value.map((option, optionIndex) => (
    <parentField.SubFieldProvider
      key={option.key}
      name={`${optionIndex}`}
      preserveValueOnUnmount
    >
      {(field) => (
        <InputSignal
          type="text"
          placeholder="Option"
          value={field.data}
          onBlur={field.handleBlur}
          onChange={(e) => {
            if (!e.target.value) {
              field.removeSelfFromArray()
              return
            }
            field.handleChange(e.target.value)
          }}
          autoFocus={
            justAddedOption.peek() &&
            optionIndex === parentField.data.value.length - 1
          }
        />
      )}
    </parentField.SubFieldProvider>
  ))
}
const VariantTabsTrigger = ({
  selectedVariant,
}: { selectedVariant: Signal<string> }) => {
  const field = useFieldContext<Product, 'variants'>()
  return (
    <field.FieldProvider>
      <TabsList>
        {field.data.value?.map((variant, index) => (
          <TabsTrigger key={variant.key} value={`${index}`}>
            {variant.data.value.name.value || '...'}
          </TabsTrigger>
        ))}
        <TabsTrigger
          value="new"
          onClick={() => {
            field.pushValueToArray({
              name: '',
              options: [],
            })
            selectedVariant.value = `${field.data.peek().length - 1}`
          }}
        >
          +
        </TabsTrigger>
      </TabsList>
      <ErrorText />
    </field.FieldProvider>
  )
}
