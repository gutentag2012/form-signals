import { useFormContext } from '@formsignals/form-react'
// biome-ignore lint/correctness/noUnusedImports: This is the React import
import React from 'react'
import { BooleanDisplay } from './BooleanDisplay'
import { Collapsible } from './Collapsible'
import { FieldGroupState } from './FieldGroupState'

export function FieldGroupStates() {
  const form = useFormContext()

  const fields = form.fieldGroups.value

  return (
    <div className="fs-drawer--field-states">
      {fields.map((field) => (
        <Collapsible
          key={field.members.join('|')}
          title={field.members.join(', ')}
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
          <FieldGroupState members={field.members} />
        </Collapsible>
      ))}
    </div>
  )
}
