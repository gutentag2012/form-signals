import { ErrorText } from '@/components/form/ErrorText.tsx'
import { Button } from '@/components/ui/button.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs.tsx'
import type { Product } from '@/types.ts'
import type { FieldApi, FormApi, FormState } from '@tanstack/react-form'
import type { zodValidator } from '@tanstack/zod-form-adapter'
import {
  type Dispatch,
  type RefObject,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react'
import { z } from 'zod'

export const VariantCreator = ({
  form,
}: { form: FormApi<Product, typeof zodValidator> }) => {
  const field = form.useField({
    name: 'variants',
    mode: 'array',
    defaultValue: [],
    validators: {
      onChange: ({ value, fieldApi }) => {
        if (
          value.some(
            (variant, index, array) =>
              index !== array.findIndex((v) => v.name === variant.name),
          )
        ) {
          return 'Variants must be unique.'
        }
        if (
          fieldApi.form.getFieldValue('name')?.includes('base') &&
          value.length < 1
        ) {
          return 'Base variant must have at least one variant.'
        }
      },
      onChangeListenTo: ['name'],
    },
  })
  useEffect(() => {
    if (!field.state.value) return
    field.validate('change')
  }, [field.state.value, field.validate])

  const [selectedVariant, setSelectedVariant] = useState('0')

  return (
    <Tabs
      value={selectedVariant}
      onValueChange={(value) => {
        if (value === 'new') return
        setSelectedVariant(value)
      }}
    >
      <VariantTabsTrigger
        selectedVariant={selectedVariant}
        field={field}
        setSelectedVariant={setSelectedVariant}
      />
      {field.state.value?.map((_, index) => (
        <TabsContent key={index} value={`${index}`}>
          <VariantTab field={field} index={index} />
        </TabsContent>
      ))}
    </Tabs>
  )
}

const VariantTab = ({
  index,
  field,
}: {
  index: number
  field: FieldApi<Product, 'variants', never, typeof zodValidator>
}) => {
  // Determines whether the last option was just added to focus it
  const justAddedOption = useRef(false)

  return (
    <>
      <field.form.Field
        name={`variants[${index}].name`}
        preserveValue
        validators={{ onChange: z.string().min(1, 'Name is required') }}
      >
        {(nameField) => (
          <div>
            <Label htmlFor={nameField.name}>Name</Label>
            <div className="flex flex-row gap-2">
              <Input
                type="text"
                placeholder="Name"
                value={nameField.state.value}
                onChange={(e) => nameField.handleChange(e.target.value)}
              />
              <Button
                type="button"
                variant="destructive"
                onClick={() =>
                  field.form.removeFieldValue(field.name, index, {
                    touch: true,
                  })
                }
              >
                Remove
              </Button>
            </div>
            <ErrorText field={nameField} />
          </div>
        )}
      </field.form.Field>

      <div className="mt-2">
        <Label>Options</Label>
        <div className="flex flex-col gap-1">
          <field.form.Field
            name={`variants[${index}].options`}
            preserveValue
            validators={{
              onChange: z
                .array(z.string())
                .min(1, 'At least one option is required'),
            }}
          >
            {(optionField) => (
              <>
                <VariantOptionsList
                  justAddedOption={justAddedOption}
                  field={optionField}
                  index={index}
                />
                <Input
                  id={optionField.name}
                  name={optionField.name}
                  type="text"
                  placeholder="Option"
                  onChange={(e) => {
                    optionField.form.pushFieldValue(
                      optionField.name,
                      e.target.value as never,
                      { touch: true },
                    )
                    justAddedOption.current = true
                    e.target.value = ''
                  }}
                />
                <ErrorText field={optionField} />
              </>
            )}
          </field.form.Field>
        </div>
      </div>
    </>
  )
}

const VariantOptionsList = ({
  justAddedOption,
  field,
  index,
}: {
  justAddedOption: RefObject<boolean>
  field: FieldApi<
    Product,
    `variants[${number}].options`,
    never,
    typeof zodValidator
  >
  index: number
}) => {
  return field.state.value.map((_, optionIndex) => (
    <field.form.Field
      key={optionIndex}
      name={`variants[${index}].options[${optionIndex}]`}
      preserveValue
    >
      {(optionField) => (
        <Input
          type="text"
          placeholder="Option"
          value={optionField.state.value}
          onBlur={optionField.handleBlur}
          onChange={(e) => {
            if (!e.target.value) {
              field.removeValue(optionIndex)
              return
            }
            optionField.handleChange(e.target.value as never)
          }}
          autoFocus={
            !!justAddedOption.current &&
            optionIndex === field.state.value.length - 1
          }
        />
      )}
    </field.form.Field>
  ))
}
const VariantTabsTrigger = ({
  setSelectedVariant,
  field,
}: {
  selectedVariant: string
  setSelectedVariant: Dispatch<SetStateAction<string>>
  field: FieldApi<Product, 'variants', never, typeof zodValidator>
}) => {
  return (
    <>
      <TabsList>
        {field.state.value?.map((_, index) => (
          <TabsTrigger key={index} value={`${index}`}>
            <field.form.Subscribe
              selector={(
                state: FormState<Product>,
              ): [Product['variants'][number]] => [
                state.values.variants[index],
              ]}
            >
              {([variant]) => variant.name || '...'}
            </field.form.Subscribe>
          </TabsTrigger>
        ))}
        <TabsTrigger
          value="new"
          onClick={() => {
            field.pushValue({
              name: '',
              options: [],
            })
            setSelectedVariant(`${field.state.value.length - 1}`)
          }}
        >
          +
        </TabsTrigger>
      </TabsList>
      <ErrorText field={field} />
    </>
  )
}
