import type { FormLogic, FormLogicOptions } from '@signal-forms/form-core'
import type React from 'react'
import type { Context, HTMLProps, PropsWithChildren } from 'react'
import { FormContext } from './FormContext'
import { useFormInstance } from './useForm'

type FormProviderBaseNoFormProps = {
  /**
   * If true, all children will be wrapped in a form element, that will call the form's `handleSubmit` method when submitted.
   */
  asForm?: false
  /**
   * If true, all children will be wrapped in an element, that will capture the `enter` key and submit the form if neither `shift`, `ctrl`, `alt` or `meta` are pressed together and the key event was triggered on an input.
   * Furthermore, will the event be stopped and prevented from bubbling to prevent parent forms from being submitted.
   */
  submitOnEnter?: boolean
}

type FormProviderBaseAsFormProps = {
  /**
   * If true, all children will be wrapped in a form element, that will call the form's `handleSubmit` method when submitted.
   */
  asForm: true
} & Omit<HTMLProps<HTMLFormElement>, 'form' | 'onSubmit'>

type FormProviderBaseProps =
  | FormProviderBaseNoFormProps
  | FormProviderBaseAsFormProps

type FormProviderComponentPropsNoForm = FormProviderBaseProps
type FormProviderComponentProps<TData> = {
  form: FormLogic<TData>
} & FormProviderComponentPropsNoForm

type FormProviderWithOptionProps<TData> = FormLogicOptions<TData> &
  FormProviderBaseProps

export type FormProviderProps<TData> =
  | FormProviderComponentProps<TData>
  | FormProviderWithOptionProps<TData>

// These input types have a default behavior for the enter key that should not be prevented
const RestrictedInputTypes = [
  'checkbox',
  'date',
  'datetime-local',
  'email',
  'month',
  'number',
  'password',
  'radio',
  'range',
  'reset', // This will not reset the form since we only want to submit on enter and not reset on enter
  'search',
  'submit',
  'tel',
  'text',
  'time',
  'url',
  'week',
]
const shouldSkipSubmitKeyboarEvent = (
  event: React.KeyboardEvent<HTMLDivElement>,
) => {
  const isRestrictedTargetInput =
    event.target instanceof HTMLElement &&
    event.target.tagName.toUpperCase() === 'INPUT' &&
    RestrictedInputTypes.includes((event.target as HTMLInputElement).type)

  return (
    event.key !== 'Enter' ||
    event.shiftKey ||
    event.ctrlKey ||
    event.altKey ||
    event.metaKey ||
    !isRestrictedTargetInput
  )
}

export function BindFormProviderComponent<TData>(form: FormLogic<TData>) {
  return function BoundFormProviderComponent(
    props: PropsWithChildren<FormProviderComponentPropsNoForm>,
  ) {
    return <FormProviderComponent form={form} {...props} />
  }
}

// TODO Allow to add an onSubmit handler here as well, so that is does not always have to be passed to the form
export function FormProviderComponent<TData>({
  children,
  form,
  asForm,
  ...formProps
}: PropsWithChildren<FormProviderComponentProps<TData>>) {
  const TypedContext = FormContext as Context<FormLogic<TData>>

  if (asForm) {
    return (
      <TypedContext.Provider value={form}>
        <form
          {...formProps}
          onSubmit={async (event) => {
            event.preventDefault()
            event.stopPropagation()
            await form.handleSubmit()
          }}
        >
          {children}
        </form>
      </TypedContext.Provider>
    )
  }

  if ((formProps as FormProviderBaseNoFormProps).submitOnEnter) {
    return (
      <TypedContext.Provider value={form}>
        <div
          onKeyDown={(event) => {
            if (shouldSkipSubmitKeyboarEvent(event)) {
              return
            }

            event.stopPropagation()
            event.preventDefault()

            form.handleSubmit()
          }}
        >
          {children}
        </div>
      </TypedContext.Provider>
    )
  }

  return <TypedContext.Provider value={form}>{children}</TypedContext.Provider>
}

function FormProviderWithOptions<TData>({
  children,
  asForm,
  ...props
}: PropsWithChildren<FormProviderWithOptionProps<TData>>) {
  const form = useFormInstance<TData>(props)
  return (
    <FormProviderComponent form={form} asForm={asForm}>
      {children}
    </FormProviderComponent>
  )
}

export function FormProvider<TData>(
  props: PropsWithChildren<FormProviderProps<TData>>,
) {
  if ('form' in props) {
    return <FormProviderComponent {...props} />
  }
  return <FormProviderWithOptions {...props} />
}
