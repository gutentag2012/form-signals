import { type Signal, useComputed } from '@preact/signals-react'
import type { FieldLogic, Paths } from '@signal-forms/form-core'
// biome-ignore lint/nursery/noUnusedImports: This is the React import
import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { useField, useFieldContext } from './field'
import { useForm } from './form'

type Form = {
  name: string
}

function FormConsumer({ name }: { name: Paths }) {
  const field = useField(name)
  return (
    <input
      type="text"
      value={field.signal.value}
      onChange={(e) => {
        field.handleChange(e.target.value as never)
      }}
    />
  )
}
function FieldConsumer() {
  const field = useFieldContext()
  return <SignalText text={field.signal} />
}
function FieldTransformedConsumer({
  field,
}: { field: FieldLogic<Form, 'name', unknown> }) {
  const changed = useComputed(() => `${field.signal.value} (transformed)`)
  return <p>{changed.value}</p>
}

function SignalText({ text }: { text: Signal<string> }) {
  return <p>{text}</p>
}

function NestedField() {
  const field = useField<Form, 'name'>('name')
  return (
    <field.FieldProvider>
      <FieldConsumer />
    </field.FieldProvider>
  )
}

function TestApp() {
  const form = useForm<Form>({
    defaultValues: {
      name: 'test',
    },
    onSubmit: (data) => {
      console.log('submit 1', data)
    },
  })
  const [someState, setSomeState] = useState(false)
  return (
    <div>
      <form.FormProvider asForm>
        <FormConsumer name="name" />
        <form.FieldProvider
          name="name"
          transformFromBinding={(v: number) => `${v}`}
          transformToBinding={(v) => v.length}
        >
          <FieldConsumer />
        </form.FieldProvider>
        <form.FieldProvider name="name">
          {(field) => <FieldTransformedConsumer field={field} />}
        </form.FieldProvider>
        <NestedField />

        <button type="button" onClick={() => setSomeState(!someState)}>
          Update
        </button>
      </form.FormProvider>
    </div>
  )
}

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

createRoot(rootElement).render(<TestApp />)
