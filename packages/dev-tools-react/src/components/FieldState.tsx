import {
  unSignalifyValueSubscribed,
  useFormContext,
} from '@formsignals/form-react'
import { useComputed } from '@preact/signals-react'
import { BooleanDisplay } from './BooleanDisplay'
import { TextDisplay } from './TextDisplay'
// biome-ignore lint/correctness/noUnusedImports: This is the React import
import React from "react"

export function FieldState({ fieldName }: { fieldName: string }) {
  const form = useFormContext()

  const field = form.fields.value.find((f) => f.name === fieldName)

  const errors = useComputed(() => field?.errors?.value?.join(', ') || '-')
  const currentValue = useComputed(() => {
    const data = field?.data
    if (!data) return null
    const unsignalified = unSignalifyValueSubscribed(data)

    if (typeof unsignalified === 'string') return unsignalified
    if (unsignalified instanceof Date) return unsignalified.toLocaleString()

    return JSON.stringify(unsignalified, null, 2)
  })

  if (!field) return null

  return (
    <div className="fs-drawer--field-state">
      <BooleanDisplay label="Mounted" value={field.isMounted} />
      <BooleanDisplay label="Touched" value={field.isTouched} />
      <BooleanDisplay label="Dirty" value={field.isDirty} />
      <TextDisplay label="Errors" value={errors} />
      <BooleanDisplay label="Validating" value={field.isValidating} />

      <div className="fs-drawer--field-state--value">
        <strong>Value</strong> <pre>{currentValue}</pre>
      </div>

      <div id="fs-drawer--action-buttons">
        <button type="button" onClick={() => field?.reset()}>
          Reset
        </button>
        <button type="button" onClick={() => field?.resetValue()}>
          Reset Values
        </button>
        <button type="button" onClick={() => field?.resetState()}>
          Reset State
        </button>
      </div>
    </div>
  )
}
