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
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table.tsx'
import type { FormValues } from '@/types.ts'
import { useFormContext } from '@formsignals/form-react'
import type { ZodAdapter } from '@formsignals/validation-adapter-zod'
import type { Signal } from '@preact/signals-react'
import { z } from 'zod'

export type PersonalStepProps = {
  step: number
  currentStep: Signal<number>
}

export const ReviewStep = (props: PersonalStepProps) => {
  const form = useFormContext<FormValues, typeof ZodAdapter>()
  if (props.step !== props.currentStep.value) return null

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Review</CardTitle>
        </CardHeader>

        <CardContent>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell colSpan={2} className="text-muted-foreground">
                  Personal
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>First Name</TableCell>
                <TableCell>{form.json.value.firstName}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Last Name</TableCell>
                <TableCell>{form.json.value.lastName}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>{form.json.value.email}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Phone Number</TableCell>
                <TableCell>{form.json.value.phone ?? '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Date of Birth</TableCell>
                <TableCell>
                  {form.json.value.dateOfBirth?.toLocaleDateString()}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={2} className="text-muted-foreground">
                  Address
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Street</TableCell>
                <TableCell>{form.json.value.street}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>City</TableCell>
                <TableCell>{form.json.value.city}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>State</TableCell>
                <TableCell>{form.json.value.state}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Postal Code</TableCell>
                <TableCell>{form.json.value.zip}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Country</TableCell>
                <TableCell>{form.json.value.country}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={2} className="text-muted-foreground">
                  Account
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>{form.json.value.username}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={2} className="text-muted-foreground">
                  Preferences
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Newsletter</TableCell>
                <TableCell>
                  {form.json.value.newsletter ? 'yes' : 'no'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Method of Contact</TableCell>
                <TableCell>{form.json.value.contact}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Preferred Language</TableCell>
                <TableCell>{form.json.value.language}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <p className="mt-4 mb-8 italic">
            If you are happy with your data accept the terms and conditions to
            continue. Afterwards feel free to do it all over again.
          </p>

          <form.FieldProvider
            name="terms"
            validator={z.literal(true, {
              message: 'You must accept the terms and conditions to continue',
            })}
          >
            <Label className="items-top mt-2 flex gap-2">
              <CheckboxForm className="h-5 w-5 rounded" />
              <div className="grid gap-0.5 leading-none">
                <span>Accept terms and conditions</span>
                <p className="font-normal text-muted-foreground text-sm">
                  You agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            </Label>
            <ErrorText />
          </form.FieldProvider>
        </CardContent>

        <CardFooter className="justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => props.currentStep.value--}
          >
            Previous
          </Button>
          <Button type="submit" disabled={!form.canSubmit.value}>
            Submit
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
