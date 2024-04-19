import { type Signal, batch } from '@preact/signals-core'

//region Types
/**
 * A synchronous validator function that returns an error message if the value is invalid
 *
 * @template TValue The type of the value to validate
 *
 * @param value The value to validate
 *
 * @returns An error message if the value is invalid, or undefined if the value is valid
 *
 * @example
 * ```ts
 * const required: ValidatorSync<string> = (value: string) => value && 'This field is required'
 * ```
 */
export type ValidatorSync<
  TValue,
  TMixins extends readonly any[] = never[],
> = TMixins extends never[]
  ? (value: TValue) => ValidationError
  : (value: [TValue, ...TMixins]) => ValidationError

/**
 * An asynchronous validator function that returns an error message if the value is invalid
 *
 * @template TValue The type of the value to validate
 *
 * @param value The value to validate
 * @param abortSignal The signal that is aborted when the validation should be cancelled
 *
 * @returns A promise that resolves with an error message if the value is invalid, or undefined if the value is valid
 *
 * @example
 * ```ts
 * const required: ValidatorAsync<string> = async (value: string) => value && 'This field is required'
 * ```
 */
export type ValidatorAsync<
  TValue,
  TMixins extends readonly any[] = never[],
> = TMixins extends never[]
  ? (
      value: TValue,
      abortSignal: AbortSignal,
    ) => Promise<ValidationError> | ValidationError
  : (
      value: [TValue, ...TMixins],
      abortSignal: AbortSignal,
    ) => Promise<ValidationError> | ValidationError

/**
 * A validator adapter that creates synchronous and asynchronous validators from a given schema
 *
 * @template TValue The type of the value to validate
 *
 * @alias ValidatorAdapter
 *
 * @property sync Creates a synchronous validator from a given schema
 * @property async Creates an asynchronous validator from a given schema
 *
 * @example
 * ```ts
 * const adapter: ValidatorAdapter = {
 *  sync: (schema: number) => (value: number) => value <= schema && "Value should be greater than ${schema}",
 *  async: (schema: number) => async (value: number) => value <= schema && "Value should be greater than ${schema}",
 * }
 * ```
 */
export interface ValidatorAdapter {
  sync<TValue, TMixins extends readonly any[] = never[]>(
    schema: any,
  ): ValidatorSync<TValue, TMixins>
  async<TValue, TMixins extends readonly any[] = never[]>(
    schema: any,
  ): ValidatorAsync<TValue, TMixins>
}

/**
 * This is a type used to define a schema for a validator.
 * It is a workaround to allow for different types of schemas based on an overriding the {@link ValidatorSchemaType} type
 *
 * @template TValue The type of the value to validate
 *
 * @alias ValidatorSchemaType
 *
 * @property () A function which returns the type of the schema
 *
 * @example
 * ```ts
 * declare module '@formsignals/form-core' {
 *   interface ValidatorSchemaType<TValue> {
 *     (): number
 *   }
 * }
 * ```
 */
// @ts-expect-error The generic type is supposed to be used by the adapter libs
export interface ValidatorSchemaType<TValue, TMixin> {
  // biome-ignore lint/style/useShorthandFunctionType: We need this to be an interface to allow for it to be overridden
  (): never
}

const ValidatorEventsArray = [
  'onChange',
  'onBlur',
  'onSubmit',
  'onMount',
  'server',
] as const

/**
 * The events that can trigger a validation
 */
export type ValidatorEvents = (typeof ValidatorEventsArray)[number]

/**
 * A validation error message
 */
export type ValidationError = string | undefined | null | false
/**
 * A map of validation errors for both sync and async validators
 */
export type ValidationErrorMap = {
  sync?: ValidationError
  syncErrorEvent?: ValidatorEvents
  async?: ValidationError
  asyncErrorEvent?: ValidatorEvents
  general?: ValidationError
}

/**
 * Options used during validation
 *
 * @alias ValidatorOptions
 *
 * @property disableOnChangeValidation Whether this validator should not run when the value changes
 * @property disableOnBlurValidation Whether this validator should not run when the input loses focus
 * @property validateOnMount Whether this validator should run when the form is submitted
 * @property validateOnChangeIfTouched If this is true, the onChange validation will only run if the field was already touched
 */
export interface ValidatorOptions {
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

/**
 * Options used during async validation
 *
 * @alias ValidatorAsyncOptions
 *
 * @extends ValidatorOptions
 *
 * @property debounceMs The time in milliseconds to debounce the async validation
 */
export interface ValidatorAsyncOptions extends ValidatorOptions {
  /**
   * The time in milliseconds to debounce the async validation
   */
  debounceMs?: number
  /**
   * If true, all errors on validators will be accumulated and validation will not stop on the first error.
   * If there is a synchronous error, it will be displayed, no matter if the async validator is still running.
   */
  accumulateErrors?: boolean
}
//endregion

function shouldValidateEvent(
  event: ValidatorEvents,
  options?: ValidatorOptions,
  isTouched?: boolean,
): boolean {
  if (!options) return event !== 'onMount'
  if (event === 'onChange')
    return (
      !options.disableOnChangeValidation &&
      (!options.validateOnChangeIfTouched || !!isTouched)
    )
  if (event === 'onBlur') return !options.disableOnBlurValidation
  if (event === 'onMount') return !!options.validateOnMount
  return true
}

function validateWithDebounce<TValue, TMixins extends readonly any[] = never[]>(
  validator: ValidatorAsync<TValue, TMixins>,
  validatorOptions: ValidatorAsyncOptions,
  value: TValue,
  mixins: TMixins,
  abortSignal: AbortSignal,
) {
  return new Promise<ValidationError>((resolve) => {
    // Set the timeout for the debounced time (we do not need to clear the timeout, since we are using an AbortController)
    setTimeout(async () => {
      // If the validation was aborted before this debouncing, we resolve
      if (abortSignal.aborted) {
        return resolve(undefined)
      }

      const error = await validator(
        !mixins?.length ? value : ([value, ...mixins] as any),
        abortSignal,
      )
      resolve(error)
    }, validatorOptions.debounceMs)
  })
}

function validateSync<TValue, TMixins extends readonly any[] = never[]>(
  value: TValue,
  mixins: TMixins,
  event: ValidatorEvents,
  validatorSync: ValidatorSync<TValue, TMixins> | undefined,
  validatorSyncOptions: ValidatorOptions | undefined,
  errorMap: Signal<Partial<ValidationErrorMap>>,
  isTouched?: boolean,
) {
  // Without a validator, we don't need to validate
  if (!validatorSync) return false

  // Check if this event should be validated
  if (!shouldValidateEvent(event, validatorSyncOptions, isTouched)) {
    return false
  }

  // Get and assign the error / reset previous error
  const error = validatorSync(
    !mixins?.length ? value : ([value, ...mixins] as any),
  )

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

async function validateAsync<TValue, TMixins extends readonly any[] = never[]>(
  value: TValue,
  mixins: TMixins,
  event: ValidatorEvents,
  validatorAsync: ValidatorAsync<TValue, TMixins> | undefined,
  validatorAsyncOptions: ValidatorAsyncOptions | undefined,
  previousAbortController: Signal<AbortController | undefined>,
  errorMap: Signal<Partial<ValidationErrorMap>>,
  isValidating: Signal<boolean>,
  isTouched?: boolean,
) {
  // Without a validator, we don't need to validate
  if (!validatorAsync) return

  // Check if this event should be validated
  if (!shouldValidateEvent(event, validatorAsyncOptions, isTouched)) {
    return
  }

  // Create a new AbortController for this round of async validation
  previousAbortController.peek()?.abort()
  const abortController = new AbortController()
  previousAbortController.value = abortController
  // Start the validation
  isValidating.value = true

  const error = await (validatorAsyncOptions?.debounceMs
    ? validateWithDebounce(
        validatorAsync,
        validatorAsyncOptions,
        value,
        mixins,
        abortController.signal,
      )
    : validatorAsync(
        !mixins?.length ? value : ([value, ...mixins] as any),
        abortController.signal,
      ))

  // If the validation was aborted during the async validation, we just ignore the result
  // NOTE: We do not need to set the isValidating to false, since there is a newer validation round that will take care of that
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
 *
 * @param value - The value to validate
 * @param mixins - The mixins to pass to the validators
 * @param event - The event that triggered the validation (used to check if the validation should run)
 * @param validatorSync - The synchronous validator
 * @param validatorSyncOptions - Options for the synchronous validator
 * @param validatorAsync - The asynchronous validator
 * @param validatorAsyncOptions - Options for the asynchronous validator
 * @param previousAbortController - The previous abort controller to abort the previous async validation
 * @param errorMap - The error map to update
 * @param isValidating - The state to keep track of the async validation
 * @param isTouched - Whether the field is touched or not
 *
 * @note
 * The result of the validation is written to the {@link errorMap} and {@link isValidating} signals
 */
export function validateWithValidators<
  TValue,
  TMixins extends readonly any[] = never[],
>(
  value: TValue,
  mixins: TMixins,
  event: ValidatorEvents,
  validatorSync: ValidatorSync<TValue, TMixins> | undefined,
  validatorSyncOptions: ValidatorOptions | undefined,
  validatorAsync: ValidatorAsync<TValue, TMixins> | undefined,
  validatorAsyncOptions: ValidatorAsyncOptions | undefined,
  previousAbortController: Signal<AbortController | undefined>,
  errorMap: Signal<Partial<ValidationErrorMap>>,
  isValidating: Signal<boolean>,
  isTouched?: boolean,
) {
  const failedSyncValidation = validateSync(
    value,
    mixins,
    event,
    validatorSync,
    validatorSyncOptions,
    errorMap,
    isTouched,
  )
  if (!validatorAsyncOptions?.accumulateErrors && failedSyncValidation) {
    return
  }

  return validateAsync(
    value,
    mixins,
    event,
    validatorAsync,
    validatorAsyncOptions,
    previousAbortController,
    errorMap,
    isValidating,
    isTouched,
  )
}

/**
 * Clears the errors within a given error map if the error event is 'onSubmit'
 *
 * @param errorMap - The error map to clear the errors from
 */
export const clearSubmitEventErrors = (
  errorMap: Signal<Partial<ValidationErrorMap>>,
): void => {
  const newValue = { ...errorMap.peek() }

  if (
    !newValue.syncErrorEvent &&
    !newValue.asyncErrorEvent &&
    !newValue.general
  ) {
    return
  }

  if (newValue.syncErrorEvent) {
    newValue.sync = undefined
    newValue.syncErrorEvent = undefined
  }
  if (newValue.asyncErrorEvent) {
    newValue.async = undefined
    newValue.asyncErrorEvent = undefined
  }
  if (newValue.general) {
    newValue.general = undefined
  }

  errorMap.value = newValue
}

export function getValidatorFromAdapter<
  TValue,
  TMixins extends readonly any[] = never[],
>(
  adapter?: ValidatorAdapter,
  schema?:
    | ValidatorSync<TValue, TMixins>
    | ReturnType<ValidatorSchemaType<TValue, TMixins>>,
  isAsync?: false,
): ValidatorSync<TValue, TMixins>
export function getValidatorFromAdapter<
  TValue,
  TMixins extends readonly any[] = never[],
>(
  adapter?: ValidatorAdapter,
  schema?:
    | ValidatorAsync<TValue, TMixins>
    | ReturnType<ValidatorSchemaType<TValue, TMixins>>,
  isAsync?: true,
): ValidatorAsync<TValue, TMixins>
export function getValidatorFromAdapter<
  TValue,
  TMixins extends readonly any[] = never[],
>(
  adapter?: ValidatorAdapter,
  schema?:
    | ValidatorAsync<TValue, TMixins>
    | ValidatorSync<TValue, TMixins>
    | ReturnType<ValidatorSchemaType<TValue, TMixins>>,
  isAsync?: boolean,
): ValidatorSync<TValue, TMixins> | ValidatorAsync<TValue, TMixins> {
  const shouldUseSchema = adapter && schema && typeof schema !== 'function'
  const validator = shouldUseSchema
    ? isAsync
      ? adapter.async(schema)
      : adapter.sync(schema)
    : schema

  if (validator && typeof validator !== 'function') {
    throw new Error(
      `The ${isAsync ? 'async' : 'sync'} validator must be a function`,
    )
  }

  return validator as
    | ValidatorSync<TValue, TMixins>
    | ValidatorAsync<TValue, TMixins>
}

type ZodIssues = Array<{
  message: string
  path: (string | number)[]
}>

/**
 * Transforms errors from different schema validation libraries into error that can be consumed by the form
 */
export const ErrorTransformers = {
  zod: (zodErrors: ZodIssues) => {
    const errorMap: Record<string, string> = {}
    for (const issue of zodErrors) {
      const path = issue.path.join('.')
      errorMap[path] = issue.message
    }
    return errorMap
  },
}
