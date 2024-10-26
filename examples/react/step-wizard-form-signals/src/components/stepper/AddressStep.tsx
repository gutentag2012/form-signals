import { ErrorText } from '@/components/ErrorText.tsx'
import { Button } from '@/components/ui/button.tsx'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx'
import { InputForm } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import {
  SelectContent,
  SelectItem,
  SelectSignal,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx'
import { type FormValues, MAX_STEPS } from '@/types.ts'
import { useFieldGroupContext } from '@formsignals/form-react'
import type { ZodAdapter } from '@formsignals/validation-adapter-zod'
import type { Signal } from '@preact/signals-react'
import { z } from 'zod'

export type PersonalStepProps = {
  step: number
  currentStep: Signal<number>
}

export const AddressStep = (props: PersonalStepProps) => {
  const group = useFieldGroupContext<
    FormValues,
    ['street', 'city', 'state', 'zip', 'country'],
    undefined,
    typeof ZodAdapter
  >()
  if (props.step !== props.currentStep.value) return null

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void group.handleSubmit()
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
        </CardHeader>

        <CardContent>
          <group.FieldProvider
            name="street"
            validator={z.string().min(1)}
            keepInFormOnUnmount
          >
            <div className="flex-1">
              <Label>Street</Label>
              <InputForm placeholder="Type here..." />
              <ErrorText />
            </div>
          </group.FieldProvider>
          <group.FieldProvider
            name="city"
            validator={z.string().min(1)}
            keepInFormOnUnmount
          >
            <div className="flex-1">
              <Label>City</Label>
              <InputForm placeholder="Type here..." />
              <ErrorText />
            </div>
          </group.FieldProvider>
          <div className="mb-1.5 flex flex-row gap-2">
            <group.FieldProvider
              name="zip"
              validator={z.string().min(1)}
              keepInFormOnUnmount
            >
              <div className="flex-1">
                <Label>Postal Code</Label>
                <InputForm placeholder="Type here..." />
                <ErrorText />
              </div>
            </group.FieldProvider>
            <group.FieldProvider
              name="state"
              validator={z.string().min(1)}
              keepInFormOnUnmount
            >
              <div className="flex-[5]">
                <Label>State</Label>
                <InputForm placeholder="Type here..." />
                <ErrorText />
              </div>
            </group.FieldProvider>
          </div>
          <group.FieldProvider
            name="country"
            validator={z.string()}
            defaultValue="USA"
            keepInFormOnUnmount
          >
            {(field) => (
              <div>
                <Label>Country</Label>
                <SelectSignal value={field.data}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USA">USA</SelectItem>
                    <SelectItem value="Germany">Germany</SelectItem>
                  </SelectContent>
                </SelectSignal>
                <ErrorText />
              </div>
            )}
          </group.FieldProvider>
        </CardContent>

        <CardFooter className="justify-between">
          <Button
            type="button"
            variant="outline"
            disabled={props.step === 1}
            onClick={() => props.currentStep.value--}
          >
            Previous
          </Button>
          <div className="flex flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                props.currentStep.value++
              }}
            >
              Skip for now
            </Button>
            <Button
              type="submit"
              disabled={!group.canSubmit.value || props.step === MAX_STEPS}
            >
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  )
}
