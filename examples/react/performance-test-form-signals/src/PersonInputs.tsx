import { useFieldContext } from '@formsignals/form-react'
import type { ZodAdapter } from '@formsignals/validation-adapter-zod'
import { z } from 'zod'
import { ErrorText } from './ErrorText.tsx'
import { FormInput, FormInputTransformed } from './FormInput.tsx'
import type { Person } from './types.ts'

export function PersonInputs() {
  const field = useFieldContext<
    Person,
    '',
    never,
    undefined,
    typeof ZodAdapter
  >()

  return (
    <div style={{ marginBottom: 8 }}>
      <field.SubFieldProvider
        name="name"
        validator={z.string().min(1)}
        defaultValue="asd"
      >
        <label>Name</label>
        <FormInput />
      </field.SubFieldProvider>
      <field.SubFieldProvider
        name="age"
        validator={z.number().int().min(18).max(100)}
        transformToBinding={(value: number | null) =>
          value === null || Number.isNaN(value) ? '' : `${value}`
        }
        transformFromBinding={(v) => Number.parseInt(v)}
        defaultValue={0}
      >
        <label>Age</label>
        <FormInputTransformed type="number" />
      </field.SubFieldProvider>
      <field.SubFieldProvider
        name="email"
        validator={z.string().email().min(1)}
        defaultValue="asd@asd.de"
      >
        <label>Email</label>
        <FormInput type="email" />
      </field.SubFieldProvider>
      <field.SubFieldProvider
        name="dob"
        validator={z.date()}
        transformToBinding={(v) =>
          !v
            ? null
            : `${v.getFullYear()}-${`0${v.getMonth() + 1}`.slice(
                -2,
              )}-${`${v.getDate()}`.slice(-2)}`
        }
        transformFromBinding={(v) => (v as unknown as Date) && new Date(v!)}
      >
        <label>Date of Birth</label>
        <FormInputTransformed type="date" />
      </field.SubFieldProvider>
      <ErrorText />
    </div>
  )
}
