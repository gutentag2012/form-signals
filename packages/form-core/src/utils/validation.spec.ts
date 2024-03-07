import { signal } from '@preact/signals-core'
import { describe, expect, it, vi } from 'vitest'
import {
  type ValidationErrorMap,
  type ValidatorEvents,
  validateWithValidators,
} from './validation'

describe('validation', () => {
  it('should not do anything when no validators are given', () => {
    const value = 'test'
    const event = 'onChange' as ValidatorEvents
    const asyncValidatorState = signal(undefined)
    const errorMap = signal<Partial<ValidationErrorMap>>({})
    const isValidating = signal(false)
    const accumulateErrors = false

    validateWithValidators(
      value,
      event,
      undefined,
      undefined,
      asyncValidatorState,
      errorMap,
      isValidating,
      accumulateErrors,
    )
    expect(errorMap.value).toEqual({})
  })
  it('should keep existing errors when no validators are given', () => {
    const value = 'test'
    const event = 'onChange' as ValidatorEvents
    const asyncValidatorState = signal(undefined)
    const errorMap = signal<Partial<ValidationErrorMap>>({
      sync: 'error',
      syncErrorEvent: event,
    })
    const isValidating = signal(false)
    const accumulateErrors = false

    validateWithValidators(
      value,
      event,
      undefined,
      undefined,
      asyncValidatorState,
      errorMap,
      isValidating,
      accumulateErrors,
    )
    expect(errorMap.value).toEqual({ sync: 'error', syncErrorEvent: event })
  })
  it('should validate a sync validator for a given event with a configured validator', () => {
    const value = 'test'
    const event = 'onSubmit' as ValidatorEvents
    const validate = vi.fn(() => 'error')
    const validator = {
      validate,
    }
    const asyncValidatorState = signal(undefined)
    const errorMap = signal<Partial<ValidationErrorMap>>({})
    const isValidating = signal(false)
    const accumulateErrors = false

    validateWithValidators(
      value,
      event,
      validator,
      undefined,
      asyncValidatorState,
      errorMap,
      isValidating,
      accumulateErrors,
    )

    expect(validate).toHaveBeenCalledWith(value)
    expect(errorMap.value).toEqual({ sync: 'error', syncErrorEvent: event })
  })
  it('should validate a sync validator for a given event with a function validator', () => {
    const value = 'test'
    const event = 'onChange' as ValidatorEvents
    const validate = vi.fn(() => 'error')
    const validator = validate
    const asyncValidatorState = signal(undefined)
    const errorMap = signal<Partial<ValidationErrorMap>>({})
    const isValidating = signal(false)
    const accumulateErrors = false

    validateWithValidators(
      value,
      event,
      validator,
      undefined,
      asyncValidatorState,
      errorMap,
      isValidating,
      accumulateErrors,
    )

    expect(validate).toHaveBeenCalledWith(value)
    expect(errorMap.value).toEqual({ sync: 'error', syncErrorEvent: event })
  })
  it('should stop validation on the first error when accumulateErrors is false', async () => {
    const value = 'test'
    const event = 'onChange' as ValidatorEvents
    const validatorSync = vi.fn(() => 'error')
    const validatorAsync = vi.fn(async () => 'error')
    const asyncValidatorState = signal(undefined)
    const errorMap = signal<Partial<ValidationErrorMap>>({})
    const isValidating = signal(false)
    const accumulateErrors = false

    await validateWithValidators(
      value,
      event,
      validatorSync,
      validatorAsync,
      asyncValidatorState,
      errorMap,
      isValidating,
      accumulateErrors,
    )
    expect(validatorSync).toHaveBeenCalledWith(value)
    expect(validatorAsync).not.toHaveBeenCalled()
    expect(errorMap.value).toEqual({ sync: 'error', syncErrorEvent: event })
  })
  it('should accumulate validation errors when accumulateErrors is true', async () => {
    const value = 'test'
    const event = 'onChange' as ValidatorEvents
    const validatorSync = vi.fn(() => 'error')
    const validatorAsync = vi.fn(async () => 'error')
    const asyncValidatorState = signal(undefined)
    const errorMap = signal<Partial<ValidationErrorMap>>({})
    const isValidating = signal(false)
    const accumulateErrors = true

    await validateWithValidators(
      value,
      event,
      validatorSync,
      validatorAsync,
      asyncValidatorState,
      errorMap,
      isValidating,
      accumulateErrors,
    )
    expect(validatorSync).toHaveBeenCalledWith(value)
    expect(validatorAsync).toHaveBeenCalledWith(value, expect.anything())
    expect(errorMap.value).toEqual({
      sync: 'error',
      syncErrorEvent: event,
      async: 'error',
      asyncErrorEvent: event,
    })
  })
  it('should abort async validations if there was another validation before the promise resolved', async () => {
    vi.useFakeTimers()
    const value = 'test'
    const event = 'onChange' as ValidatorEvents
    const validate = vi.fn(() => 'error')
    const asyncValidatorState = signal(undefined)
    const errorMap = signal<Partial<ValidationErrorMap>>({})
    const validator = async (_: unknown, signal: AbortSignal) => {
      await new Promise((resolve) => setTimeout(resolve, 100))
      if (signal.aborted) return
      validate()
      return 'error'
    }
    const isValidating = signal(false)
    const accumulateErrors = false

    const promise = validateWithValidators(
      value,
      event,
      undefined,
      validator,
      asyncValidatorState,
      errorMap,
      isValidating,
      accumulateErrors,
    )
    await vi.advanceTimersByTimeAsync(50)
    const promise2 = validateWithValidators(
      value,
      event,
      undefined,
      validator,
      asyncValidatorState,
      errorMap,
      isValidating,
      accumulateErrors,
    )
    await vi.advanceTimersByTimeAsync(100)
    await Promise.all([promise, promise2])

    expect(validate).toHaveBeenCalledOnce()
    expect(errorMap.value).toEqual({ async: 'error', asyncErrorEvent: event })
    expect(asyncValidatorState.value).not.toBeUndefined()
    vi.useRealTimers()
  })
  it('should debounce the validation', async () => {
    vi.useFakeTimers()
    const value = 'test'
    const event = 'onChange' as ValidatorEvents
    const validate = vi.fn(() => 'error')
    const validator = {
      validate: async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        return 'error'
      },
      debounceMs: 100,
    }
    const asyncValidatorState = signal(undefined)
    const errorMap = signal<Partial<ValidationErrorMap>>({})
    const isValidating = signal(false)
    const accumulateErrors = false

    const promise = validateWithValidators(
      value,
      event,
      undefined,
      validator,
      asyncValidatorState,
      errorMap,
      isValidating,
      accumulateErrors,
    )
    await vi.advanceTimersByTimeAsync(50)
    const promise2 = validateWithValidators(
      value,
      event,
      undefined,
      validator,
      asyncValidatorState,
      errorMap,
      isValidating,
      accumulateErrors,
    )
    await vi.advanceTimersByTimeAsync(200)
    await Promise.all([promise, promise2])

    expect(validate).not.toHaveBeenCalledTimes(1)
    expect(errorMap.value).toEqual({ async: 'error', asyncErrorEvent: event })

    vi.useRealTimers()
  })
  it('should ignore debounced validation if the validation was aborted before the debounce time', async () => {
    vi.useFakeTimers()
    const value = 'test'
    const event = 'onChange' as ValidatorEvents
    const validate = vi.fn(() => 'error')
    const validator = {
      validate: () => {
        validate()
        return 'error'
      },
      debounceMs: 100,
    }
    const asyncValidatorState = signal<AbortController | undefined>(undefined)
    const errorMap = signal<Partial<ValidationErrorMap>>({})
    const isValidating = signal(false)
    const accumulateErrors = false

    const promise = validateWithValidators(
      value,
      event,
      undefined,
      validator,
      asyncValidatorState,
      errorMap,
      isValidating,
      accumulateErrors,
    )
    asyncValidatorState.value?.abort()
    await vi.advanceTimersByTimeAsync(200)
    await promise

    expect(validate).not.toHaveBeenCalled()
    expect(errorMap.value).toEqual({})
    vi.useRealTimers()
  })
  it('should abort debounce if the validation was aborted before the debounce time', async () => {
    vi.useFakeTimers()
    const value = 'test'
    const event = 'onChange' as ValidatorEvents
    const validate = vi.fn(() => 'error')
    const validator = {
      validate: async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        validate()
        return 'error'
      },
      debounceMs: 100,
    }
    const asyncValidatorState = signal<AbortController | undefined>(undefined)
    const errorMap = signal<Partial<ValidationErrorMap>>({})
    const isValidating = signal(false)
    const accumulateErrors = false

    const promise = validateWithValidators(
      value,
      event,
      undefined,
      validator,
      asyncValidatorState,
      errorMap,
      isValidating,
      accumulateErrors,
    )
    await vi.advanceTimersByTimeAsync(100)
    asyncValidatorState.value?.abort()
    await vi.advanceTimersByTimeAsync(100)
    await promise

    expect(validate).toHaveBeenCalled()
    expect(errorMap.value).toEqual({})
    vi.useRealTimers()
  })
  it.each([
    ['onChange', 'disableOnChangeValidation'],
    ['onBlur', 'disableOnBlurValidation'],
  ])(
    'should allow to disable event %s validation via option %s',
    (event, optionKey) => {
      const value = 'test'
      const validate = vi.fn(() => 'error')
      const validator = {
        validate,
        [optionKey]: true,
      }
      const asyncValidatorState = signal(undefined)
      const errorMap = signal<Partial<ValidationErrorMap>>({})
      const isValidating = signal(false)
      const accumulateErrors = false

      validateWithValidators(
        value,
        event as ValidatorEvents,
        validator,
        undefined,
        asyncValidatorState,
        errorMap,
        isValidating,
        accumulateErrors,
      )

      expect(validate).not.toHaveBeenCalled()
      expect(errorMap.value).toEqual({})
    },
  )
  it('should allow to enable validation on mount', () => {
    const value = 'test'
    const validate = vi.fn(() => 'error')
    const validator = {
      validate,
      validateOnMount: true,
    }
    const asyncValidatorState = signal(undefined)
    const errorMap = signal<Partial<ValidationErrorMap>>({})
    const isValidating = signal(false)
    const accumulateErrors = false

    validateWithValidators(
      value,
      'onMount',
      validator,
      undefined,
      asyncValidatorState,
      errorMap,
      isValidating,
      accumulateErrors,
    )

    expect(validate).toHaveBeenCalled()
    expect(errorMap.value).toEqual({ sync: 'error', syncErrorEvent: 'onMount' })
  })
  it("should set the validation state while running async validation and reset it when it's done", async () => {
    vi.useFakeTimers()
    const value = 'test'
    const event = 'onChange' as ValidatorEvents
    const validator = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
      return 'error'
    })
    const asyncValidatorState = signal(undefined)
    const errorMap = signal<Partial<ValidationErrorMap>>({})
    const isValidating = signal(false)
    const accumulateErrors = false

    const promise = validateWithValidators(
      value,
      event,
      undefined,
      validator,
      asyncValidatorState,
      errorMap,
      isValidating,
      accumulateErrors,
    )
    expect(isValidating.value).toBe(true)
    await vi.advanceTimersByTimeAsync(100)
    await promise
    expect(isValidating.value).toBe(false)
    vi.useRealTimers()
  })
  it('should not reset the validation state when aborting async validation', async () => {
    // The reasoning behind this is, that the aborting of a signal is followed by a new validation
    vi.useFakeTimers()
    const value = 'test'
    const event = 'onChange' as ValidatorEvents
    const validator = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
      return 'error'
    })
    const asyncValidatorState = signal<AbortController | undefined>(undefined)
    const errorMap = signal<Partial<ValidationErrorMap>>({})
    const isValidating = signal(false)
    const accumulateErrors = false

    const promise = validateWithValidators(
      value,
      event,
      undefined,
      validator,
      asyncValidatorState,
      errorMap,
      isValidating,
      accumulateErrors,
    )
    expect(isValidating.value).toBe(true)
    asyncValidatorState.value?.abort()
    await vi.advanceTimersByTimeAsync(100)
    await promise
    expect(isValidating.value).toBe(true)
    vi.useRealTimers()
  })
  it('should not validate mount events when validator is unconfigured (a function)', () => {
    const value = 'test'
    const validator = vi.fn(() => 'error')
    const asyncValidatorState = signal(undefined)
    const errorMap = signal<Partial<ValidationErrorMap>>({})
    const isValidating = signal(false)
    const accumulateErrors = false

    validateWithValidators(
      value,
      'onMount',
      validator,
      undefined,
      asyncValidatorState,
      errorMap,
      isValidating,
      accumulateErrors,
    )

    expect(validator).not.toHaveBeenCalled()
    expect(errorMap.value).toEqual({})
  })
})
