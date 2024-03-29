import { effect, signal } from '@preact/signals-core'
import { describe, expect, it, vi } from 'vitest'
import {
  type ValidationErrorMap,
  type ValidatorEvents,
  clearSubmitEventErrors,
  validateWithValidators,
} from './validation'

describe('validation', () => {
  describe('validateWithValidators', () => {
    it('should not do anything when no validators are given', () => {
      const value = 'test'
      const event = 'onChange' as ValidatorEvents
      const asyncValidatorState = signal(undefined)
      const errorMap = signal<Partial<ValidationErrorMap>>({})
      const isValidating = signal(false)
      const accumulateErrors = false

      validateWithValidators(
        value,
        [],
        event,
        undefined,
        undefined,
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
        [],
        event,
        undefined,
        undefined,
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
      const asyncValidatorState = signal(undefined)
      const errorMap = signal<Partial<ValidationErrorMap>>({})
      const isValidating = signal(false)
      const accumulateErrors = false

      validateWithValidators(
        value,
        [],
        event,
        validate,
        {},
        undefined,
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
        [],
        event,
        validatorSync,
        undefined,
        validatorAsync,
        undefined,
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
        [],
        event,
        validatorSync,
        undefined,
        validatorAsync,
        undefined,
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
        [],
        event,
        undefined,
        undefined,
        validator,
        undefined,
        asyncValidatorState,
        errorMap,
        isValidating,
        accumulateErrors,
      )
      await vi.advanceTimersByTimeAsync(50)
      const promise2 = validateWithValidators(
        value,
        [],
        event,
        undefined,
        undefined,
        validator,
        undefined,
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
      const validator = async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        return 'error'
      }
      const asyncValidatorState = signal(undefined)
      const errorMap = signal<Partial<ValidationErrorMap>>({})
      const isValidating = signal(false)
      const accumulateErrors = false

      const promise = validateWithValidators(
        value,
        [],
        event,
        undefined,
        undefined,
        validator,
        {
          debounceMs: 100,
        },
        asyncValidatorState,
        errorMap,
        isValidating,
        accumulateErrors,
      )
      await vi.advanceTimersByTimeAsync(50)
      const promise2 = validateWithValidators(
        value,
        [],
        event,
        undefined,
        undefined,
        validator,
        {
          debounceMs: 100,
        },
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
      const validator = () => {
        validate()
        return 'error'
      }
      const asyncValidatorState = signal<AbortController | undefined>(undefined)
      const errorMap = signal<Partial<ValidationErrorMap>>({})
      const isValidating = signal(false)
      const accumulateErrors = false

      const promise = validateWithValidators(
        value,
        [],
        event,
        undefined,
        undefined,
        validator,
        {
          debounceMs: 100,
        },
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
      const validator = async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        validate()
        return 'error'
      }
      const asyncValidatorState = signal<AbortController | undefined>(undefined)
      const errorMap = signal<Partial<ValidationErrorMap>>({})
      const isValidating = signal(false)
      const accumulateErrors = false

      const promise = validateWithValidators(
        value,
        [],
        event,
        undefined,
        undefined,
        validator,
        {
          debounceMs: 100,
        },
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
        const validator = validate
        const asyncValidatorState = signal(undefined)
        const errorMap = signal<Partial<ValidationErrorMap>>({})
        const isValidating = signal(false)
        const accumulateErrors = false

        validateWithValidators(
          value,
          [],
          event as ValidatorEvents,
          validator,
          {
            [optionKey]: true,
          },
          undefined,
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
      const validator = validate
      const asyncValidatorState = signal(undefined)
      const errorMap = signal<Partial<ValidationErrorMap>>({})
      const isValidating = signal(false)
      const accumulateErrors = false

      validateWithValidators(
        value,
        [],
        'onMount',
        validator,
        {
          validateOnMount: true,
        },
        undefined,
        undefined,
        asyncValidatorState,
        errorMap,
        isValidating,
        accumulateErrors,
      )

      expect(validate).toHaveBeenCalled()
      expect(errorMap.value).toEqual({
        sync: 'error',
        syncErrorEvent: 'onMount',
      })
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
        [],
        event,
        undefined,
        undefined,
        validator,
        undefined,
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
        [],
        event,
        undefined,
        undefined,
        validator,
        undefined,
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
        [],
        'onMount',
        validator,
        undefined,
        undefined,
        undefined,
        asyncValidatorState,
        errorMap,
        isValidating,
        accumulateErrors,
      )

      expect(validator).not.toHaveBeenCalled()
      expect(errorMap.value).toEqual({})
    })
    it('should only update sync errors if they have changed', () => {
      const value = 'test'
      const validator = vi.fn(() => 'error')
      const asyncValidatorState = signal(undefined)
      const errorMap = signal<Partial<ValidationErrorMap>>({
        sync: 'error',
        syncErrorEvent: 'onChange',
      })
      const isValidating = signal(false)
      const accumulateErrors = false

      const changedFn = vi.fn()
      effect(() => {
        changedFn(errorMap.value)
      })
      expect(changedFn).toHaveBeenCalledTimes(1)

      validateWithValidators(
        value,
        [],
        'onChange',
        validator,
        undefined,
        undefined,
        undefined,
        asyncValidatorState,
        errorMap,
        isValidating,
        accumulateErrors,
      )

      expect(errorMap.value).toEqual({
        sync: 'error',
        syncErrorEvent: 'onChange',
      })
      expect(changedFn).toHaveBeenCalledTimes(1)

      validateWithValidators(
        value,
        [],
        'onSubmit',
        validator,
        undefined,
        undefined,
        undefined,
        asyncValidatorState,
        errorMap,
        isValidating,
        accumulateErrors,
      )

      expect(errorMap.value).toEqual({
        sync: 'error',
        syncErrorEvent: 'onSubmit',
      })
      expect(changedFn).toHaveBeenCalledTimes(2)
    })
    it('should only update async errors if they have changed', async () => {
      const value = 'test'
      const validator = vi.fn(async () => 'error')
      const asyncValidatorState = signal(undefined)
      const errorMap = signal<Partial<ValidationErrorMap>>({
        async: 'error',
        asyncErrorEvent: 'onChange',
      })
      const isValidating = signal(false)
      const accumulateErrors = false

      const changedFn = vi.fn()
      effect(() => {
        changedFn(errorMap.value)
      })
      expect(changedFn).toHaveBeenCalledTimes(1)

      await validateWithValidators(
        value,
        [],
        'onChange',
        undefined,
        undefined,
        validator,
        undefined,
        asyncValidatorState,
        errorMap,
        isValidating,
        accumulateErrors,
      )

      expect(errorMap.value).toEqual({
        async: 'error',
        asyncErrorEvent: 'onChange',
      })
      expect(changedFn).toHaveBeenCalledTimes(1)

      await validateWithValidators(
        value,
        [],
        'onSubmit',
        undefined,
        undefined,
        validator,
        undefined,
        asyncValidatorState,
        errorMap,
        isValidating,
        accumulateErrors,
      )

      expect(errorMap.value).toEqual({
        async: 'error',
        asyncErrorEvent: 'onSubmit',
      })
      expect(changedFn).toHaveBeenCalledTimes(2)
    })
    it('should only run onChange validation if the field was touched before if configured', () => {
      const value = 'test'
      const validate = vi.fn(() => 'error')
      const validator = validate
      const asyncValidatorState = signal(undefined)
      const errorMap = signal<Partial<ValidationErrorMap>>({})
      const isValidating = signal(false)
      const accumulateErrors = false

      validateWithValidators(
        value,
        [],
        'onChange',
        validator,
        {
          validateOnChangeIfTouched: true,
        },
        undefined,
        undefined,
        asyncValidatorState,
        errorMap,
        isValidating,
        accumulateErrors,
        false,
      )

      expect(validate).not.toHaveBeenCalled()
      expect(errorMap.value).toEqual({})

      validateWithValidators(
        value,
        [],
        'onChange',
        validator,
        {
          validateOnChangeIfTouched: true,
        },
        undefined,
        undefined,
        asyncValidatorState,
        errorMap,
        isValidating,
        accumulateErrors,
        true,
      )

      expect(validate).toHaveBeenCalled()
      expect(errorMap.value).toEqual({
        sync: 'error',
        syncErrorEvent: 'onChange',
      })
    })
    it('should not run onChange validation even after touch if the onChange validation is disabled completely', () => {
      const value = 'test'
      const validate = vi.fn(() => 'error')
      const validator = validate
      const asyncValidatorState = signal(undefined)
      const errorMap = signal<Partial<ValidationErrorMap>>({})
      const isValidating = signal(false)
      const accumulateErrors = false

      validateWithValidators(
        value,

        [],
        'onChange',
        validator,
        {
          disableOnChangeValidation: true,
          validateOnChangeIfTouched: true,
        },
        undefined,
        undefined,
        asyncValidatorState,
        errorMap,
        isValidating,
        accumulateErrors,
        false,
      )

      expect(validate).not.toHaveBeenCalled()
      expect(errorMap.value).toEqual({})

      validateWithValidators(
        value,

        [],
        'onChange',
        validator,
        {
          disableOnChangeValidation: true,
          validateOnChangeIfTouched: true,
        },
        undefined,
        undefined,
        asyncValidatorState,
        errorMap,
        isValidating,
        accumulateErrors,
        true,
      )

      expect(validate).not.toHaveBeenCalled()
      expect(errorMap.value).toEqual({})
    })
    it("should validate with value mixins", () => {
      const value = 'test'
      const validate = vi.fn(() => 'error')
      const validator = validate
      const asyncValidatorState = signal(undefined)
      const errorMap = signal<Partial<ValidationErrorMap>>({})
      const isValidating = signal(false)
      const accumulateErrors = false
      const valueMixins = [1, 2, 3]

      validateWithValidators(
        value,
        valueMixins,
        'onChange',
        validator,
        undefined,
        undefined,
        undefined,
        asyncValidatorState,
        errorMap,
        isValidating,
        accumulateErrors,
        false,
      )

      expect(validate).toHaveBeenCalledWith([value, ...valueMixins])
    })
  })

  describe('clearSubmitEventErrors', () => {
    it('should not change the error map if there are no submit errors', () => {
      const errorMap = signal<Partial<ValidationErrorMap>>({
        sync: 'error',
        syncErrorEvent: 'onChange',
        async: 'error',
        asyncErrorEvent: 'onChange',
      })

      const updated = vi.fn()
      effect(() => {
        updated(errorMap.value)
      })
      // Reset this, since the effect triggers once in the beginning
      updated.mockReset()

      clearSubmitEventErrors(errorMap)

      expect(updated).not.toHaveBeenCalled()
    })
    it('should clear the sync error if it was a submit error', () => {
      const errorMap = signal<Partial<ValidationErrorMap>>({
        sync: 'error',
        syncErrorEvent: 'onSubmit',
      })

      clearSubmitEventErrors(errorMap)

      expect(errorMap.value).toEqual({
        sync: undefined,
        syncErrorEvent: undefined,
      })
    })
    it('should clear the async error if it was a submit error', () => {
      const errorMap = signal<Partial<ValidationErrorMap>>({
        async: 'error',
        asyncErrorEvent: 'onSubmit',
      })

      clearSubmitEventErrors(errorMap)

      expect(errorMap.value).toEqual({
        async: undefined,
        asyncErrorEvent: undefined,
      })
    })
    it('should clear both errors if they were submit errors', () => {
      const errorMap = signal<Partial<ValidationErrorMap>>({
        sync: 'error',
        syncErrorEvent: 'onSubmit',
        async: 'error',
        asyncErrorEvent: 'onSubmit',
      })

      clearSubmitEventErrors(errorMap)

      expect(errorMap.value).toEqual({
        sync: undefined,
        syncErrorEvent: undefined,
        async: undefined,
        asyncErrorEvent: undefined,
      })
    })
  })
})
