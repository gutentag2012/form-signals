import { describe, expect, it, vi } from 'vitest'
import { FieldLogic } from './FieldLogic'
import { FormLogic } from './FormLogic'
import { Truthy } from './utils/utils'

describe('FormLogic', () => {
  it('should have the correct initial state', () => {
    const form = new FormLogic()
    form.mount()

    expect(form.fields.length).toBe(0)

    expect(form.data.value).toStrictEqual({})
    expect(form.json.value).toStrictEqual({})
    expect(form.errors.value).toStrictEqual([])

    expect(form.isValidForm.value).toBe(true)
    expect(form.isValidFields.value).toBe(true)
    expect(form.isValid.value).toBe(true)

    expect(form.isTouched.value).toBe(false)
    expect(form.isDirty.value).toBe(false)

    expect(form.submitCountSuccessful.value).toBe(0)
    expect(form.submitCountUnsuccessful.value).toBe(0)
    expect(form.submitCount.value).toBe(0)

    expect(form.isValidatingForm.value).toBe(false)
    expect(form.isValidatingFields.value).toBe(false)
    expect(form.isValidating.value).toBe(false)

    expect(form.isSubmitting.value).toBe(false)
    expect(form.isSubmitted.value).toBe(false)

    expect(form.canSubmit.value).toBe(true)
  })
  describe('state (form)', () => {
    it('should have a list of all fields registered on it', () => {
      const form = new FormLogic<{ name: string }>()
      const field = new FieldLogic(form, 'name')
      expect(form.fields.length).toBe(1)
      expect(form.fields[0]).toBe(field)
    })
    it('should loose a field once it is unmounted without preserving its value', () => {
      const form = new FormLogic<{ name: string }>()
      const field = new FieldLogic(form, 'name')
      field.mount()
      expect(form.fields.length).toBe(1)

      field.unmount()
      expect(form.fields.length).toBe(0)
    })
    it('should keep a field once it is unmounted if preserving its value', () => {
      const form = new FormLogic<{ name: string }>()
      const field = new FieldLogic(form, 'name', {
        preserveValueOnUnmount: true,
      })
      field.mount()
      expect(form.fields.length).toBe(1)

      field.unmount()
      expect(form.fields.length).toBe(1)
    })
    it('should no register a field that is already registered', () => {
      const form = new FormLogic<{ name: string }>()
      new FieldLogic(form, 'name')
      expect(form.fields.length).toBe(1)

      new FieldLogic(form, 'name')
      expect(form.fields.length).toBe(1)
    })
    it('should set the value of the form if a field with default value is registered', () => {
      const form = new FormLogic<{ name: string }>()
      expect(form.data.value.name).toBeUndefined()
      new FieldLogic(form, 'name', { defaultValue: 'default' })
      expect(form.data.value.name.value).toBe('default')
    })

    it('should have reactive data', () => {
      const form = new FormLogic<{ name: string }>()
      const field = new FieldLogic(form, 'name')
      field.mount()
      expect(form.data.value.name.value).toBeUndefined()

      field.handleChange('value')
      expect(form.data.value.name.value).toBe('value')
    })
    it('should have a json representation of its data', () => {
      const form = new FormLogic({
        defaultValues: {
          name: '',
          array: [1, 2, 3],
        },
      })
      const field = new FieldLogic(form, 'name')
      field.mount()
      expect(form.json.value).toStrictEqual({ name: '', array: [1, 2, 3] })

      form.data.value.array.value[0].signal.value = 9
      field.handleChange('value')
      expect(form.json.value).toStrictEqual({
        name: 'value',
        array: [9, 2, 3],
      })
    })

    it('should be touched if any field is touched', () => {
      const form = new FormLogic<{ name: string }>()
      const field = new FieldLogic(form, 'name')
      field.mount()

      field.handleBlur()
      expect(form.isTouched.value).toBe(true)
    })
    it('should be dirty if any field is dirty', () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'default',
        },
      })
      const field = new FieldLogic(form, 'name')
      field.mount()

      field.handleChange('value')
      expect(form.isDirty.value).toBe(true)

      field.handleChange('default')
      expect(form.isDirty.value).toBe(false)
    })

    it('should increment the submit count on submit', async () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'default',
        },
        validators: [
          {
            validate: (value) => (value.name === 'test' ? undefined : 'error'),
          },
        ],
      })
      await form.mount()

      await form.handleSubmit()
      expect(form.submitCount.value).toBe(1)
      expect(form.submitCountUnsuccessful.value).toBe(1)

      form.data.value.name.value = 'test'
      await form.handleSubmit()
      expect(form.submitCount.value).toBe(2)
      expect(form.submitCountSuccessful.value).toBe(1)
    })

    it('should be submitting the form if it is submitting', async () => {
      vi.useFakeTimers()
      const form = new FormLogic({
        defaultValues: {
          name: 'default',
        },
        validators: [
          {
            isAsync: true,
            validate: async (value) => {
              await new Promise((resolve) => setTimeout(resolve, 100))
              return value.name === 'test' ? undefined : 'error'
            },
          },
        ],
      })
      await form.mount()

      const submitPromise = form.handleSubmit()
      expect(form.isSubmitting.value).toBe(true)
      await vi.advanceTimersByTimeAsync(100)
      await submitPromise
      expect(form.isSubmitting.value).toBe(false)
      vi.useRealTimers()
    })

    it('should not can submit if the form is submitting', async () => {
      vi.useFakeTimers()
      const form = new FormLogic({
        defaultValues: {
          name: 'default',
        },
        validators: [
          {
            isAsync: true,
            validate: async () => {
              await new Promise((resolve) => setTimeout(resolve, 100))
              return undefined
            },
          },
        ],
      })
      await form.mount()

      const submitPromise = form.handleSubmit()
      expect(form.canSubmit.value).toBe(false)
      await vi.advanceTimersByTimeAsync(100)
      await submitPromise
      expect(form.canSubmit.value).toBe(true)
      vi.useRealTimers()
    })
    it('should not can submit if the form is validating', async () => {
      vi.useFakeTimers()
      const form = new FormLogic({
        defaultValues: {
          name: 'default',
        },
        validators: [
          {
            isAsync: true,
            validate: async () => {
              await new Promise((resolve) => setTimeout(resolve, 100))
              return undefined
            },
            onChange: true,
            onSubmit: false,
          },
        ],
      })
      await form.mount()

      form.data.value.name.value = 'test'
      await vi.advanceTimersByTimeAsync(50)
      expect(form.canSubmit.value).toBe(false)
      await vi.advanceTimersByTimeAsync(100)
      expect(form.canSubmit.value).toBe(true)
      vi.useRealTimers()
    })
    it('should not can submit if the form is invalid', async () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'default',
        },
        validators: [
          {
            validate: () => 'error',
          },
        ],
      })
      await form.mount()

      await form.handleSubmit()
      expect(form.canSubmit.value).toBe(false)
    })
  })
  describe('state (fields)', () => {
    it('should be valid if all fields are valid', () => {
      const form = new FormLogic<{ name: string }>()
      new FieldLogic(form, 'name')
      expect(form.isValidFields.value).toBe(true)
    })
    it('should be invalid if any field is invalid', () => {
      const form = new FormLogic<{ name: string }>()
      const field = new FieldLogic(form, 'name', {
        validators: [
          {
            validate: (v) => v.length >= 3 && 'error',
            onChange: true,
            onSubmit: false,
          },
        ],
      })
      field.mount()

      field.handleChange('value')
      expect(form.isValidFields.value).toBe(false)

      field.handleChange('')
      expect(form.isValidFields.value).toBe(true)
    })
    it('should be validating if any field is validating', async () => {
      vi.useFakeTimers()

      const form = new FormLogic<{ name: string }>()
      const field = new FieldLogic(form, 'name', {
        validators: [
          {
            validate: (v) =>
              new Promise((r) =>
                setTimeout(() => r(v.length >= 3 && 'error'), 100),
              ),
            isAsync: true,
          },
        ],
      })
      await field.mount()

      field.handleChange('value')
      expect(form.isValidatingFields.value).toBe(false)
      const validatingPromise = field.validateForEvent('onSubmit')
      expect(form.isValidatingFields.value).toBe(true)

      vi.advanceTimersByTime(100)
      await validatingPromise
      expect(form.isValidatingFields.value).toBe(false)

      vi.useRealTimers()
    })
  })
  describe('validation', () => {
    it('should trigger submit validation for all fields on submit as well as the form', async () => {
      const form = new FormLogic<{ name: string; other: string }>({
        validators: [
          {
            validate: (value) => {
              return [
                !value.name && 'name is required',
                !value.other && 'other is required',
              ]
                .filter(Truthy)
                .join(',')
            },
          },
        ],
      })
      const field1 = new FieldLogic(form, 'name', {
        validators: [{ validate: () => 'error' }],
      })
      const field2 = new FieldLogic(form, 'other', {
        validators: [{ validate: () => 'error' }],
      })
      await form.mount()
      await field1.mount()
      await field2.mount()

      expect(form.errors.value).toEqual([])
      expect(field1.errors.value).toEqual([])
      expect(field2.errors.value).toEqual([])
      await form.handleSubmit()
      expect(field1.errors.value).toEqual(['error'])
      expect(field2.errors.value).toEqual(['error'])
      expect(form.errors.value).toEqual(['name is required,other is required'])
    })
    it('should validate on change if any of the values within the form changed', () => {
      const form = new FormLogic<{ name: string }>({
        validators: [
          {
            validate: (value) => (value.name === 'test' ? undefined : 'error'),
            onChange: true,
            onSubmit: false,
          },
        ],
      })
      form.mount()
      const field = new FieldLogic(form, 'name')
      field.mount()

      field.handleChange('test')
      expect(form.errors.value).toEqual([])
      field.handleChange('testA')
      expect(form.errors.value).toEqual(['error'])
    })
    it('should validate on blur if any of the fields within the form blurred', async () => {
      const form = new FormLogic<{ name: string }>({
        validators: [
          {
            validate: (value) => (value.name === 'test' ? undefined : 'error'),
            onBlur: true,
            onSubmit: false,
          },
        ],
      })
      await form.mount()
      const field = new FieldLogic(form, 'name')
      await field.mount()

      await field.handleBlur()
      expect(form.errors.value).toEqual(['error'])
      field.handleChange('test')
      expect(form.errors.value).toEqual(['error'])
      await field.handleBlur()
      expect(form.errors.value).toEqual([])
    })
    it('should validate on mount', async () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'test',
          other: undefined,
        },
        validators: [
          {
            validate: (value) => {
              return [
                !value.name && 'name is required',
                !value.other && 'other is required',
              ]
                .filter(Truthy)
                .join(',')
            },
            onMount: true,
            onSubmit: false,
          },
        ],
      })
      await form.mount()

      expect(form.errors.value).toEqual(['other is required'])
    })
    it('should work with async validators', async () => {
      vi.useFakeTimers()
      const form = new FormLogic<{ name: string }>({
        validators: [
          {
            isAsync: true,
            validate: async () => {
              await new Promise((resolve) => setTimeout(resolve, 100))
              return 'error'
            },
          },
        ],
      })

      const validationPromise = form.validateForEvent('onSubmit')
      expect(form.errors.value).toEqual([])
      expect(form.isValidating.value).toBe(true)

      await vi.advanceTimersToNextTimerAsync()
      await validationPromise

      expect(form.errors.value).toEqual(['error'])
      expect(form.isValidating.value).toBe(false)

      vi.useRealTimers()
    })
    it('should debounce the validation', async () => {
      vi.useFakeTimers()

      const validateFn = vi.fn()
      const form = new FormLogic({
        defaultValues: {
          name: 'test',
        },
        validators: [
          {
            isAsync: true,
            validate: async (value) => {
              validateFn(value.name)
              await new Promise((resolve) => setTimeout(resolve, 100))
              return value.name === 'test' ? undefined : 'error'
            },
            onChange: true,
            onSubmit: false,
            debounceMs: 100,
          },
        ],
      })
      form.mount()

      form.data.value.name.value = 'value'
      await vi.advanceTimersByTime(50)
      form.data.value.name.value = 'value2'
      await vi.advanceTimersByTime(200)

      expect(form.errors.value).toEqual([])
      expect(validateFn).toHaveBeenCalledOnce()

      vi.useRealTimers()
    })
    it('should reset onSubmit errors after any change', async () => {
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: 'test',
        },
        validators: [
          {
            validate: (value) => (value.name === 'test' ? undefined : 'error'),
          },
        ],
      })
      await form.mount()

      form.data.value.name.value = 'test'
      await form.handleSubmit()
      expect(form.errors.peek()).toEqual([])

      form.data.value.name.value = 'asd'
      await form.handleSubmit()
      expect(form.errors.peek()).toEqual(['error'])

      form.data.value.name.value = 'asdd'
      expect(form.errors.peek()).toEqual([])
    })
    it('should only accept the first validator if there are multiple sync validators for the same event', () => {
      const validateFn = vi.fn(() => 'error')
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: '',
        },
        validators: [
          {
            validate: validateFn,
            onChange: true,
          },
          {
            validate: validateFn,
            onChange: true,
          },
        ],
      })
      form.mount()

      form.data.value.name.value = 'test'

      expect(validateFn).toHaveBeenCalledOnce()
      expect(form.errors.value).toEqual(['error'])
    })
    it('should reset the change errors after change', () => {
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: '',
        },
        validators: [
          {
            validate: (value) => (value.name === 'test' ? undefined : 'error'),
            onBlur: false,
            onSubmit: false,
            onMount: false,
            onChange: true,
          },
        ],
      })
      form.mount()

      form.data.value.name.value = 'test1'

      expect(form.errors.value).toEqual(['error'])
      form.data.value.name.value = 'test'
      expect(form.errors.value).toEqual([])
    })
    it('should reset the blur errors after blur', () => {
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: '',
        },
        validators: [
          {
            validate: (value) => (value.name === 'test' ? undefined : 'error'),
            onChange: false,
            onSubmit: false,
            onMount: false,
            onBlur: true,
          },
        ],
      })
      form.mount()
      form.handleBlur()

      expect(form.errors.value).toEqual(['error'])
      form.data.value.name.value = 'test'
      form.handleBlur()

      expect(form.errors.value).toEqual([])
    })
    it('should not reset the blur errors if no new blur occurred', () => {
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: '',
        },
        validators: [
          {
            validate: (value) => (value.name === 'test' ? undefined : 'error'),
            onBlur: true,
          },
        ],
      })
      form.mount()
      form.handleBlur()

      expect(form.errors.value).toEqual(['error'])
      form.data.value.name.value = 'test'

      expect(form.errors.value).toEqual(['error'])
    })
    it('should abort async validations if there was another validation before the promise resolved', async () => {
      vi.useFakeTimers()
      const validateFn = vi.fn()
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: '',
        },
        validators: [
          {
            isAsync: true,
            validate: async (value, abortSignal) => {
              await new Promise((resolve) => setTimeout(resolve, 100))
              if (abortSignal.aborted) return 'aborted'
              validateFn(value)
              return value.name === 'test' ? undefined : 'error'
            },
          },
        ],
      })
      form.mount()

      form.data.value.name.value = 'test1'
      const firstSubmitPromise = form.handleSubmit()
      vi.advanceTimersByTime(50)
      const secondSubmitPromise = form.handleSubmit()
      vi.advanceTimersByTime(100)

      await Promise.all([firstSubmitPromise, secondSubmitPromise])

      expect(validateFn).toHaveBeenCalledOnce()

      vi.useRealTimers()
    })
    it('should abort other async validations if one validation failed unless configured otherwise', async () => {
      vi.useFakeTimers()
      const validateCalledFn = vi.fn()
      const validateRanFn = vi.fn()
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: '',
        },
        validators: [
          {
            isAsync: true,
            validate: async (_, abortSignal) => {
              validateCalledFn()
              await new Promise((resolve) => setTimeout(resolve, 100))
              if (abortSignal.aborted) return 'aborted'
              validateRanFn()
              return 'error'
            },
          },
          {
            isAsync: true,
            validate: async (_, abortSignal) => {
              validateCalledFn()
              await new Promise((resolve) => setTimeout(resolve, 200))
              if (abortSignal.aborted) return 'aborted'
              validateRanFn()
              return 'error'
            },
          },
        ],
      })
      form.mount()

      form.data.value.name.value = 'test1'
      const promise = form.handleSubmit()
      await vi.advanceTimersToNextTimerAsync()
      await vi.advanceTimersToNextTimerAsync()
      await promise

      expect(validateCalledFn).toHaveBeenCalledTimes(2)
      expect(validateRanFn).toHaveBeenCalledTimes(1)

      vi.useRealTimers()
    })
    it('should abort other debounced async validations if one validation failed unless configured otherwise', async () => {
      vi.useFakeTimers()
      const validateCalledFn = vi.fn()
      const validateRanFn = vi.fn()
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: '',
        },
        validators: [
          {
            isAsync: true,
            validate: async (_, abortSignal) => {
              validateCalledFn()
              await new Promise((resolve) => setTimeout(resolve, 150))
              if (abortSignal.aborted) return 'aborted'
              validateRanFn()
              return 'error'
            },
            debounceMs: 100,
          },
          {
            isAsync: true,
            validate: async (_, abortSignal) => {
              validateCalledFn()
              await new Promise((resolve) => setTimeout(resolve, 100))
              if (abortSignal.aborted) return 'aborted'
              validateRanFn()
              return 'error'
            },
            debounceMs: 50,
          },
        ],
      })
      form.mount()

      form.data.value.name.value = 'test1'
      const promise = form.handleSubmit()
      // Debounced first
      await vi.advanceTimersByTimeAsync(50)
      // Debounced second + finished first
      await vi.advanceTimersByTimeAsync(100)
      // Finished second
      await vi.advanceTimersByTimeAsync(150)
      await promise

      expect(validateCalledFn).toHaveBeenCalledTimes(2)
      expect(validateRanFn).toHaveBeenCalledTimes(1)

      vi.useRealTimers()
    })
    it('should not run async validations if the sync validation already failed unless configured otherwise', async () => {
      vi.useFakeTimers()
      const validateFn = vi.fn()
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: '',
        },
        validators: [
          {
            isAsync: true,
            validate: async (value) => {
              validateFn(value)
              await new Promise((resolve) => setTimeout(resolve, 100))
              return value.name === 'test' ? undefined : 'error'
            },
          },
          {
            validate: (value) => (value.name === 'test' ? undefined : 'error'),
          },
        ],
      })
      await form.mount()

      form.data.value.name.value = 'test1'
      const promise = form.handleSubmit()
      await vi.advanceTimersByTime(100)
      await promise

      expect(validateFn).toBeCalledTimes(0)

      vi.useRealTimers()
    })
    it('should accumulate other async validations if configured', async () => {
      vi.useFakeTimers()
      const validateFn = vi.fn()
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: '',
        },
        accumulateErrors: true,
        validators: [
          {
            isAsync: true,
            validate: async (value) => {
              validateFn(value)
              await new Promise((resolve) => setTimeout(resolve, 100))
              return value.name === 'test' ? undefined : 'error'
            },
          },
          {
            validate: (value) => (value.name === 'test' ? undefined : 'error'),
          },
        ],
      })
      await form.mount()

      form.data.value.name.value = 'test1'
      const promise = form.handleSubmit()
      await vi.advanceTimersByTime(100)
      await promise

      expect(validateFn).toBeCalledTimes(1)

      vi.useRealTimers()
    })
    it('should allow a validator to run on every event', () => {
      const validate = vi.fn(() => undefined)
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: '',
        },
        validators: [
          {
            validate,
            onBlur: true,
            onChange: true,
            onSubmit: true,
            onMount: true,
          },
        ],
      })
      form.mount()

      form.handleBlur()
      form.data.value.name.value = 'test'
      form.handleSubmit()

      expect(validate).toHaveBeenCalledTimes(4)
    })
    it('should not validate if unmounted', async () => {
      const validate = vi.fn(() => undefined)
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: '',
        },
        validators: [
          {
            validate,
            onMount: true,
            onSubmit: true,
            onChange: true,
            onBlur: true,
          },
        ],
      })

      form.data.value.name.value = 'asd'
      await form.handleBlur()
      await form.handleSubmit()

      expect(validate).toHaveBeenCalledTimes(0)
    })
  })
  describe('handleSubmit', () => {
    it('should not handle submit if the form is invalid', () => {
      const handleSubmit = vi.fn()
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: 'test',
        },
        onSubmit: handleSubmit,
      })
      form.mount()

      form.handleSubmit()
      expect(handleSubmit).not.toHaveBeenCalled()
    })
    it('should not handle submit if the form is submitting', async () => {
      vi.useFakeTimers()
      const handleSubmit = vi.fn()
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: 'test',
        },
        validators: [
          {
            isAsync: true,
            validate: async () => {
              await new Promise((resolve) => setTimeout(resolve, 100))
              return undefined
            },
          },
        ],
        onSubmit: handleSubmit,
      })
      await form.mount()

      const promiseFirst = form.handleSubmit()
      await vi.advanceTimersByTimeAsync(50)
      const promiseSecond = form.handleSubmit()
      await vi.advanceTimersByTimeAsync(100)
      await Promise.all([promiseFirst, promiseSecond])

      expect(handleSubmit).toHaveBeenCalledTimes(1)
      vi.useRealTimers()
    })
    it('should not handle submit if the form is validating', async () => {
      vi.useFakeTimers()
      const handleSubmit = vi.fn()
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: 'test',
        },
        validators: [
          {
            isAsync: true,
            validate: async () => {
              await new Promise((resolve) => setTimeout(resolve, 100))
              return undefined
            },
            onSubmit: false,
            onChange: true,
          },
        ],
        onSubmit: handleSubmit,
      })
      await form.mount()

      form.data.value.name.value = 'test1'
      await vi.advanceTimersByTimeAsync(50)
      const submitPromise = form.handleSubmit()
      await vi.advanceTimersByTimeAsync(100)
      await submitPromise

      expect(handleSubmit).toHaveBeenCalledTimes(0)
      vi.useRealTimers()
    })
    it('should call the handle submit function with the unsignalified data', async () => {
      const handleSubmit = vi.fn()
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: 'test',
        },
        onSubmit: handleSubmit,
      })
      await form.mount()

      await form.handleSubmit()
      expect(handleSubmit).toHaveBeenCalledWith({ name: 'test' })
    })
    it('should only set submitting to false after the async submit function resolved', async () => {
      vi.useFakeTimers()
      const handleSubmit = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
      })
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: 'test',
        },
        onSubmit: handleSubmit,
      })
      await form.mount()

      const promise = form.handleSubmit()
      expect(form.isSubmitting.value).toBe(true)
      await vi.advanceTimersByTimeAsync(100)
      await promise
      expect(form.isSubmitting.value).toBe(false)
      vi.useRealTimers()
    })
    it('should mark the submission as unsuccessful if the submit function throws', async () => {
      const error = new Error('error')
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: 'test',
        },
        onSubmit: () => {
          throw error
        },
      })
      await form.mount()

      await expect(form.handleSubmit()).rejects.toThrow(error)
      expect(form.submitCountUnsuccessful.value).toBe(1)
    })
    it('should mark the submission as unsuccessful if the submit async function throws', async () => {
      vi.useFakeTimers()
      const error = new Error('error')
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: 'test',
        },
        onSubmit: async () => {
          await new Promise((resolve) => setTimeout(resolve, 100))
          throw error
        },
      })
      await form.mount()

      // noinspection JSVoidFunctionReturnValueUsed
      const submitPromise = expect(form.handleSubmit()).rejects.toThrow(error)
      expect(form.submitCountUnsuccessful.value).toBe(0)
      await vi.advanceTimersByTimeAsync(100)
      await submitPromise
      expect(form.submitCountUnsuccessful.value).toBe(1)
      vi.useRealTimers()
    })
  })
  describe('helperMethods', () => {
    it('should not validate changes when unmounted', async () => {
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: 'test',
        },
        validators: [
          {
            validate: () => 'error',
            onChange: true,
            onSubmit: false,
          },
        ],
      })
      await form.mount()
      await form.unmount()
      form.data.value.name.value = 'test1'
      expect(form.errors.value).toEqual([])
    })
    it('should reset to the default state', async () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'test',
          deep: {
            value: 1,
          },
        },
        validators: [
          {
            validate: () => 'error',
            onChange: true,
            onSubmit: false,
          },
        ],
      })
      await form.mount()
      const field = new FieldLogic(form, 'deep.value' as const, {
        validators: [
          {
            validate: () => 'error',
            onChange: true,
            onSubmit: false,
          },
        ],
      })
      await field.mount()
      await field.handleBlur()

      await form.handleSubmit()

      field.handleChange(2)
      form.data.value.name.value = 'test1'

      expect(form.data.value.name.value).toBe('test1')
      expect(form.data.value.deep.value.value.value).toBe(2)
      expect(form.errors.value).toEqual(['error'])
      expect(field.errors.value).toEqual(['error'])
      expect(form.isTouched.value).toBe(true)
      expect(form.isDirty.value).toBe(true)
      expect(form.submitCount.value).toBe(1)

      form.reset()

      expect(form.data.value.name.value).toBe('test')
      expect(form.data.value.deep.value.value.value).toBe(1)
      expect(form.errors.value).toEqual([])
      expect(field.errors.value).toEqual([])
      expect(form.isTouched.value).toBe(false)
      expect(form.isDirty.value).toBe(false)
      expect(form.submitCount.value).toBe(0)
    })
    it('should insert a value into a form value array', () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      })
      form.mount()
      form.insertValueInArray('array', 1, 4)
      expect(form.json.value.array).toEqual([1, 4, 3])
    })
    it('should not do anything when trying to insert a value into a form value that is not an array', () => {
      const form = new FormLogic({
        defaultValues: {
          array: 1,
        },
      })
      form.mount()
      form.insertValueInArray('array', 1, 4 as never)
      expect(form.data.value.array.value).toEqual(1)
    })
    it('should touch a field when inserting a value into a form value array if a field is attached', () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      })
      form.mount()
      const field = new FieldLogic(form, 'array')
      field.mount()
      form.insertValueInArray('array', 1, 4, { shouldTouch: true })
      expect(field.isTouched.value).toBe(true)
    })
    it('should not touch a field when inserting a value into a form value array if no field is attached', () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      })
      form.mount()
      expect(() =>
        form.insertValueInArray('array', 1, 4, { shouldTouch: true }),
      ).not.toThrow()
    })
    it('should remove a value from a form value array', () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      })
      form.mount()
      form.removeValueFromArray('array', 1)
      expect(form.json.value.array).toEqual([1, 3])
    })
    it('should not do anything when trying to remove a value from a form value that is not an array', () => {
      const form = new FormLogic({
        defaultValues: {
          array: 1,
        },
      })
      form.mount()
      form.removeValueFromArray('array', 1 as never)
      expect(form.data.value.array.value).toEqual(1)
    })
    it('should touch a field when removing a value from a form value array if a field is attached', () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      })
      form.mount()
      const field = new FieldLogic(form, 'array')
      field.mount()
      form.removeValueFromArray('array', 1, { shouldTouch: true })
      expect(field.isTouched.value).toBe(true)
    })
    it('should not touch a field when removing a value from a form value array if no field is attached', () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      })
      form.mount()
      expect(() =>
        form.removeValueFromArray('array', 1, { shouldTouch: true }),
      ).not.toThrow()
    })
    it('should push a value into a form value array', () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      })
      form.mount()
      form.pushValueToArray('array', 4)
      expect(form.json.value.array).toEqual([1, 2, 3, 4])
    })
    it('should not do anything when trying to push a value into a form value that is not an array', () => {
      const form = new FormLogic({
        defaultValues: {
          array: 1,
        },
      })
      form.mount()
      form.pushValueToArray('array', 4 as never)
      expect(form.data.value.array.value).toEqual(1)
    })
    it('should touch a field when pushing a value into a form value array if a field is attached', () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      })
      form.mount()
      const field = new FieldLogic(form, 'array')
      field.mount()
      form.pushValueToArray('array', 4, { shouldTouch: true })
      expect(field.isTouched.value).toBe(true)
    })
    it('should swap two values in a form value array', () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      })
      form.mount()
      form.swapValuesInArray('array', 1, 2)
      expect(form.json.value.array).toEqual([1, 3, 2])
    })
    it('should not do anything when trying to swap two values in a form value that is not an array', () => {
      const form = new FormLogic({
        defaultValues: {
          array: 1,
        },
      })
      form.mount()
      form.swapValuesInArray('array', 1 as never, 2 as never)
      expect(form.data.value.array.value).toEqual(1)
    })
    it('should touch a field when swapping two values in a form value array if a field is attached', () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      })
      form.mount()
      const field = new FieldLogic(form, 'array')
      field.mount()
      form.swapValuesInArray('array', 1, 2, { shouldTouch: true })
      expect(field.isTouched.value).toBe(true)
    })
    it('should not touch a field when swapping two values in a form value array if no field is attached', () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      })
      form.mount()
      expect(() =>
        form.swapValuesInArray('array', 1, 2, { shouldTouch: true }),
      ).not.toThrow()
    })
  })
})
