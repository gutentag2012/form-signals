import { type Signal, batch } from '@preact/signals-core'

//region Types
export const ValidatorEventsArray = [
  'onChange',
  'onBlur',
  'onSubmit',
  'onMount',
] as const
export type ValidatorEvents = (typeof ValidatorEventsArray)[number]

export type ValidationError = string | undefined | null | false
export type ValidationErrorMap = {
  sync?: ValidationError
  syncErrorEvent?: ValidatorEvents
  async?: ValidationError
  asyncErrorEvent?: ValidatorEvents
}

// TODO Add mixins to add more values to the validation
interface ValidatorBase {
  /**
   * Whether this validator should not run when the value changes
   */
  disableOnChangeValidation?: boolean
  /**
   * Whether this validator should not run when the input loses focus
   */
  disableOnBlurValidation?: boolean
  /**
   * Whether this validator should run when the form is submitted
   */
  validateOnMount?: boolean
  /**
   * If this is true, the onChange validation will only run if the field was already touched
   */
  validateOnChangeIfTouched?: boolean
}

export type ValidatorSyncFn<TValue> = (value: TValue) => ValidationError
export interface ValidatorSyncConfigured<TValue> extends ValidatorBase {
  validate: ValidatorSyncFn<TValue>
}
export type ValidatorSync<TValue> =
  | ValidatorSyncConfigured<TValue>
  | ValidatorSyncFn<TValue>

export type ValidatorAsyncFn<TValue> = (
  value: TValue,
  abortSignal: AbortSignal,
) => Promise<ValidationError> | ValidationError
export interface ValidatorAsyncConfigured<TValue> extends ValidatorBase {
  validate: ValidatorAsyncFn<TValue>
  debounceMs?: number
}
export type ValidatorAsync<TValue> =
  | ValidatorAsyncConfigured<TValue>
  | ValidatorAsyncFn<TValue>

//endregion

const shouldValidateEvent = (
  event: ValidatorEvents,
  validator: ValidatorSync<never> | ValidatorAsync<never>,
  isTouched?: boolean,
) => {
  if (typeof validator === 'function') return event !== 'onMount'
  if (event === 'onChange') return !validator.disableOnChangeValidation && (!validator.validateOnChangeIfTouched || isTouched)
  if (event === 'onBlur') return !validator.disableOnBlurValidation
  if (event === 'onMount') return validator.validateOnMount
  return true
}

const validateWithDebounce = async <TValue>(
  validator: ValidatorAsyncConfigured<TValue>,
  value: TValue,
  abortSignal: AbortSignal,
) => {
  return new Promise<ValidationError>((resolve) => {
    // Set the timeout for the debounced time (we do not need to clear the timeout, since we are using an AbortController)
    setTimeout(async () => {
      // If the validation was aborted before this debouncing, we resolve
      if (abortSignal.aborted) {
        return resolve(undefined)
      }

      const error = await validator.validate(value, abortSignal)
      resolve(error)
    }, validator.debounceMs)
  })
}

function validateSync<TValue>(
  value: TValue,
  event: ValidatorEvents,
  validatorSync: ValidatorSync<TValue> | undefined,
  errorMap: Signal<Partial<ValidationErrorMap>>,
  isTouched?: boolean,
) {
  // Without a validator, we don't need to validate
  if (!validatorSync) return false

  // Check if this event should be validated
  if (!shouldValidateEvent(event, validatorSync, isTouched)) {
    return false
  }

  // Get and assign the error / reset previous error
  const error =
    typeof validatorSync !== 'function'
      ? validatorSync.validate(value)
      : validatorSync(value)

  const currentErrorMap = errorMap.peek()
  if (
    error === currentErrorMap.sync &&
    currentErrorMap.syncErrorEvent === event
  ) {
    return !!error
  }

  errorMap.value = {
    ...currentErrorMap,
    sync: error,
    syncErrorEvent: event,
  }

  return !!error
}

async function validateAsync<TValue>(
  value: TValue,
  event: ValidatorEvents,
  validatorAsync: ValidatorAsync<TValue> | undefined,
  previousAbortController: Signal<AbortController | undefined>,
  errorMap: Signal<Partial<ValidationErrorMap>>,
  isValidating: Signal<boolean>,
  isTouched?: boolean,
) {
  // Without a validator, we don't need to validate
  if (!validatorAsync) return

  // Check if this event should be validated
  if (!shouldValidateEvent(event, validatorAsync, isTouched)) {
    return
  }

  // Create a new AbortController for this round of async validation
  previousAbortController.peek()?.abort()
  const abortController = new AbortController()
  previousAbortController.value = abortController
  // Start the validation
  isValidating.value = true

  const error = await (typeof validatorAsync !== 'function' &&
  validatorAsync.debounceMs
    ? validateWithDebounce(validatorAsync, value, abortController.signal)
    : typeof validatorAsync !== 'function'
      ? validatorAsync.validate(value, abortController.signal)
      : validatorAsync(value, abortController.signal))
  // If the validation was aborted during the async validation, we just ignore the result
  // NOTE: We do not need to set the isValidating to false, since there is a newer validation round which will take care of that
  if (abortController.signal.aborted) return

  // Assign the final errors
  batch(() => {
    isValidating.value = false

    const currentErrorMap = errorMap.peek()
    if (
      error === currentErrorMap.async &&
      currentErrorMap.asyncErrorEvent === event
    ) {
      return
    }

    errorMap.value = {
      ...errorMap.peek(),
      async: error,
      asyncErrorEvent: event,
    }
  })
}

/**
 * Validate a value with the given validators synchronously and/either/or asynchronously
 * @param value The value to validate
 * @param event The event that triggered the validation (used to check if the validation should run)
 * @param validatorSync The synchronous validator
 * @param validatorAsync The asynchronous validator
 * @param previousAbortController The previous abort controller to abort the previous async validation
 * @param errorMap The error map to update
 * @param isValidating The state to keep track of the async validation
 * @param accumulateErrors Whether to accumulate errors or not
 * @param isToched Whether the field is touched or not
 */
export function validateWithValidators<TValue>(
  value: TValue,
  event: ValidatorEvents,
  validatorSync: ValidatorSync<TValue> | undefined,
  validatorAsync: ValidatorAsync<TValue> | undefined,
  previousAbortController: Signal<AbortController | undefined>,
  errorMap: Signal<Partial<ValidationErrorMap>>,
  isValidating: Signal<boolean>,
  accumulateErrors?: boolean,
  isToched?: boolean,
) {
  const failedSyncValidation = validateSync(
    value,
    event,
    validatorSync,
    errorMap,
    isToched
  )
  if (!accumulateErrors && failedSyncValidation) {
    return
  }

  return validateAsync(
    value,
    event,
    validatorAsync,
    previousAbortController,
    errorMap,
    isValidating,
    isToched
  )
}

export const clearSubmitEventErrors = (
  errorMap: Signal<Partial<ValidationErrorMap>>,
) => {
  const newValue = { ...errorMap.peek() }
  const changed =
    newValue.syncErrorEvent === 'onSubmit' ||
    newValue.asyncErrorEvent === 'onSubmit'
  if (newValue.syncErrorEvent === 'onSubmit') {
    newValue.sync = undefined
    newValue.syncErrorEvent = undefined
  }
  if (newValue.asyncErrorEvent === 'onSubmit') {
    newValue.async = undefined
    newValue.asyncErrorEvent = undefined
  }
  if (!changed) return

  errorMap.value = newValue
}
