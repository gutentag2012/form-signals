import { FormDevTools } from '@formsignals/dev-tools-react'
import { useFieldContext, useForm } from '@formsignals/form-react'
import { ZodAdapter } from '@formsignals/validation-adapter-zod'
import { ErrorText } from './ErrorText.tsx'
import { PersonInputs } from './PersonInputs.tsx'
import type { Person } from './types.ts'

const ArrayField = () => {
  const field = useFieldContext<Person[], ''>()

  const addAmount = (amount: number) => () => {
    for (let i = 0; i < amount; i++) {
      field.pushValueToArray({
        name: '',
        email: '',
        dob: undefined as unknown as Date,
        age: 0,
      })
    }
  }
  const removeAmount = (amount: number) => () => {
    for (let i = Math.min(field.data.peek().length, amount); i >= 0; i--) {
      field.removeValueFromArray(i)
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void field.form.handleSubmit()
      }}
    >
      <div style={{ display: 'flex', gap: 8, flexDirection: 'row' }}>
        <button type="button" onClick={addAmount(20)}>
          Add 20
        </button>
        <button type="button" onClick={addAmount(200)}>
          Add 200
        </button>
        <button type="button" onClick={removeAmount(50)}>
          Remove 50
        </button>
        <button type="submit">Submit</button>
        <button
          type="button"
          onClick={() => {
            field.form.resetState()
          }}
        >
          Reset State
        </button>
        <button
          type="button"
          onClick={() => {
            field.form.reset()
          }}
        >
          Reset
        </button>
        <span>Current count: {field.data.value.length}</span>
      </div>
      <ErrorText />
      {field.data.value.map((v, i) => (
        <field.SubFieldProvider key={v.key} name={`${i}`}>
          <PersonInputs />
        </field.SubFieldProvider>
      ))}
    </form>
  )
}

function App() {
  const form = useForm({
    defaultValues: {
      contacts: [] as Person[],
    },
    validatorAdapter: ZodAdapter,
    onSubmit: (values) => {
      alert(JSON.stringify(values, null, 2))
    },
  })

  return (
    <form.FormProvider>
      <form.FieldProvider
        name="contacts"
        validator={(value) =>
          value.length < 440 &&
          'There must be at least 440 contacts to be accepted'
        }
      >
        <ArrayField />
      </form.FieldProvider>
      <FormDevTools />
    </form.FormProvider>
  )
}

export default App
