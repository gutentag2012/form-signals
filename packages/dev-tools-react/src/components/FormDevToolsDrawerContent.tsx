import { useFormContext } from '@formsignals/form-react'
import { useComputed } from '@preact/signals-react'
// biome-ignore lint/correctness/noUnusedImports: This is the React import
import React from 'react'
import { BooleanDisplay } from './BooleanDisplay'
import { Collapsible } from './Collapsible'
import { FieldStates } from './FieldStates'
import { TextDisplay } from './TextDisplay'

export function FormDevToolsDrawerContent() {
  const form = useFormContext()

  const dirtyFields = useComputed(
    () => form.dirtyFields.value.join(', ') || '-',
  )
  const errors = useComputed(() => form.errors.value.join(', ') || '-')
  const defaultValues = useComputed(() =>
    JSON.stringify(form.defaultValues.value, null, 2),
  )
  const currentValues = useComputed(() =>
    JSON.stringify(form.json.value, null, 2),
  )

  return (
    <div id="fs-drawer--content">
      <h5 id="fs-drawer--title">Form Signals DevTools</h5>

      <div id="fs-drawer--header">
        <p className="fs-drawer--header--section-title">Basic State</p>

        <BooleanDisplay
          value={form.isMounted}
          label="Mounted"
          tooltip="Is the form mounted within React?"
        />
        <BooleanDisplay
          value={form.isTouched}
          label="Touched"
          tooltip="Is one of the fields touched?"
        />

        <BooleanDisplay
          value={form.isDirty}
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
          value={form.isValid}
          label="Valid"
          tooltip="Is the form and all its fields valid?"
        />
        <BooleanDisplay
          value={form.isValidForm}
          label="Valid Form"
          tooltip="Is the form valid?"
        />
        <BooleanDisplay
          value={form.isValidFields}
          label="Valid Fields"
          tooltip="Are all fields valid?"
        />

        <BooleanDisplay
          value={form.isValidating}
          label="Validating"
          tooltip="Is the form or any of its fields validating?"
        />
        <BooleanDisplay
          value={form.isValidatingForm}
          label="Validating Form"
          tooltip="Is the form currently validating?"
        />
        <BooleanDisplay
          value={form.isValidatingFields}
          label="Validating Fields"
          tooltip="Are any of the fields validating?"
        />

        <TextDisplay
          value={errors}
          label="Form Errors"
          tooltip="What are the current form errors?"
        />

        <p className="fs-drawer--header--section-title">Submission State</p>

        <BooleanDisplay
          value={form.canSubmit}
          label="Can Submit"
          tooltip="Is the form ready to be submitted? (It must be valid, not currently validating and not currently submitting)"
        />
        <BooleanDisplay
          value={form.isSubmitted}
          label="Submitted"
          tooltip="Has the form been submitted?"
        />
        <BooleanDisplay
          value={form.isSubmitting}
          label="Submitting"
          tooltip="Is the form currently submitting?"
        />

        <TextDisplay
          value={form.submitCount}
          label="Submission Count"
          tooltip="How often has the form been submitted?"
        />
        <TextDisplay
          value={form.submitCountSuccessful}
          label="Successful Count"
          tooltip="How often has the form been submitted successfully?"
        />
        <TextDisplay
          value={form.submitCountUnsuccessful}
          label="Unsuccessful Count"
          tooltip="How often has the form been submitted unsuccessfully?"
        />
      </div>

      <Collapsible title="Default Values">
        <pre>{defaultValues}</pre>
      </Collapsible>
      <Collapsible title="Current Values">
        <pre>{currentValues}</pre>
      </Collapsible>

      <div className="fs-drawer--action-buttons">
        <button type="button" onClick={() => form.reset()}>
          Reset
        </button>
      </div>

      <h6 className="fs-drawer--section-title">Field States</h6>
      <FieldStates />
    </div>
  )
}
