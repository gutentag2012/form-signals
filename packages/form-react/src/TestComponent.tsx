import { type Signal, useComputed } from '@preact/signals-react'
// biome-ignore lint/correctness/noUnusedImports: This is the React import
import React from 'react'
import { createRoot } from 'react-dom/client'
import { useFieldContext } from './field'
import { useFieldGroupContext } from './field-group'
import { useForm } from './form'

function SignalText({ signal }: { signal: Signal<any> }) {
  const text = useComputed(() => JSON.stringify(signal.value, null, 2))
  return <pre>{text}</pre>
}

function Debug() {
  const group = useFieldGroupContext()
  return <SignalText signal={group.data} />
}

function ListItem() {
  const field = useFieldContext<FormValues, `array.${number}`>()
  return (
    <li>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <SignalText signal={field.data} />
        <button
          type="button"
          onClick={() => {
            field.removeSelfFromArray()
          }}
        >
          x
        </button>
        <button
          type="button"
          onClick={() => {
            field.swapSelfInArray(field.currentNamePart - 1)
          }}
        >
          up
        </button>
        <button
          type="button"
          onClick={() => {
            field.swapSelfInArray(field.currentNamePart + 1)
          }}
        >
          down
        </button>
      </div>
    </li>
  )
}

function List() {
  const field = useFieldContext<FormValues, 'array'>()
  return (
    <>
      <ul>
        {field.data.value.map((value, index) => (
          <field.SubFieldProvider
            key={value.key}
            name={`${index}`}
            preserveValueOnUnmount
          >
            <ListItem />
          </field.SubFieldProvider>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => {
          field.pushValueToArray(field.data.peek().length + 1)
        }}
      >
        Add one
      </button>
    </>
  )
}

interface FormValues {
  array: number[]
}

function TestApp() {
  const form = useForm<FormValues>({
    defaultValues: {
      array: [1, 2, 3],
    },
  })
  return (
    <form.FormProvider>
      <form.FieldGroupProvider members={['array']}>
        <form.FieldProvider name="array">
          <Debug />
          <List />
        </form.FieldProvider>
      </form.FieldGroupProvider>
    </form.FormProvider>
  )
}

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

createRoot(rootElement).render(<TestApp />)
