import { useFormContext } from '@formsignals/form-react'
// biome-ignore lint/correctness/noUnusedImports: This is the React import
import React from 'react'
import { BooleanDisplay } from './BooleanDisplay'
import { Collapsible } from './Collapsible'
import { FieldState } from './FieldState'

export function FieldStates() {
  const form = useFormContext()

  const fields = form.fields.value

  return (
    <div className="fs-drawer--field-states">
      {fields.map((field) => (
        <Collapsible
          key={field.name}
          title={field.name}
          endAttachment={
            <div className="fs-utils--flex fs-utils--gap-lg">
              <BooleanDisplay
                label="Disabled"
                value={field.disabled}
                tooltip="Is the field disabled?"
              />
              <BooleanDisplay
                label="Valid"
                value={field.isValid}
                tooltip="Is the field valid?"
              />
            </div>
          }
        >
          <FieldState fieldName={field.name} />
        </Collapsible>
      ))}
    </div>
  )
}
