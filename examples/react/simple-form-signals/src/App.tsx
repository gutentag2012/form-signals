import { useFieldContext, useForm } from '@formsignals/form-react'
import type { Signal } from '@preact/signals-react'

function App() {
  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      dateOfBirth: null as Date | null,
    },
    onSubmit: (values) => alert(JSON.stringify(values, null, 2)),
  })

  return (
    <form.FormProvider>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          void form.handleSubmit()
        }}
      >
        <form.FieldProvider
          name="name"
          validator={(value) => !value && 'This field is required!'}
        >
          {(field) => (
            <div>
              <label htmlFor="name">Name:</label>
              <InputSignal name="name" data={field.data} />
              <ErrorText />
            </div>
          )}
        </form.FieldProvider>
        <form.FieldProvider
          name="email"
          validator={(value) => !value && 'This field is required!'}
        >
          {(field) => (
            <div>
              <label htmlFor="email">Email:</label>
              <InputSignal data={field.data} type="email" name="email" />
              <ErrorText />
            </div>
          )}
        </form.FieldProvider>
        <form.FieldProvider
          name="dateOfBirth"
          transformToBinding={dateToString}
          transformFromBinding={(e) => new Date(e)}
          validator={(value) => !value && 'This field is required!'}
        >
          {(field) => (
            <div>
              <label htmlFor="dob">Date of Birth:</label>
              <InputSignal
                data={field.transformedData}
                type="date"
                name="dob"
              />
              <ErrorText />
            </div>
          )}
        </form.FieldProvider>

        <button type="submit" disabled={!form.canSubmit.value}>
          Submit
        </button>
      </form>
    </form.FormProvider>
  )
}

export default App

interface InputSignalProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'value' | 'onChange'
  > {
  data: Signal<string>
}

export function InputSignal({ data, ...props }: InputSignalProps) {
  return (
    <input
      {...props}
      value={data.value}
      onChange={(e) => {
        data.value = e.target.value
      }}
    />
  )
}

export function ErrorText() {
  const field = useFieldContext()
  if (field.isValid.value) return null
  return <span>{field.errors.value.join(', ')}</span>
}

function dateToString(date: Date | null) {
  if (date === null) return ''
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}
