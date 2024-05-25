import { ErrorText } from '@/components/ErrorText.tsx'
import { Button } from '@/components/ui/button.tsx'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx'
import { CheckboxForm } from '@/components/ui/checkbox.tsx'
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

export const PreferencesStep = (props: PersonalStepProps) => {
  const group = useFieldGroupContext<
    FormValues,
    ['newsletter', 'contact', 'language'],
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
          <CardTitle>Preferences</CardTitle>
        </CardHeader>

        <CardContent>
          <group.FieldProvider
            name="contact"
            validator={([value, email, phone]) => {
              console.log('validate', value, email, phone)
              if (value === 'email' && !email)
                return 'Email is required for this contact method'
              if (value === 'phone' && !phone)
                return 'Phone is required for this contact method'
              if (value === 'both' && !email && !phone)
                return 'Email or Phone is required for this contact method'
              return undefined
            }}
            defaultValue="email"
            validateMixin={['email', 'phone']}
          >
            {(field) => (
              <div>
                <Label>Preferred Method of Contact</Label>
                <SelectSignal value={field.data}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a contact method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="both">Email or Phone</SelectItem>
                  </SelectContent>
                </SelectSignal>
                <ErrorText />
              </div>
            )}
          </group.FieldProvider>
          <group.FieldProvider
            name="language"
            validator={z.string()}
            defaultValue="english"
          >
            {(field) => (
              <div>
                <Label>Language</Label>
                <SelectSignal value={field.data}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="german">German</SelectItem>
                  </SelectContent>
                </SelectSignal>
                <ErrorText />
              </div>
            )}
          </group.FieldProvider>
          <group.FieldProvider
            name="newsletter"
            validator={z.boolean()}
            defaultValue={false}
          >
            <Label className="items-top mt-2 flex gap-2">
              <CheckboxForm className="h-5 w-5 rounded" />
              <div className="grid gap-0.5 leading-none">
                <span>Subscribe to Newsletter</span>
                <p className="font-normal text-muted-foreground text-sm">
                  You agree to receiving regular newsletters via mail.
                </p>
              </div>
            </Label>
            <ErrorText />
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
