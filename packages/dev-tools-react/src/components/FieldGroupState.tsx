import { useFormContext } from '@formsignals/form-react'
import { useComputed } from '@preact/signals-react'
// biome-ignore lint/correctness/noUnusedImports: This is the React import
import React from 'react'
import { BooleanDisplay } from './BooleanDisplay'
import { Collapsible } from './Collapsible'
import { TextDisplay } from './TextDisplay'

export function FieldGroupState({ members }: { members: string[] }) {
  const form = useFormContext()

  const group = form.fieldGroups.value.find((f) => f.members === members)!

  const dirtyFields = useComputed(
    () => form.dirtyFields.value.join(', ') || '-',
  )
  const errors = useComputed(() => group.errors.value.join(', ') || '-')
  const currentValueString = useComputed(() => JSON.stringify(group.data.value, null, 2))

  return (
    <div className="fs-drawer--field-state">
      <div id="fs-drawer--field-group-states--header">
        <p className="fs-drawer--header--section-title">Basic State</p>

        <BooleanDisplay
          value={group.isMounted}
          label="Mounted"
          tooltip="Is the field group mounted within React?"
        />
        <BooleanDisplay
          value={group.disabled}
          label="Disabled"
          tooltip="Is the field group disabled?"
        />

        <BooleanDisplay
          value={group.isDirty}
          label="Dirty"
          tooltip="Is the current data different from the default data?"
        />
        <TextDisplay
          value={dirtyFields}
          label="Dirty Fields"
          tooltip="Which keys have been changed?"
        />

        <p className="fs-drawer--header--section-title">Validation State</p>

        <BooleanDisplay
          value={group.isValid}
          label="Valid"
          tooltip="Is the field group and all its fields valid?"
        />
        <BooleanDisplay
          value={group.isValidating}
          label="Validating"
          tooltip="Is the field group or any of its fields validating?"
        />

        <BooleanDisplay
          value={group.isValidFieldGroup}
          label="Valid Field Group"
          tooltip="Is the field group valid?"
        />
        <BooleanDisplay
          value={group.isValidatingFieldGroup}
          label="Validating Field Group"
          tooltip="Is the field group currently validating?"
        />

        <BooleanDisplay
          value={group.isValidFields}
          label="Valid Fields"
          tooltip="Are all fields valid?"
        />
        <BooleanDisplay
          value={group.isValidatingFields}
          label="Validating Fields"
          tooltip="Are any of the fields validating?"
        />

        <TextDisplay
          value={errors}
          label="Form Errors"
          tooltip="What are the current field group errors?"
        />

        <p className="fs-drawer--header--section-title">Submission State</p>

        <BooleanDisplay
          value={group.canSubmit}
          label="Can Submit"
          tooltip="Is the field group ready to be submitted? (It must be valid, not currently validating and not currently submitting)"
        />
        <BooleanDisplay
          value={group.isSubmitted}
          label="Submitted"
          tooltip="Has the field group been submitted?"
        />
        <BooleanDisplay
          value={group.isSubmitting}
          label="Submitting"
          tooltip="Is the field group currently submitting?"
        />

        <TextDisplay
          value={group.submitCount}
          label="Submission Count"
          tooltip="How often has the field group been submitted?"
        />
        <TextDisplay
          value={group.submitCountSuccessful}
          label="Successful"
          tooltip="How often has the field group been submitted successfully?"
        />
        <TextDisplay
          value={group.submitCountUnsuccessful}
          label="Unsuccessful"
          tooltip="How often has the field group been submitted unsuccessfully?"
        />
      </div>

      <Collapsible title="Current Values">
        <pre>{currentValueString}</pre>
      </Collapsible>

      <div className="fs-drawer--action-buttons">
        <button type="button" onClick={() => group.reset()}>
          Reset
        </button>
      </div>
    </div>
  )
}
