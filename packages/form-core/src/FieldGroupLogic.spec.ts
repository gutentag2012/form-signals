import { effect } from '@preact/signals-core'
import { describe, expect, it, vi } from 'vitest'
import { FieldLogic } from './FieldLogic'
import { FormLogic } from './FormLogic'
import {
  ErrorTransformers,
  type ValidatorAdapter,
  type ValidatorAsync,
  type ValidatorSync,
} from './utils'
import { Truthy } from './utils/internal.utils'

const adapter: ValidatorAdapter = {
  sync<TValue, TMixins extends readonly any[] = never[]>(
    schema: number,
  ): ValidatorSync<TValue, TMixins> {
    // @ts-expect-error This is just for testing, so we dont need to handle mixins
    return ({ d: value }) => {
      if (typeof value === 'number')
        return value <= schema
          ? undefined
          : `Value must be less than or equal to ${schema}`
      return 'Value must be a number'
    }
  },
  async<TValue, TMixins extends readonly any[] = never[]>(
    schema: number,
  ): ValidatorAsync<TValue, TMixins> {
    // @ts-expect-error This is just for testing, so we dont need to handle mixins
    return async ({ d: value }) => {
      await new Promise((resolve) => setTimeout(resolve, 100))
      if (typeof value === 'number')
        return value <= schema
          ? undefined
          : `Value must be less than or equal to ${schema}`
      return 'Value must be a number'
    }
  },
}

const mixinAdapter: ValidatorAdapter = {
  sync<TValue, TMixins extends readonly any[] = never[]>(
    schema: number,
  ): ValidatorSync<TValue, TMixins> {
    // @ts-expect-error This is just for testing, so we dont need to handle mixins
    return ([{ test: value }, ...mixins]: [TValue, ...TMixins]) => {
      const sum = mixins.reduce((acc, mixin) => acc + mixin, schema)
      if (typeof value === 'number')
        return value <= sum
          ? undefined
          : `Value must be less than or equal to ${sum}`
      return 'Value must be a number'
    }
  },
  async<TValue, TMixins extends readonly any[] = never[]>(
    schema: number,
  ): ValidatorAsync<TValue, TMixins> {
    // @ts-expect-error This is just for testing, so we dont need to handle mixins
    return async ([{ test: value }, ...mixins]: [TValue, ...TMixins]) => {
      await new Promise((resolve) => setTimeout(resolve, 100))
      const sum = mixins.reduce((acc, mixin) => acc + mixin, schema)
      if (typeof value === 'number')
        return value <= sum
          ? undefined
          : `Value must be less than or equal to ${sum}`
      return 'Value must be a number'
    }
  },
}

describe('FieldGroupLogic', () => {
  it('should have the correct initial state', () => {
    const form = new FormLogic({
      defaultValues: { a: 0, b: 'asd', c: new Date() },
    })
    const group = form.getOrCreateFieldGroup(['a', 'b'])

    expect(group.isMounted.value).toBeFalsy()
    group.mount()
    expect(group.isMounted.value).toBeTruthy()

    expect(group.form).toBe(form)
    expect(group.fields.value.length).toBe(0)
    expect(group.members).toEqual(['a', 'b'])

    expect(group.data.value).toStrictEqual({ a: 0, b: 'asd' })
    expect(group.errors.value).toStrictEqual([])

    expect(group.isValidFieldGroup.value).toBe(true)
    expect(group.isValidFields.value).toBe(true)
    expect(group.isValid.value).toBe(true)

    expect(group.isDirty.value).toBe(false)
    expect(group.dirtyFields.value).toStrictEqual([])

    expect(group.submitCountSuccessful.value).toBe(0)
    expect(group.submitCountUnsuccessful.value).toBe(0)
    expect(group.submitCount.value).toBe(0)

    expect(group.isValidatingFieldGroup.value).toBe(false)
    expect(group.isValidatingFields.value).toBe(false)
    expect(group.isValidating.value).toBe(false)

    expect(group.isSubmitting.value).toBe(false)
    expect(group.isSubmitted.value).toBe(false)

    expect(group.canSubmit.value).toBe(true)
  })
  describe('state (group)', () => {
    it('should have a list of all fields registered on it', () => {
      const form = new FormLogic<{ name: string }>()
      const field = new FieldLogic(form, 'name')
      const group = form.getOrCreateFieldGroup(['name'])
      expect(group.fields.peek().length).toBe(1)
      expect(group.fields.peek()[0]).toBe(field)
    })
    it('should loose a fields value once it is unmounted if configured', () => {
      const form = new FormLogic<{ name: string }>()
      const field = new FieldLogic(form, 'name', {
        removeValueOnUnmount: true,
      })
      field.mount()
      field.data.value = 'asd'
      const group = form.getOrCreateFieldGroup(['name'])
      expect(group.fields.peek().length).toBe(1)
      expect(group.data.value.name).toBe('asd')

      field.unmount()
      expect(group.fields.peek().length).toBe(0)
      expect(group.data.value.name).toBeUndefined()
    })
    it('should keep a fields value once it is unmounted', () => {
      const form = new FormLogic<{ name: string }>()
      const field = new FieldLogic(form, 'name')
      field.mount()
      field.data.value = 'asd'
      const group = form.getOrCreateFieldGroup(['name'])
      expect(group.fields.peek().length).toBe(1)
      expect(group.data.value.name).toBe('asd')

      field.unmount()
      expect(group.fields.peek().length).toBe(0)
      expect(group.data.value.name).toBe('asd')
    })
    it('should set the value of the group if a field with default value is registered', () => {
      const form = new FormLogic<{ name: string }>()
      const group = form.getOrCreateFieldGroup(['name'])
      expect(group.data.value.name).toBeUndefined()
      new FieldLogic(form, 'name', { defaultValue: 'default' })
      expect(group.data.value.name).toBe('default')
    })

    it('should have reactive data', () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const field = new FieldLogic(form, 'name')
      field.mount()
      const group = form.getOrCreateFieldGroup(['name'])
      group.mount()

      const didUpdate = vi.fn()
      effect(() => {
        didUpdate(group.data.value)
      })
      didUpdate.mockReset()

      field.handleChange('asd')
      expect(didUpdate).toHaveBeenCalledOnce()
    })
    // Currently this is not the case, but once it is, this test should check it
    it.skip("should not update the group data if a different field's value is updated", () => {
      const form = new FormLogic<{ name: string; other: string }>()
      form.mount()
      const field = new FieldLogic(form, 'name')
      field.mount()
      const group = form.getOrCreateFieldGroup(['other'])
      group.mount()

      const didUpdate = vi.fn()
      effect(() => {
        didUpdate(group.data.value)
      })
      didUpdate.mockReset()

      field.handleChange('asd')

      expect(didUpdate).not.toHaveBeenCalled()
    })

    it('should be dirty if any field is dirty', () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'default',
        },
      })
      form.mount()
      const field = new FieldLogic(form, 'name')
      field.mount()
      const group = form.getOrCreateFieldGroup(['name'])
      group.mount()

      field.handleChange('value')
      expect(group.isDirty.value).toBe(true)

      field.handleChange('default')
      expect(group.isDirty.value).toBe(false)
    })
    it('should be dirty if elements have been added to an array field', () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      })
      form.mount()
      const field = new FieldLogic(form, 'array')
      field.mount()
      const group = form.getOrCreateFieldGroup(['array'])
      group.mount()

      expect(group.isDirty.value).toBe(false)
      field.pushValueToArray(4)
      expect(group.isDirty.value).toBe(true)
    })
    it('should also consider newly added fields when calculating dirty', () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'default',
          other: 'default',
        },
      })
      form.mount()
      const field = new FieldLogic(form, 'name')
      field.mount()
      const group = form.getOrCreateFieldGroup(['name', 'other'])
      group.mount()

      expect(group.isDirty.value).toBe(false)

      const newField = new FieldLogic(form, 'other')
      newField.mount()

      expect(group.isDirty.value).toBe(false)

      newField.handleChange('value')
      expect(group.isDirty.value).toBe(true)
    })

    it('should increment the submit count on submit', async () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'default',
        },
      })
      await form.mount()
      const group = form.getOrCreateFieldGroup(['name'], {
        validator: (value) => (value.name === 'test' ? undefined : 'error'),
      })
      await group.mount()

      await group.handleSubmit()
      expect(group.submitCount.value).toBe(1)
      expect(group.submitCountUnsuccessful.value).toBe(1)

      form.data.value.name.value = 'test'
      await group.handleSubmit()
      expect(group.submitCount.value).toBe(2)
      expect(group.submitCountSuccessful.value).toBe(1)
    })

    it('should be submitting the form if it is submitting', async () => {
      vi.useFakeTimers()
      const form = new FormLogic({
        defaultValues: {
          name: 'default',
        },
      })
      await form.mount()
      const group = form.getOrCreateFieldGroup(['name'], {
        validatorAsync: async (value) => {
          await new Promise((resolve) => setTimeout(resolve, 100))
          return value.name === 'test' ? undefined : 'error'
        },
      })
      await group.mount()

      const submitPromise = group.handleSubmit()
      expect(group.isSubmitting.value).toBe(true)
      await vi.advanceTimersByTimeAsync(100)
      await submitPromise
      expect(group.isSubmitting.value).toBe(false)
      vi.useRealTimers()
    })

    it('should not can submit if the form is submitting', async () => {
      vi.useFakeTimers()
      const form = new FormLogic({
        defaultValues: {
          name: 'default',
        },
      })
      await form.mount()
      const group = form.getOrCreateFieldGroup(['name'], {
        validatorAsync: async () => {
          await new Promise((resolve) => setTimeout(resolve, 100))
          return undefined
        },
      })
      await group.mount()

      const submitPromise = group.handleSubmit()
      expect(group.canSubmit.value).toBe(false)
      await vi.advanceTimersByTimeAsync(100)
      await submitPromise
      expect(group.canSubmit.value).toBe(true)
      vi.useRealTimers()
    })
    it('should not can submit if the form is validating', async () => {
      vi.useFakeTimers()
      const form = new FormLogic({
        defaultValues: {
          name: 'default',
        },
      })
      await form.mount()
      const group = form.getOrCreateFieldGroup(['name'], {
        validatorAsync: async () => {
          await new Promise((resolve) => setTimeout(resolve, 100))
          return undefined
        },
      })
      await group.mount()

      form.data.value.name.value = 'test'
      await vi.advanceTimersByTimeAsync(50)
      expect(group.canSubmit.value).toBe(false)
      await vi.advanceTimersByTimeAsync(100)
      expect(group.canSubmit.value).toBe(true)
      vi.useRealTimers()
    })
    it('should not can submit if the form is invalid', async () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'default',
        },
      })
      await form.mount()
      const group = form.getOrCreateFieldGroup(['name'], {
        validator: () => 'error',
      })
      await group.mount()

      await group.handleSubmit()
      expect(group.canSubmit.value).toBe(false)
    })
    it('should not can submit if the form is disabled', async () => {
      const form = new FormLogic<{ name: string }>()
      await form.mount()
      const group = form.getOrCreateFieldGroup(['name'])
      await group.mount()
      group.disable()
      expect(group.canSubmit.value).toBe(false)
    })

    it('should be possible to enable and disable the group', () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const group = form.getOrCreateFieldGroup(['name'])
      group.mount()
      group.disable()
      expect(group.disabled.value).toBe(true)
      group.enable()
      expect(group.disabled.value).toBe(false)
    })
  })
  describe('state (fields)', () => {
    it('should be valid if all fields are valid', () => {
      const form = new FormLogic<{ name: string }>()
      const group = form.getOrCreateFieldGroup(['name'])
      new FieldLogic(form, 'name')
      expect(group.isValidFields.value).toBe(true)
    })
    it('should be invalid if any field is invalid', () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const field = new FieldLogic(form, 'name', {
        validator: (v) => v.length >= 3 && 'error',
      })
      field.mount()
      const group = form.getOrCreateFieldGroup(['name'])
      group.mount()

      field.handleChange('value')
      expect(group.isValidFields.value).toBe(false)

      field.handleChange('')
      expect(group.isValidFields.value).toBe(true)
    })
    it('should be validating if any field is validating', async () => {
      vi.useFakeTimers()
      const form = new FormLogic<{ name: string }>()
      await form.mount()
      const field = new FieldLogic(form, 'name', {
        validatorAsync: (v) =>
          new Promise((r) =>
            setTimeout(() => r(v.length >= 3 && 'error'), 100),
          ),
        validatorAsyncOptions: {
          disableOnChangeValidation: true,
        },
      })
      await field.mount()
      const group = form.getOrCreateFieldGroup(['name'])
      await group.mount()

      field.handleChange('value')
      expect(group.isValidatingFields.value).toBe(false)
      const validatingPromise = field.validateForEvent('onSubmit')
      expect(group.isValidatingFields.value).toBe(true)

      vi.advanceTimersByTime(100)
      await validatingPromise
      expect(group.isValidatingFields.value).toBe(false)

      vi.useRealTimers()
    })
  })
  describe('validation', () => {
    it('should trigger submit validation for all fields on submit as well as the group', async () => {
      const form = new FormLogic<{ name: string; other: string }>()
      const field1 = new FieldLogic(form, 'name', {
        validator: () => 'error',
      })
      const field2 = new FieldLogic(form, 'other', {
        validator: () => 'error',
      })
      await form.mount()
      await field1.mount()
      await field2.mount()
      const group = form.getOrCreateFieldGroup(['name', 'other'], {
        validator: (value) => {
          return [
            !value.name && 'name is required',
            !value.other && 'other is required',
          ]
            .filter(Truthy)
            .join(',')
        },
      })
      await group.mount()

      expect(group.errors.value).toEqual([])
      expect(field1.errors.value).toEqual([])
      expect(field2.errors.value).toEqual([])
      await group.handleSubmit()
      expect(field1.errors.value).toEqual(['error'])
      expect(field2.errors.value).toEqual(['error'])
      expect(group.errors.value).toEqual(['name is required,other is required'])
    })
    it('should validate on change if any of the values within the group changed', () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const field = new FieldLogic(form, 'name')
      field.mount()
      const group = form.getOrCreateFieldGroup(['name'], {
        validator: (value) => (value.name === 'test' ? undefined : 'error'),
      })
      group.mount()

      field.handleChange('test')
      expect(group.errors.value).toEqual([])
      field.handleChange('testA')
      expect(group.errors.value).toEqual(['error'])
    })
    it('should validate on mount', async () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'test',
          other: undefined,
        },
      })
      await form.mount()
      const group = form.getOrCreateFieldGroup(['name', 'other'], {
        validator: (value) => {
          return [
            !value.name && 'name is required',
            !value.other && 'other is required',
          ]
            .filter(Truthy)
            .join(',')
        },
        validatorOptions: {
          validateOnMount: true,
        },
      })
      await group.mount()

      expect(group.errors.value).toEqual(['other is required'])
    })
    it('should work with async validators', async () => {
      vi.useFakeTimers()
      const form = new FormLogic<{ name: string }>()
      const group = form.getOrCreateFieldGroup(['name'], {
        validatorAsync: async () => {
          await new Promise((resolve) => setTimeout(resolve, 100))
          return 'error'
        },
      })
      await form.mount()
      await group.mount()

      const validationPromise = group.validateForEvent('onSubmit')
      expect(group.errors.value).toEqual([])
      expect(group.isValidating.value).toBe(true)

      await vi.advanceTimersToNextTimerAsync()
      await validationPromise

      expect(group.errors.value).toEqual(['error'])
      expect(group.isValidating.value).toBe(false)

      vi.useRealTimers()
    })
    it('should debounce the validation', async () => {
      vi.useFakeTimers()

      const validateFn = vi.fn()
      const form = new FormLogic({
        defaultValues: {
          name: 'test',
        },
      })
      await form.mount()
      const group = form.getOrCreateFieldGroup(['name'], {
        validatorAsync: async (value) => {
          validateFn(value.name)
          await new Promise((resolve) => setTimeout(resolve, 100))
          return value.name === 'test' ? undefined : 'error'
        },
        validatorAsyncOptions: {
          debounceMs: 100,
        },
      })
      await group.mount()

      form.data.value.name.value = 'value'
      await vi.advanceTimersByTime(50)
      form.data.value.name.value = 'value2'
      await vi.advanceTimersByTime(200)

      expect(group.errors.value).toEqual([])
      expect(validateFn).toHaveBeenCalledOnce()

      vi.useRealTimers()
    })
    it('should reset onSubmit errors after any change', async () => {
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: 'test',
        },
      })
      await form.mount()
      const group = form.getOrCreateFieldGroup(['name'], {
        validator: (value) => (value.name === 'test' ? undefined : 'error'),
        validatorOptions: {
          disableOnChangeValidation: true,
        },
      })
      await group.mount()

      form.data.value.name.value = 'test'
      await group.handleSubmit()
      expect(group.errors.peek()).toEqual([])

      form.data.value.name.value = 'asd'
      await group.handleSubmit()
      expect(group.errors.peek()).toEqual(['error'])

      form.data.value.name.value = 'asdd'
      expect(group.errors.peek()).toEqual([])
    })
    it('should reset the change errors after change', () => {
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: '',
        },
      })
      form.mount()
      const group = form.getOrCreateFieldGroup(['name'], {
        validator: (value) => (value.name === 'test' ? undefined : 'error'),
      })
      group.mount()

      form.data.value.name.value = 'test1'

      expect(group.errors.value).toEqual(['error'])
      form.data.value.name.value = 'test'
      expect(group.errors.value).toEqual([])
    })
    it('should abort async validations if there was another validation before the promise resolved', async () => {
      vi.useFakeTimers()
      const validateFn = vi.fn()
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: '',
        },
      })
      await form.mount()
      const group = form.getOrCreateFieldGroup(['name'], {
        validatorAsync: async (value, abortSignal) => {
          await new Promise((resolve) => setTimeout(resolve, 100))
          if (abortSignal.aborted) return 'aborted'
          validateFn(value)
          return value.name === 'test' ? undefined : 'error'
        },
      })
      await group.mount()

      form.data.value.name.value = 'test1'
      const firstSubmitPromise = group.handleSubmit()
      vi.advanceTimersByTime(50)
      const secondSubmitPromise = group.handleSubmit()
      vi.advanceTimersByTime(100)

      await Promise.all([firstSubmitPromise, secondSubmitPromise])

      expect(validateFn).toHaveBeenCalledOnce()

      vi.useRealTimers()
    })
    it('should not run async validations if the sync validation already failed unless configured otherwise', async () => {
      vi.useFakeTimers()
      const validateFn = vi.fn()
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: '',
        },
      })
      await form.mount()
      const group = form.getOrCreateFieldGroup(['name'], {
        validatorAsync: async (value) => {
          validateFn(value)
          await new Promise((resolve) => setTimeout(resolve, 100))
          return value.name === 'test' ? undefined : 'error'
        },
        validator: (value) => (value.name === 'test' ? undefined : 'error'),
      })
      await group.mount()

      form.data.value.name.value = 'test1'
      const promise = group.handleSubmit()
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
      })
      await form.mount()
      const group = form.getOrCreateFieldGroup(['name'], {
        validatorAsyncOptions: {
          accumulateErrors: true,
        },
        validatorAsync: async (value) => {
          validateFn(value)
          await new Promise((resolve) => setTimeout(resolve, 100))
          return value.name === 'test' ? undefined : 'error'
        },
        validator: (value) => (value.name === 'test' ? undefined : 'error'),
      })
      await group.mount()

      form.data.value.name.value = 'test1'
      const promise = group.handleSubmit()
      await vi.advanceTimersByTime(100)
      await promise

      expect(validateFn).toBeCalledTimes(1)

      vi.useRealTimers()
    })
    it('should allow a validator to run on every event', async () => {
      const validate = vi.fn(() => undefined)
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: '',
        },
      })
      await form.mount()
      const group = form.getOrCreateFieldGroup(['name'], {
        validator: validate,
        validatorOptions: {
          validateOnMount: true,
        },
      })
      await group.mount()

      form.data.value.name.value = 'test'
      await group.handleSubmit()

      expect(validate).toHaveBeenCalledTimes(3)
    })
    it('should not validate if unmounted', async () => {
      const validate = vi.fn(() => undefined)
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: '',
        },
      })
      await form.mount()
      const group = form.getOrCreateFieldGroup(['name'], {
        validator: validate,
      })
      await group.mount().then((unmount) => unmount())

      form.data.value.name.value = 'asd'
      await group.handleSubmit()

      expect(validate).toHaveBeenCalledTimes(0)
    })
    it('should only force validate if unmounted for submit event', async () => {
      const validate = vi.fn(() => undefined)
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: '',
        },
      })
      const group = form.getOrCreateFieldGroup(['name'], {
        validator: validate,
      })

      group.validateForEvent('onMount')
      group.validateForEvent('onBlur')
      group.validateForEvent('onChange')
      group.validateForEvent('onSubmit')

      expect(validate).toHaveBeenCalledTimes(1)
    })
    it('should validate with a given adapter', () => {
      const form = new FormLogic({
        defaultValues: {
          d: 0,
        },
      })
      form.mount()
      const group = form.getOrCreateFieldGroup(['d'], {
        validatorAdapter: adapter,
        validator: 5 as never,
      })
      group.mount()

      form.data.value.d.value = 6
      expect(group.errors.value).toEqual([
        'Value must be less than or equal to 5',
      ])
      form.data.value.d.value = 4
      expect(group.errors.value).toEqual([])
    })
    it('should validate with the usual validation even if an adapter is given', () => {
      const form = new FormLogic({
        defaultValues: {
          d: 0,
        },
      })
      form.mount()
      const group = form.getOrCreateFieldGroup(['d'], {
        validatorAdapter: adapter,
        validator: (value) =>
          value.d === 5 ? 'Value must not be 5' : undefined,
      })
      group.mount()

      form.data.value.d.value = 5
      expect(group.errors.value).toEqual(['Value must not be 5'])
      form.data.value.d.value = 6
      expect(group.errors.value).toEqual([])
    })
    it('should work with an adapter and async validation', async () => {
      vi.useFakeTimers()

      const form = new FormLogic({
        defaultValues: {
          d: 0,
        },
      })
      await form.mount()
      const group = form.getOrCreateFieldGroup(['d'], {
        validatorAdapter: adapter,
        validatorAsync: 5 as never,
      })
      await group.mount()

      form.data.value.d.value = 6
      const validationPromise = group.validateForEvent('onChange')
      expect(group.errors.value).toEqual([])
      await vi.advanceTimersByTimeAsync(100)
      await validationPromise
      expect(group.errors.value).toEqual([
        'Value must be less than or equal to 5',
      ])

      vi.useRealTimers()
    })
    it('should throw an error if non-function validator is given without an adapter for sync validation', async () => {
      const form = new FormLogic<{ d: number }>()
      const group = form.getOrCreateFieldGroup(['d'], {
        validator: 5 as never,
      })

      await expect(group.mount()).rejects.toThrowError(
        'The sync validator must be a function',
      )
    })
    it('should throw an error if non-function validator is given without an adapter for async validation', async () => {
      const form = new FormLogic<{ d: number }>()
      const group = form.getOrCreateFieldGroup(['d'], {
        validatorAsync: 5 as never,
      })

      await expect(group.mount()).rejects.toThrowError(
        'The async validator must be a function',
      )
    })
    it('should allow for validation mixins', () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'default',
          age: 10,
        },
      })
      form.mount()
      const group = form.getOrCreateFieldGroup(['name'], {
        validator: ([value, age]) =>
          age > 50 && !value.name.startsWith('Mr.') ? 'error' : undefined,
        validateMixin: ['age'],
      })
      group.mount()
      const field = new FieldLogic(form, 'name')
      field.mount()

      expect(group.errors.value).toEqual([])
      form.data.value.age.value = 51
      expect(group.errors.value).toEqual(['error'])
      form.data.value.name.value = 'Mr. Default'
      expect(group.errors.value).toEqual([])
    })
    it('should allow for validation mixins with async validators', async () => {
      vi.useFakeTimers()

      const form = new FormLogic({
        defaultValues: {
          name: 'default',
          age: 10,
        },
      })
      await form.mount()
      const group = form.getOrCreateFieldGroup(['name'], {
        validatorAsync: async ([value, age]) => {
          await new Promise((resolve) => setTimeout(resolve, 100))
          return age > 50 && !value.name.startsWith('Mr.') ? 'error' : undefined
        },
        validateMixin: ['age'],
      })
      await group.mount()
      const field = new FieldLogic(form, 'name')
      await field.mount()

      expect(group.errors.value).toEqual([])
      form.data.value.age.value = 51
      await vi.advanceTimersByTimeAsync(100)
      expect(group.errors.value).toEqual(['error'])
      form.data.value.name.value = 'Mr. Default'
      await vi.advanceTimersByTimeAsync(100)
      expect(group.errors.value).toEqual([])

      vi.useRealTimers()
    })
    it('should allow for validation with mixins when running the onMount validation', () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'default',
          age: 51,
        },
      })
      form.mount()
      const group = form.getOrCreateFieldGroup(['name'], {
        validator: ([value, age]) =>
          age > 50 && !value.name.startsWith('Mr.') ? 'error' : undefined,
        validateMixin: ['age'],
        validatorOptions: {
          validateOnMount: true,
        },
      })
      group.mount()
      const field = new FieldLogic(form, 'name')
      field.mount()

      expect(group.errors.value).toEqual(['error'])
    })
    it('should allow for validation mixins with adapter', () => {
      const form = new FormLogic({
        defaultValues: {
          test: 10,
          additional: 2,
        },
      })
      form.mount()
      const group = form.getOrCreateFieldGroup(['test'], {
        validatorAdapter: mixinAdapter,
        validator: 5 as never,
        validatorOptions: {
          validateOnMount: true,
        },
        validateMixin: ['additional'],
      })
      group.mount()
      const field = new FieldLogic(form, 'test')
      field.mount()

      expect(group.errors.value).toEqual([
        'Value must be less than or equal to 7',
      ])
    })
  })
  describe('handleSubmit', () => {
    it('should not handle submit if the group is invalid', () => {
      const handleSubmit = vi.fn()
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: 'test',
        },
      })
      form.mount()
      const group = form.getOrCreateFieldGroup(['name'], {
        onSubmit: handleSubmit,
      })
      group.mount()

      group.handleSubmit()
      expect(handleSubmit).not.toHaveBeenCalled()
    })
    it('should not handle submit if the group is submitting', async () => {
      vi.useFakeTimers()
      const handleSubmit = vi.fn()
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: 'test',
        },
      })
      await form.mount()
      const group = form.getOrCreateFieldGroup(['name'], {
        validatorAsync: async () => {
          await new Promise((resolve) => setTimeout(resolve, 100))
          return undefined
        },
        onSubmit: handleSubmit,
      })
      await group.mount()

      const promiseFirst = group.handleSubmit()
      await vi.advanceTimersByTimeAsync(50)
      const promiseSecond = group.handleSubmit()
      await vi.advanceTimersByTimeAsync(100)
      await Promise.all([promiseFirst, promiseSecond])

      expect(handleSubmit).toHaveBeenCalledTimes(1)
      vi.useRealTimers()
    })
    it('should not handle submit if the group is validating', async () => {
      vi.useFakeTimers()
      const handleSubmit = vi.fn()
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: 'test',
        },
      })
      await form.mount()
      const group = form.getOrCreateFieldGroup(['name'], {
        validatorAsync: async () => {
          await new Promise((resolve) => setTimeout(resolve, 100))
          return undefined
        },
        onSubmit: handleSubmit,
      })
      await group.mount()

      form.data.value.name.value = 'test1'
      await vi.advanceTimersByTimeAsync(50)
      const submitPromise = group.handleSubmit()
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
      })
      await form.mount()
      const group = form.getOrCreateFieldGroup(['name'], {
        onSubmit: handleSubmit,
      })
      await group.mount()

      await group.handleSubmit()
      expect(handleSubmit).toHaveBeenCalledWith(
        { name: 'test' },
        expect.anything(),
      )
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
      })
      await form.mount()
      const group = form.getOrCreateFieldGroup(['name'], {
        onSubmit: handleSubmit,
      })
      await group.mount()

      const promise = group.handleSubmit()
      expect(group.isSubmitting.value).toBe(true)
      await vi.advanceTimersByTimeAsync(100)
      await promise
      expect(group.isSubmitting.value).toBe(false)
      vi.useRealTimers()
    })
    it('should mark the submission as unsuccessful if the submit function throws', async () => {
      const error = new Error('error')
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: 'test',
        },
      })
      await form.mount()
      const group = form.getOrCreateFieldGroup(['name'], {
        onSubmit: () => {
          throw error
        },
      })
      await group.mount()

      await expect(group.handleSubmit()).resolves.toBeUndefined()
      expect(group.submitCountUnsuccessful.value).toBe(1)
      expect(group.errors.value).toEqual([error.message])
    })
    it('should mark the submission as unsuccessful if the submit async function throws', async () => {
      vi.useFakeTimers()
      const error = new Error('error')
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: 'test',
        },
      })
      await form.mount()
      const group = form.getOrCreateFieldGroup(['name'], {
        onSubmit: async () => {
          await new Promise((resolve) => setTimeout(resolve, 100))
          throw error
        },
      })
      await group.mount()

      // noinspection JSVoidFunctionReturnValueUsed
      const submitPromise = expect(
        group.handleSubmit(),
      ).resolves.toBeUndefined()
      expect(group.submitCountUnsuccessful.value).toBe(0)
      await vi.advanceTimersByTimeAsync(100)
      await submitPromise
      expect(group.submitCountUnsuccessful.value).toBe(1)
      expect(group.errors.value).toEqual([error.message])
      vi.useRealTimers()
    })
    it("should put any thrown sync error into the group's errors", async () => {
      const error = new Error('error')
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: 'test',
        },
      })
      await form.mount()
      const group = form.getOrCreateFieldGroup(['name'], {
        onSubmit: () => {
          throw error
        },
      })
      await group.mount()

      await expect(group.handleSubmit()).resolves.toBeUndefined()
      expect(group.errors.value).toEqual([error.message])
    })
    it("should put any thrown async error into the group's errors", async () => {
      vi.useFakeTimers()
      const error = new Error('error')
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: 'test',
        },
      })
      await form.mount()
      const group = form.getOrCreateFieldGroup(['name'], {
        onSubmit: async () => {
          await new Promise((resolve) => setTimeout(resolve, 100))
          throw error
        },
      })
      await group.mount()

      // noinspection JSVoidFunctionReturnValueUsed
      const submitPromise = expect(
        group.handleSubmit(),
      ).resolves.toBeUndefined()
      await vi.advanceTimersByTimeAsync(100)
      await submitPromise
      expect(group.errors.value).toEqual([error.message])
      vi.useRealTimers()
    })
    it('should throw any non-error that is thrown', async () => {
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: 'test',
        },
      })
      await form.mount()
      const group = form.getOrCreateFieldGroup(['name'], {
        onSubmit: () => {
          throw 'error'
        },
      })
      await group.mount()

      const promise = expect(group.handleSubmit()).rejects.toEqual('error')
      expect(group.isSubmitting.value).toBe(true)
      await promise
      expect(group.isSubmitting.value).toBe(false)
      expect(group.errors.value).toEqual([])
    })
    it('should add errors to fields they are added during submission', async () => {
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: 'test',
        },
      })
      await form.mount()
      const field = form.getOrCreateField('name')
      await field.mount()
      const group = form.getOrCreateFieldGroup(['name'], {
        onSubmit: (_, addErrors) => {
          addErrors({
            name: 'error',
          })
        },
      })
      await group.mount()

      expect(field.errors.value).toEqual([])
      await group.handleSubmit()
      expect(field.errors.value).toEqual(['error'])
    })
    it('should reset submission errors after any change', async () => {
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: 'test',
        },
      })
      await form.mount()
      const group = form.getOrCreateFieldGroup(['name'], {
        onSubmit: () => {
          throw new Error('error')
        },
      })
      await group.mount()

      await group.handleSubmit()
      expect(group.errors.value).toEqual(['error'])
      form.data.value.name.value = 'test1'
      expect(group.errors.value).toEqual([])
    })
    it('should not add errors during submission to non-existing fields', async () => {
      const form = new FormLogic({
        defaultValues: {
          other: 'test',
        },
      })
      await form.mount()
      const group = form.getOrCreateFieldGroup(['other'], {
        onSubmit: (_, addErrors) => {
          addErrors({
            other: 'error',
          })
        },
      })
      await group.mount()

      expect(group.errors.value).toEqual([])
      await group.handleSubmit()
      expect(group.errors.value).toEqual([])
    })
    it('should add zod errors during submission via the error transformer', async () => {
      vi.useFakeTimers()
      const form = new FormLogic({
        defaultValues: {
          names: ['item', 'item2'],
          address: {
            zipCode: 9999,
          },
        },
      })
      await form.mount()
      const group = form.getOrCreateFieldGroup(['names', 'address'], {
        onSubmit: async (_, addErrors) => {
          await new Promise((resolve) => setTimeout(resolve, 100))
          const issues = [
            {
              code: 'invalid_type',
              expected: 'string',
              received: 'number',
              path: ['names', 1],
              message: 'Invalid input: expected string, received number',
            },
            {
              code: 'unrecognized_keys',
              keys: ['extra'],
              path: ['address'],
              message: "Unrecognized key(s) in object: 'extra'",
            },
            {
              code: 'too_small',
              minimum: 10000,
              type: 'number',
              inclusive: true,
              path: ['address', 'zipCode'],
              message: 'Value should be greater than or equal to 10000',
            },
          ]
          addErrors(ErrorTransformers.zod(issues))
        },
      })
      await group.mount()

      const firstNameField = form.getOrCreateField('names.1')
      await firstNameField.mount()
      const addressField = form.getOrCreateField('address')
      await addressField.mount()
      const zipCodeField = form.getOrCreateField('address.zipCode')
      await zipCodeField.mount()

      expect(firstNameField.errors.value).toEqual([])
      expect(addressField.errors.value).toEqual([])
      expect(zipCodeField.errors.value).toEqual([])
      const submitPromise = group.handleSubmit()
      await vi.advanceTimersByTimeAsync(100)
      await submitPromise
      expect(firstNameField.errors.value).toEqual([
        'Invalid input: expected string, received number',
      ])
      expect(addressField.errors.value).toEqual([
        "Unrecognized key(s) in object: 'extra'",
      ])
      expect(zipCodeField.errors.value).toEqual([
        'Value should be greater than or equal to 10000',
      ])
      vi.useRealTimers()
    })
    it('should be able to add errors to the group itself during submission', async () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'test',
        },
      })
      await form.mount()
      const group = form.getOrCreateFieldGroup(['name'], {
        onSubmit: (_, addErrors) => {
          addErrors({
            '': 'error',
          })
        },
      })
      await group.mount()

      expect(group.errors.value).toEqual([])
      await group.handleSubmit()
      expect(group.errors.value).toEqual(['error'])
    })
    it('should be able to add a general error by passing a string to the add errors function during submission', async () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'test',
        },
      })
      await form.mount()
      const group = form.getOrCreateFieldGroup(['name'], {
        onSubmit: (_, addErrors) => {
          addErrors('error')
        },
      })
      await group.mount()

      expect(group.errors.value).toEqual([])
      await group.handleSubmit()
      expect(group.errors.value).toEqual(['error'])
    })
    it('should not be able to submit if the group is disabled', async () => {
      const onSubmit = vi.fn()
      const form = new FormLogic({
        defaultValues: {
          name: 'test',
        },
      })
      await form.mount()
      const group = form.getOrCreateFieldGroup(['name'], {
        onSubmit,
      })
      await group.mount()
      group.disable()

      await group.handleSubmit()
      expect(onSubmit).not.toBeCalled()
    })
  })
  describe('helperMethods', () => {
    describe('reset', () => {
      it('should reset to the default state', async () => {
        const form = new FormLogic({
          defaultValues: {
            name: 'test',
            deep: {
              value: 1,
            },
            array: [1],
          },
        })
        await form.mount()
        const group = form.getOrCreateFieldGroup(
          ['deep.value', 'array', 'name'],
          {
            validator: () => 'error',
            validatorOptions: {
              disableOnBlurValidation: true,
            },
          },
        )
        await group.mount()
        const field = new FieldLogic(form, 'deep.value' as const, {
          validator: () => 'error',
          validatorOptions: {
            disableOnBlurValidation: true,
          },
        })
        await field.mount()
        await field.handleBlur()

        await group.handleSubmit()

        field.handleChange(2)
        form.data.value.name.value = 'test1'
        form.pushValueToArray('array', 2)

        expect(group.data.value.name).toBe('test1')
        expect(group.data.value.deep.value).toBe(2)
        expect(group.errors.value).toEqual(['error'])
        expect(field.errors.value).toEqual(['error'])
        expect(group.isDirty.value).toBe(true)
        expect(group.dirtyFields.value).toEqual([
          'deep.value',
          'array',
          'array.1',
          'name',
        ])
        expect(group.submitCount.value).toBe(1)

        group.reset()

        expect(group.data.value.name).toBe('test')
        expect(group.data.value.deep.value).toBe(1)
        expect(group.errors.value).toEqual([])
        expect(field.errors.value).toEqual([])
        expect(group.isDirty.value).toBe(false)
        expect(group.dirtyFields.value).toEqual([])
        expect(group.submitCount.value).toBe(0)
      })
    })
  })
})
