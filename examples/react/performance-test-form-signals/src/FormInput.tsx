import { useFieldContext } from '@formsignals/form-react'
import { ErrorText } from './ErrorText.tsx'

interface InputSignalProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'value' | 'onChange'
  > {}

export function FormInput(props: InputSignalProps) {
  const field = useFieldContext<string, ''>()
  return (
    <div>
      <input
        {...props}
        value={field.data.value}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      <ErrorText />
    </div>
  )
}

export function FormInputTransformed(props: InputSignalProps) {
  const field = useFieldContext<unknown, '', string>()
  return (
    <div>
      <input
        {...props}
        value={field.transformedData.value}
        onChange={(e) => field.handleChangeBound(e.target.value)}
      />
      <ErrorText />
    </div>
  )
}
