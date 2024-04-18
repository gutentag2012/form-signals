import {
  unSignalifyValueSubscribed,
  useFormContext,
} from '@formsignals/form-react'
import { useComputed } from '@preact/signals-react'
// biome-ignore lint/correctness/noUnusedImports: This is the React import
import React from 'react'
import { BooleanDisplay } from './BooleanDisplay'
import { TextDisplay } from './TextDisplay'

export function FieldState({ fieldName }: { fieldName: string }) {
  const form = useFormContext()

  const field = form.fields.value.find((f) => f.name === fieldName)!

  const errors = useComputed(() => field.errors.value.join(', ') || '-')
  const shouldDisplayRawString = useComputed(() => {
    const data = field.data.value
    if (typeof data === 'string') return true
    if (typeof data === 'number') return true
    return data instanceof Date
  })
  const currentValueString = useComputed(() => {
    const unsignalified = unSignalifyValueSubscribed(field.data)

    if (typeof unsignalified === 'string') return unsignalified
    if (unsignalified instanceof Date) return unsignalified.toISOString()

    return JSON.stringify(unsignalified, null, 2)
  })

  return (
    <div className="fs-drawer--field-state">
      <div className="fs-drawer--field-state--header">
        <BooleanDisplay
          label="Mounted"
          value={field.isMounted}
          tooltip="Is the field mounted within React?"
        />
        <BooleanDisplay
          label="Touched"
          value={field.isTouched}
          tooltip="Has the field been touched?"
        />
        <BooleanDisplay
          label="Dirty"
          value={field.isDirty}
          tooltip="Is the current data different from the default data?"
        />
        <BooleanDisplay
          label="Validating"
          value={field.isValidating}
          tooltip="Is the field currently validating?"
        />
        <TextDisplay
          label="Errors"
          value={errors}
          tooltip="What are the current field errors?"
        />
      </div>

      <div className="fs-drawer--field-state--value">
        <strong>Value</strong>{' '}
        {shouldDisplayRawString.value ? (
          currentValueString
        ) : (
          <pre>{currentValueString}</pre>
        )}
      </div>

      <div className="fs-drawer--action-buttons">
        <button type="button" onClick={() => field?.reset()}>
          Reset
        </button>
      </div>
    </div>
  )
}
