import type { FormLogic } from '@signal-forms/form-core'
import type React from 'react'
import type { FormContextType } from './form.context'

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
function shouldSkipSubmitKeyboardEvent(
  event: React.KeyboardEvent<HTMLDivElement>,
): boolean {
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
export function handleSubmitOnEnterForForm<TData>(
  form: FormLogic<TData> | FormContextType<TData>,
): (event: React.KeyboardEvent<HTMLDivElement>) => void {
  return (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (shouldSkipSubmitKeyboardEvent(event)) {
      return
    }

    event.stopPropagation()
    event.preventDefault()

    form.handleSubmit()
  }
}