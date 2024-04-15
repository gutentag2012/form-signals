import { useFormContext } from '@formsignals/form-react'
import { useComputed } from '@preact/signals-react'
import { BooleanDisplay } from './BooleanDisplay'
import { TextDisplay } from './TextDisplay'
import { Collapsible } from './Collapsible'
import { FieldStates } from './FieldStates'
// biome-ignore lint/correctness/noUnusedImports: This is the React import
import React from "react"

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
    <div>
      <h5 id="fs-drawer--title">Form Signals DevTools</h5>

      <div id="fs-drawer--header">
        <p className="fs-drawer--header--section-title">Basic State</p>

        <BooleanDisplay value={form.isMounted} label="Mounted" />
        <BooleanDisplay value={form.isTouched} label="Touched" />

        <BooleanDisplay value={form.isDirty} label="Dirty" />
        <TextDisplay value={dirtyFields} label="Dirty Fields" />

        <p className="fs-drawer--header--section-title">Validation State</p>

        <BooleanDisplay value={form.isValid} label="Valid" />
        <BooleanDisplay value={form.isValidForm} label="Valid Form" />
        <BooleanDisplay value={form.isValidFields} label="Valid Fields" />

        <BooleanDisplay value={form.isValidating} label="Validating" />
        <BooleanDisplay value={form.isValidatingForm} label="Validating Form" />
        <BooleanDisplay
          value={form.isValidatingFields}
          label="Validating Fields"
        />

        <TextDisplay value={errors} label="Form Errors" />

        <p className="fs-drawer--header--section-title">Submission State</p>

        <BooleanDisplay value={form.canSubmit} label="Can Submit" />
        <BooleanDisplay value={form.isSubmitted} label="Submitted" />
        <BooleanDisplay value={form.isSubmitting} label="Submitting" />

        <TextDisplay value={form.submitCount} label="Submission Count" />
        <TextDisplay
          value={form.submitCountSuccessful}
          label="Successful Count"
        />
        <TextDisplay
          value={form.submitCountUnsuccessful}
          label="Unsuccessful Count"
        />
      </div>

      <Collapsible title="Default Values">
        <pre>{defaultValues}</pre>
      </Collapsible>
      <Collapsible title="Current Values">
        <pre>{currentValues}</pre>
      </Collapsible>

      <div id="fs-drawer--action-buttons">
        <button type="button" onClick={() => form.reset()}>
          Reset
        </button>
        <button type="button" onClick={() => form.resetValues()}>
          Reset Values
        </button>
        <button type="button" onClick={() => form.resetState()}>
          Reset State
        </button>
      </div>

      <h6 className="fs-drawer--section-title">Field States</h6>
      <FieldStates />
    </div>
  )
}
