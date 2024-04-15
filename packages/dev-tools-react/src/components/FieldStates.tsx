import { useFormContext } from '@formsignals/form-react'
import { Collapsible } from './Collapsible'
import { BooleanDisplay } from './BooleanDisplay'
import { FieldState } from './FieldState'
// biome-ignore lint/correctness/noUnusedImports: This is the React import
import React from "react"

export function FieldStates() {
  const form = useFormContext()

  const fields = form.fields.value

  return (
    <div className="fs-drawer--field-states">
      {fields.map((field) => (
        <Collapsible
          key={field.name}
          title={field.name}
          endAttachment={<BooleanDisplay label="Valid" value={field.isValid} />}
        >
          <FieldState fieldName={field.name} />
        </Collapsible>
      ))}
    </div>
  )
}
