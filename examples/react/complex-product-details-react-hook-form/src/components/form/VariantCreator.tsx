import { ErrorText } from '@/components/form/ErrorText.tsx'
import { Button } from '@/components/ui/button.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import {
  TabsContent,
  TabsList,
  Tabs,
  TabsTrigger,
} from '@/components/ui/tabs.tsx'
import type { Product } from '@/types.ts'
import {Controller, useFieldArray, useFormContext} from "react-hook-form";
import {Dispatch, RefObject, SetStateAction, useEffect, useRef, useState} from "react";

export const VariantCreator = () => {
  const form = useFormContext<Product>()
  const [selectedVariant, setSelectedVariant] = useState('0')

  const variants = form.watch('variants')
  return (
    <Tabs
      value={selectedVariant}
      onValueChange={(value) => {
        if (value === 'new') return
        setSelectedVariant(value)
      }}
    >
      <VariantTabsTrigger setSelectedVariant={setSelectedVariant} />
      {variants?.map((_, index) => (
        <TabsContent key={index} value={`${index}`}>
          <VariantTab index={index} />
        </TabsContent>
      ))}
    </Tabs>
  )
}

const VariantTab = ({ index }: { index: number }) => {
  const form = useFormContext<Product>()
  // Determines whether the last option was just added to focus it
  const justAddedOption = useRef(false)

  const variantsField = useFieldArray({
    name: "variants"
  })
  const optionsField = useFieldArray({
    name: `variants.${index}.options`
  })

  return (
    <>
      <div>
        <Label htmlFor={`variants.${index}.name`}>Name</Label>
        <div className="flex flex-row gap-2">
          <Input
            type="text"
            placeholder="Name"
            {...form.register(`variants.${index}.name`)}
          />
          <Button
            type="button"
            variant="destructive"
            onClick={async () => {
              variantsField.remove(index)
              await form.trigger("variants")
            }}
          >
            Remove
          </Button>
        </div>
        <ErrorText />
      </div>

      <div className="mt-2">
        <Label>Options</Label>
        <div className="flex flex-col gap-1">
          <VariantOptionsList justAddedOption={justAddedOption} index={index}/>
          <Input
            type="text"
            placeholder="Option"
            onChange={async (e) => {
              justAddedOption.current = true
              optionsField.append(e.target.value)
              await form.trigger(`variants.${index}.options`)
              e.target.value = ''
            }}
          />
          <ErrorText message={form.getFieldState(`variants.${index}.options`).error?.message} />
        </div>
      </div>
    </>
  )
}

const VariantOptionsList = ({
  justAddedOption,
  index
}: { justAddedOption: RefObject<boolean>, index: number }) => {
  const form = useFormContext<Product>()
  const options = form.watch(`variants.${index}.options`)
  const optionsField = useFieldArray({
    name: `variants.${index}.options`
  })

  const variantName = form.watch(`variants.${index}.name`)
  useEffect(() => {
    form.trigger("variants")
  }, [variantName, form.trigger]);

  return options.map((_, optionIndex) => (
    <Controller key={optionIndex} name={`variants.${index}.options.${optionIndex}`} render={field => (
      <Input
        type="text"
        placeholder="Option"
        value={field.field.value}
        onBlur={field.field.onBlur}
        onChange={(e) => {
          if (!e.target.value) {
            optionsField.remove(optionIndex)
            return
          }
          field.field.onChange(e.target.value)
        }}
        autoFocus={
          !!justAddedOption.current &&
          optionIndex === options.length - 1
        }
      />
    )} />
  ))
}

const VariantTabsTrigger = ({
  setSelectedVariant,
}: { setSelectedVariant: Dispatch<SetStateAction<string>> }) => {
  const form = useFormContext<Product>()
  const variants = form.watch('variants')

  const variantsField = useFieldArray({
    name: "variants"
  })

  return (<>
      <TabsList>
        {variants?.map((variant, index) => (
          <TabsTrigger key={index} value={`${index}`}>
            {variant.name || '...'}
          </TabsTrigger>
        ))}
        <TabsTrigger
          value="new"
          onClick={async () => {
            variantsField.append({
              name: '',
              options: [],
            })
            await form.trigger("variants")
            setSelectedVariant(`${variants.length}`)
          }}
        >
          +
        </TabsTrigger>
      </TabsList>
      <ErrorText message={form.formState.errors.variants?.message}/>
  </>)
}
