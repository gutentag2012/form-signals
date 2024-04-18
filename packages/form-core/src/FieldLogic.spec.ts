import { effect } from '@preact/signals-core'
import { describe, expect, it, vi } from 'vitest'
import { FieldLogic } from './FieldLogic'
import { FormLogic } from './FormLogic'
import type { ValidatorAdapter, ValidatorAsync, ValidatorSync } from './utils'

const adapter: ValidatorAdapter = {
  sync<TValue, TMixins extends readonly any[] = never[]>(
    schema: number,
  ): ValidatorSync<TValue, TMixins> {
    // @ts-expect-error This is just for testing, so we dont need to handle mixins
    return (value) => {
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
    return async (value) => {
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
    return ([value, ...mixins]: [TValue, ...TMixins]) => {
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
    return async ([value, ...mixins]: [TValue, ...TMixins]) => {
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

describe('FieldLogic', () => {
  describe('construction', () => {
    it('should use the given default values', () => {
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: 'test',
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'name', {
        defaultValue: 'default',
      })
      field.mount()

      expect(field.data?.value).toBe('default')
    })
    it('should deeply signalify the default value', () => {
      const form = new FormLogic({
        defaultValues: {
          name: {
            deepArray: [
              undefined,
              {
                nested: [['string']],
              },
            ],
          },
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'name.deepArray.1.nested.0.0', {
        defaultValue: 'default',
      })
      field.mount()

      expect(field.data?.value).toBe('default')
    })
    it('should fall back on the form default values', () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'test',
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'name')
      field.mount()

      expect(field.data?.value).toBe('test')
    })
    it('should have default state in beginning (not dirty, not validating, no errors, not touched, isValid)', () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const field = new FieldLogic(form, 'name')
      field.mount()

      expect(field.data.value).toBeUndefined()
      expect(field.isDirty.value).toBe(false)
      expect(field.isValidating.value).toBe(false)
      expect(field.errors.value).toEqual([])
      expect(field.isTouched.value).toBe(false)
      expect(field.isValid.value).toBe(true)
    })
    it('should be able to set default state of isTouched to true', () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const field = new FieldLogic(form, 'name', {
        defaultState: {
          isTouched: true,
        },
      })
      field.mount()

      expect(field.isTouched.value).toBe(true)
    })
    it('should be able to set default errors', () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const field = new FieldLogic(form, 'name', {
        defaultState: {
          errors: {
            sync: 'error',
          },
        },
      })
      field.mount()

      expect(field.errors.value).toEqual(['error'])
    })
    it('should return the currentNamePart of the field', () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const field = new FieldLogic(form, 'name')
      field.mount()

      expect(field.currentNamePart).toBe('name')
    })
    it('should return the array index with currentNamePart of the field if it is an array item', () => {
      const form = new FormLogic<{ name: string[] }>()
      form.mount()
      const field = new FieldLogic(form, 'name.0')
      field.mount()

      expect(field.currentNamePart).toBe(0)
    })
    it('should return the form used for construction', () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const field = new FieldLogic(form, 'name')
      field.mount()

      expect(field.form).toBe(form)
    })
  })
  describe('value', () => {
    it('should return the value from the form', () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'test',
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'name')
      field.mount()
      form.data.value.name.value = 'new value'

      expect(field.data.value).toBe('new value')
    })
    it('should return the value as a reactive signal', () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'test',
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'name')
      field.mount()

      const spy = vi.fn()
      effect(() => {
        spy(field.data.value)
      })
      form.data.value.name.value = 'new value'

      expect(spy).toBeCalledWith('new value')
    })
    it('should set the value in the form', () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'test',
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'name')
      field.mount()

      field.handleChange('new value')

      expect(form.data.value.name.value).toBe('new value')
    })
    it('should reactively update child values if an object is changed', () => {
      const form = new FormLogic({
        defaultValues: {
          nested: {
            name: 'test',
          },
        },
      })
      form.mount()
      const field = new FieldLogic(form, 'nested')
      field.mount()

      const fn = vi.fn()
      effect(() => {
        fn(field.data.peek().name.value)
      })
      field.handleChange({
        name: 'new',
      })
      // It ran twice since it runs once when the effect is set up
      expect(fn).toHaveBeenCalledTimes(2)
      expect(field.data.value.name.value).toEqual('new')
    })
    it('should reactively insert a value into the array', () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, undefined, 3],
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'array' as const)
      field.mount()
      field.insertValueInArray(1, 2)

      expect(field.data.value[1].data.value).toBe(2)
    })
    it('should reactively push a value to the array', () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, undefined, 3],
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'array' as const)
      field.mount()
      field.pushValueToArray(4)

      expect(field.data.value[3].data.value).toBe(4)
    })
    it('should reactively push a value to the array at an index', () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, undefined, 3],
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'array' as const)
      field.mount()
      field.pushValueToArrayAtIndex(1, 4)

      expect(field.data.value[1].data.value).toBe(4)
    })
    it('should reactively remove a value from the array', () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'array' as const)
      field.mount()

      expect(field.data.value.length).toBe(3)
      field.removeValueFromArray(1)

      expect(field.data.value.length).toBe(2)
    })
    it('should reactively remove itself from an array', () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'array.1' as const)
      field.mount()

      expect(form.data.value.array.value.length).toBe(3)
      field.removeSelfFromArray()
      expect(form.data.value.array.value.length).toBe(2)
    })
    it('should reactively update a value in the array', () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'array' as const)
      field.mount()

      const spy = vi.fn()
      effect(() => {
        spy(field.data.value)
      })
      field.pushValueToArray(4)

      // We are checking the second call, since the effect will be called once with the current value
      const call = spy.mock.calls[1]
      expect(call[0].length).toBe(4)
    })
    it('should reactively swap two values in the array', () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'array' as const)
      field.mount()
      field.swapValuesInArray(0, 2)

      expect(field.data.value[0].data.value).toBe(3)
      expect(field.data.value[2].data.value).toBe(1)
    })
    it('should reactively swap itself in an array', () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2],
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'array.1' as const)
      field.mount()
      field.swapSelfInArray(0)
      expect(form.data.value.array.value[0].data.value).toBe(2)
      expect(form.data.value.array.value[1].data.value).toBe(1)
    })
    it('should reactively move a value in the array', () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'array' as const)
      field.mount()
      field.moveValueInArray(0, 2)

      expect(field.data.value[0].data.value).toBe(2)
      expect(field.data.value[2].data.value).toBe(1)
    })
    it('should reactively move itself in an array', () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'array.0' as const)
      field.mount()
      field.moveSelfInArray(2)
      expect(form.data.value.array.value[0].data.value).toBe(2)
      expect(form.data.value.array.value[2].data.value).toBe(1)
    })
    it('should do nothing when trying to insert a value into a non-array field', () => {
      const form = new FormLogic({
        defaultValues: {
          someVal: 1,
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'someVal')
      field.mount()

      expect(field.data.value).toBe(1)
      field.insertValueInArray(1, 2 as never)

      expect(field.data.value).toBe(1)
    })
    it('should do nothing when trying to push a value into a non-array field', () => {
      const form = new FormLogic({
        defaultValues: {
          someVal: 1,
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'someVal')
      field.mount()

      expect(field.data.value).toBe(1)
      field.pushValueToArray(1 as never)

      expect(field.data.value).toBe(1)
    })
    it('should do nothing when trying to remove a value from a non-array field', () => {
      const form = new FormLogic({
        defaultValues: {
          someVal: 1,
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'someVal')
      field.mount()

      expect(field.data.value).toBe(1)
      field.removeValueFromArray(1 as never)

      expect(field.data.value).toBe(1)
    })
    it('should do nothing when trying to remove itself from a non-array-item field', () => {
      const form = new FormLogic({
        defaultValues: {
          someVal: 1,
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'someVal')
      field.mount()

      expect(field.data.value).toBe(1)
      field.removeSelfFromArray()

      expect(field.data.value).toBe(1)
    })
    it('should do nothing when trying to remove a non existing index', () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2],
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'array' as const)
      field.mount()
      field.removeValueFromArray(2)
      field.removeValueFromArray(-1)

      expect(field.data.value[0].data.value).toBe(1)
      expect(field.data.value[1].data.value).toBe(2)
    })
    it('should do nothing when trying to swap values in a non-array field', () => {
      const form = new FormLogic({
        defaultValues: {
          someVal: 1,
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'someVal')
      field.mount()

      expect(field.data.value).toBe(1)
      field.swapValuesInArray(1 as never, 2 as never)

      expect(field.data.value).toBe(1)
    })
    it('should do nothing when trying to swap itself in a non-array-item field', () => {
      const form = new FormLogic({
        defaultValues: {
          someVal: 1,
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'someVal')
      field.mount()

      expect(field.data.value).toBe(1)
      field.swapSelfInArray(0 as never)

      expect(field.data.value).toBe(1)
    })
    it('should do nothing when trying to swap to a non existing index', () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2],
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'array' as const)
      field.mount()
      field.swapValuesInArray(0, 2)
      field.swapValuesInArray(-1, 1)

      expect(field.data.value[0].data.value).toBe(1)
      expect(field.data.value[1].data.value).toBe(2)
    })
    it('should do nothing when trying to move value in a non-array field', () => {
      const form = new FormLogic({
        defaultValues: {
          someVal: 1,
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'someVal')
      field.mount()

      expect(field.data.value).toBe(1)
      field.moveValueInArray(1 as never, 2 as never)

      expect(field.data.value).toBe(1)
    })
    it('should do nothing when trying to move itself in a non-array-item field', () => {
      const form = new FormLogic({
        defaultValues: {
          someVal: 1,
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'someVal')
      field.mount()

      expect(field.data.value).toBe(1)
      field.moveSelfInArray(0 as never)

      expect(field.data.value).toBe(1)
    })
    it('should do nothing when trying to move to a non existing index', () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2],
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'array' as const)
      field.mount()
      field.moveValueInArray(0, 2)
      field.moveValueInArray(-1, 1)

      expect(field.data.value[0].data.value).toBe(1)
      expect(field.data.value[1].data.value).toBe(2)
    })
  })
  describe('validation', () => {
    it('should validate without errors if the value is correct', async () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const field = new FieldLogic(form, 'name', {
        validator: (value) => (value === 'test' ? undefined : 'error'),
      })
      field.mount()

      field.handleChange('test')
      await field.validateForEvent('onSubmit')

      expect(field.errors.value).toEqual([])
    })
    it('should validate with errors if the value is incorrect', async () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const field = new FieldLogic(form, 'name', {
        validator: (value) => (value === 'test' ? undefined : 'error'),
      })
      field.mount()

      field.handleChange('test1')
      await field.validateForEvent('onSubmit')

      expect(field.errors.value).toEqual(['error'])
    })
    it('should work with async validators', async () => {
      vi.useFakeTimers()
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const field = new FieldLogic(form, 'name', {
        validatorAsync: async () => {
          await new Promise((resolve) => setTimeout(resolve, 100))
          return 'error'
        },
      })
      field.mount()

      field.handleChange('test1')
      const validationPromise = field.validateForEvent('onSubmit')
      expect(field.errors.value).toEqual([])
      expect(field.isValidating.value).toBe(true)

      await vi.advanceTimersToNextTimerAsync()
      await validationPromise

      expect(field.errors.value).toEqual(['error'])
      expect(field.isValidating.value).toBe(false)

      vi.useRealTimers()
    })
    it('should debounce the validation', async () => {
      vi.useFakeTimers()

      const validateFn = vi.fn()
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const field = new FieldLogic(form, 'name', {
        validatorAsync: async (value) => {
          validateFn(value)
          await new Promise((resolve) => setTimeout(resolve, 100))
          return value === 'test' ? undefined : 'error'
        },
        validatorAsyncOptions: {
          debounceMs: 100,
        },
      })
      field.mount()

      field.data.value = 'value'
      await vi.advanceTimersByTime(50)
      field.data.value = 'value2'
      await vi.advanceTimersByTime(200)

      expect(field.errors.value).toEqual([])
      expect(validateFn).toHaveBeenCalledOnce()

      vi.useRealTimers()
    })
    it('should validate after change', () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const field = new FieldLogic(form, 'name', {
        validator: (value) => (value === 'test' ? undefined : 'error'),
      })
      field.mount()

      field.data.value = 'test1'

      expect(field.errors.value).toEqual(['error'])
    })
    it('should not validate after change if disabled', () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const field = new FieldLogic(form, 'name', {
        validator: (value) => (value === 'test' ? undefined : 'error'),
        validatorOptions: {
          disableOnChangeValidation: true,
        },
      })
      field.mount()

      field.data.value = 'test1'

      expect(field.errors.value).toEqual([])
    })
    it('should validate after blur', () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const field = new FieldLogic(form, 'name', {
        validator: (value) => (value === 'test' ? undefined : 'error'),
      })
      field.mount()

      field.handleBlur()

      expect(field.errors.value).toEqual(['error'])
    })
    it('should not validate after blur if not configured', () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const field = new FieldLogic(form, 'name', {
        validator: (value) => (value === 'test' ? undefined : 'error'),
        validatorOptions: {
          disableOnBlurValidation: true,
        },
      })
      field.mount()

      field.handleBlur()

      expect(field.errors.value).toEqual([])
    })
    it('should validate after mount', () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const field = new FieldLogic(form, 'name', {
        validator: (value) => (value === 'test' ? undefined : 'error'),
        validatorOptions: {
          validateOnMount: true,
        },
      })
      field.mount()

      expect(field.errors.value).toEqual(['error'])
    })
    it('should not validate after mount if not configured', () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const field = new FieldLogic(form, 'name', {
        validator: (value) => (value === 'test' ? undefined : 'error'),
      })
      field.mount()

      expect(field.errors.value).toEqual([])
    })
    it('should validate after submit of the form', async () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const field = new FieldLogic(form, 'name', {
        validator: (value) => (value === 'test' ? undefined : 'error'),
        validatorOptions: {
          disableOnChangeValidation: true,
          disableOnBlurValidation: true,
        },
      })
      field.mount()
      await field.mount()

      await form.handleSubmit()

      expect(field.errors.value).toEqual(['error'])
    })
    it('should reset onSubmit errors after any change', () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const field = new FieldLogic(form, 'name', {
        validator: (value) => (value === 'test' ? undefined : 'error'),
        validatorOptions: {
          disableOnChangeValidation: true,
        },
      })
      field.mount()

      field.data.value = 'test'
      field.handleSubmit()
      expect(field.errors.peek()).toEqual([])

      field.data.value = 'asd'
      field.handleSubmit()
      expect(field.errors.peek()).toEqual(['error'])

      field.data.value = 'asdd'
      expect(field.errors.peek()).toEqual([])
    })
    it('should reset the change errors after change', () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const field = new FieldLogic(form, 'name', {
        validator: (value) => (value === 'test' ? undefined : 'error'),
      })
      field.mount()

      field.data.value = 'test1'

      expect(field.errors.value).toEqual(['error'])
      field.handleChange('test')
      expect(field.errors.value).toEqual([])
    })
    it('should reset the blur errors after blur', () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const field = new FieldLogic(form, 'name', {
        validator: (value) => (value === 'test' ? undefined : 'error'),
        validatorOptions: {
          disableOnChangeValidation: true,
        },
      })
      field.mount()
      field.handleBlur()

      expect(field.errors.value).toEqual(['error'])
      field.handleChange('test')
      field.handleBlur()

      expect(field.errors.value).toEqual([])
    })
    it('should abort async validations if there was another validation before the promise resolved', async () => {
      vi.useFakeTimers()
      const validateFn = vi.fn()
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const field = new FieldLogic(form, 'name', {
        validatorAsync: async (value, abortSignal) => {
          await new Promise((resolve) => setTimeout(resolve, 100))
          if (abortSignal.aborted) return 'aborted'
          validateFn(value)
          return value === 'test' ? undefined : 'error'
        },
      })
      field.mount()

      field.handleChange('test1')
      const firstSubmitPromise = field.handleSubmit()
      vi.advanceTimersByTime(50)
      const secondSubmitPromise = field.handleSubmit()
      vi.advanceTimersByTime(100)

      await Promise.all([firstSubmitPromise, secondSubmitPromise])

      expect(validateFn).toHaveBeenCalledOnce()

      vi.useRealTimers()
    })
    it('should not run async validations if the sync validation already failed unless configured otherwise', async () => {
      const validateSync = vi.fn(() => 'error')
      const validateAsync = vi.fn(async () => 'error')
      const form = new FormLogic<{ name: string }>()
      await form.mount()
      const field = new FieldLogic(form, 'name', {
        validatorAsync: () => validateAsync(),
        validator: () => validateSync(),
      })
      await field.mount()

      field.handleChange('test1')

      expect(validateSync).toHaveBeenCalledOnce()
      expect(validateAsync).not.toHaveBeenCalled()
    })
    it('should accumulate other async validations if configured', async () => {
      const validateSync = vi.fn(() => 'error')
      const validateAsync = vi.fn(async () => 'error')
      const form = new FormLogic<{ name: string }>()
      await form.mount()
      const field = new FieldLogic(form, 'name', {
        validatorAsync: () => validateAsync(),
        validator: () => validateSync(),
        validatorAsyncOptions: {
          accumulateErrors: true,
        },
      })
      await field.mount()

      await field.handleChange('test1')

      expect(validateSync).toHaveBeenCalledOnce()
      expect(validateAsync).toHaveBeenCalledOnce()
    })
    it('should allow a validator to run on every event', () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const validate = vi.fn(() => undefined)
      const field = new FieldLogic(form, 'name', {
        validator: validate,
        validatorOptions: {
          validateOnMount: true,
        },
      })
      field.mount()

      field.handleBlur()
      field.handleChange('test')
      form.handleSubmit()

      expect(validate).toHaveBeenCalledTimes(4)
    })
    it('should not validate if unmounted', async () => {
      const form = new FormLogic<{ name: string }>()
      await form.mount()
      const validate = vi.fn(() => undefined)
      const field = new FieldLogic(form, 'name', {
        validator: validate,
      })
      await field.mount().then((unmount) => unmount())

      await field.handleBlur()
      field.handleChange('test')
      await field.handleSubmit()

      expect(validate).toHaveBeenCalledTimes(0)
    })
    it('should validate deep changes if configured', () => {
      const form = new FormLogic<{ name: { deep: string } }>()
      form.mount()
      const field = new FieldLogic(form, 'name' as const, {
        defaultValue: {
          deep: 'test',
        },
        validateOnNestedChange: true,
        validator: (value) => (value.deep === 'test' ? undefined : 'error'),
      })
      field.mount()

      form.data.value.name.value.deep.value = 'test1'
      expect(field.errors.value).toEqual(['error'])

      form.data.value.name.value.deep.value = 'test'
      expect(field.errors.value).toEqual([])
    })
    it('should validate deep changes for newly added array items', () => {
      const form = new FormLogic<{ names: string[] }>()
      form.mount()
      const field = new FieldLogic(form, 'names', {
        validateOnNestedChange: true,
        defaultValue: ['test'],
        validator: (value) =>
          value.some((v) => !v.length) ? 'error' : undefined,
      })
      field.mount()

      expect(field.errors.value).toEqual([])
      field.data.value[0].data.value = ''
      expect(field.errors.value).toEqual(['error'])
      field.data.value[0].data.value = 'valid'
      expect(field.errors.value).toEqual([])
      field.pushValueToArray('')
      expect(field.errors.value).toEqual(['error'])
      field.data.value[1].data.value = 'valid'
      expect(field.errors.value).toEqual([])
    })
    it('should validate deep changes for newly added object keys', () => {
      const form = new FormLogic<{ names: { [first: string]: string } }>()
      form.mount()
      const field = new FieldLogic(form, 'names', {
        validateOnNestedChange: true,
        defaultValue: {
          John: 'Test',
        },
        validator: (value) =>
          Object.values(value).some((v) => !v.length) ? 'error' : undefined,
      })
      field.mount()

      expect(field.errors.value).toEqual([])
      field.data.value.John.value = ''
      expect(field.errors.value).toEqual(['error'])
      field.data.value.John.value = 'valid'
      expect(field.errors.value).toEqual([])
      field.setValueInObject('Jane', '')
      expect(field.errors.value).toEqual(['error'])
      field.data.value.Jane.value = 'valid'
      expect(field.errors.value).toEqual([])
    })
    it('should not validate deep changes if not configured', () => {
      const form = new FormLogic<{ name: { deep: string } }>()
      form.mount()
      const field = new FieldLogic(form, 'name' as const, {
        defaultValue: {
          deep: 'test',
        },
        validator: (value) => (value.deep === 'test' ? undefined : 'error'),
      })
      field.mount()

      form.data.value.name.value.deep.value = 'test1'
      expect(field.errors.value).toEqual([])
    })
    it('should validate fields that are unmounted but preserve their value', () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const field = new FieldLogic(form, 'name', {
        preserveValueOnUnmount: true,
        validator: (value) => (value === 'test' ? undefined : 'error'),
      })
      field.mount()
      field.data.value = 'test'
      field.unmount()
      expect(field.errors.value).toEqual([])
      expect(field.data.value).toEqual('test')
    })
    it('should not validate fields that are unmounted', () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const field = new FieldLogic(form, 'name', {
        validator: (value) => (value === 'test' ? undefined : 'error'),
      })
      field.mount()
      field.data.value = 'test'
      field.unmount()
      expect(field.errors.value).toEqual([])
      expect(field.data).toBeUndefined()
    })
    it('should only validate on change after the field was touched if configured', () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const field = new FieldLogic(form, 'name', {
        /**/
        validator: (value) => value === 'test' && 'error',
        validatorOptions: {
          validateOnChangeIfTouched: true,
        },
      })
      field.mount()

      field.handleChange('test')
      expect(field.errors.value).toEqual([])
      field.handleBlur()
      expect(field.errors.value).toEqual(['error'])
      field.handleChange('test1')
      expect(field.errors.value).toEqual([])
    })
    it('should validate with a given adapter', () => {
      const form = new FormLogic<{ name: number }>()
      form.mount()
      const field = new FieldLogic(form, 'name', {
        validatorAdapter: adapter,
        validator: 5 as never,
      })
      field.mount()

      field.handleChange(6)
      expect(field.errors.value).toEqual([
        'Value must be less than or equal to 5',
      ])
      field.handleChange(4)
      expect(field.errors.value).toEqual([])
    })
    it('should validate with the usual validation even if an adapter is given', () => {
      const form = new FormLogic<{ name: number }>()
      form.mount()
      const field = new FieldLogic(form, 'name', {
        validatorAdapter: adapter,
        validator: (value) => (value === 5 ? 'Value must not be 5' : undefined),
      })
      field.mount()

      field.handleChange(5)
      expect(field.errors.value).toEqual(['Value must not be 5'])
      field.handleChange(6)
      expect(field.errors.value).toEqual([])
    })
    it('should work with an adapter and async validation', async () => {
      vi.useFakeTimers()

      const form = new FormLogic<{ name: number }>()
      await form.mount()
      const field = new FieldLogic(form, 'name', {
        validatorAdapter: adapter,
        validatorAsync: 5 as never,
      })
      await field.mount()

      field.handleChange(6)
      const validationPromise = field.validateForEvent('onChange')
      expect(field.errors.value).toEqual([])
      await vi.advanceTimersByTimeAsync(100)
      await validationPromise
      expect(field.errors.value).toEqual([
        'Value must be less than or equal to 5',
      ])

      vi.useRealTimers()
    })
    it('should throw an error if non-function validator is given without an adapter for sync validation', async () => {
      const form = new FormLogic<{ name: number }>()
      form.mount()
      const field = new FieldLogic(form, 'name', {
        validator: 5 as never,
      })

      await expect(field.mount()).rejects.toThrowError(
        'The sync validator must be a function',
      )
    })
    it('should throw an error if non-function validator is given without an adapter for async validation', async () => {
      const form = new FormLogic<{ name: number }>()
      form.mount()
      const field = new FieldLogic(form, 'name', {
        validatorAsync: 5 as never,
      })

      await expect(field.mount()).rejects.toThrowError(
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
      const field = new FieldLogic(form, 'name', {
        validator: ([value, age]) =>
          age > 50 && !value.startsWith('Mr.') ? 'error' : undefined,
        validateMixin: ['age'],
      })
      field.mount()

      expect(field.errors.value).toEqual([])
      form.data.value.age.value = 51
      expect(field.errors.value).toEqual(['error'])
      form.data.value.name.value = 'Mr. Default'
      expect(field.errors.value).toEqual([])
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
      const field = new FieldLogic(form, 'name', {
        validatorAsync: async ([value, age]) => {
          await new Promise((resolve) => setTimeout(resolve, 100))
          return age > 50 && !value.startsWith('Mr.') ? 'error' : undefined
        },
        validateMixin: ['age'],
      })
      await field.mount()

      expect(field.errors.value).toEqual([])
      form.data.value.age.value = 51
      await vi.advanceTimersByTimeAsync(100)
      expect(field.errors.value).toEqual(['error'])
      form.data.value.name.value = 'Mr. Default'
      await vi.advanceTimersByTimeAsync(100)
      expect(field.errors.value).toEqual([])

      vi.useRealTimers()
    })
    it('should allow for validation mixins when listening to nested updates', () => {
      const form = new FormLogic({
        defaultValues: {
          name: {
            first: 'default',
            last: 'default',
          },
          ages: [10, 20],
        },
      })
      form.mount()
      const field = new FieldLogic(form, 'name.first', {
        validator: ([value, age]) =>
          age[0] > 50 && !value.startsWith('Mr.') ? 'error' : undefined,
        validateMixin: ['ages'],
        validateOnNestedChange: true,
      })
      field.mount()

      expect(field.errors.value).toEqual([])
      form.data.value.ages.value[0].data.value = 51
      expect(field.errors.value).toEqual(['error'])
      form.data.value.name.value.first.value = 'Mr. Default'
      expect(field.errors.value).toEqual([])
    })
    it('should allow for validation with mixins when running the onMount validation', () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'default',
          age: 51,
        },
      })
      form.mount()
      const field = new FieldLogic(form, 'name', {
        validator: ([value, age]) =>
          age > 50 && !value.startsWith('Mr.') ? 'error' : undefined,
        validateMixin: ['age'],
        validatorOptions: {
          validateOnMount: true,
        },
      })
      field.mount()

      expect(field.errors.value).toEqual(['error'])
    })
    it('should allow for validation mixins with adapter', () => {
      const form = new FormLogic({
        defaultValues: {
          test: 10,
          additional: 2,
        },
      })
      form.mount()
      const field = new FieldLogic(form, 'test', {
        validatorAdapter: mixinAdapter,
        validator: 5 as never,
        validatorOptions: {
          validateOnMount: true,
        },
        validateMixin: ['additional'],
      })
      field.mount()

      expect(field.errors.value).toEqual([
        'Value must be less than or equal to 7',
      ])
    })
  })
  describe('state', () => {
    it('should not be mounted after construction', () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const field = new FieldLogic(form, 'name')

      expect(field.isMounted.value).toBe(false)
    })
    it('should be mounted after mount', () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const field = new FieldLogic(form, 'name')
      field.mount()

      expect(field.isMounted.value).toBe(true)
    })
    it('should be dirty if the value has changed', () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'test',
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'name')
      field.mount()

      expect(field.isDirty.value).toBe(false)
      field.handleChange('new value')

      expect(field.isDirty.value).toBe(true)
    })
    it('should be dirty if a nested value has changed', () => {
      const form = new FormLogic({
        defaultValues: {
          name: {
            deep: ['nested'],
          },
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'name')
      field.mount()

      expect(field.isDirty.value).toBe(false)
      form.data.value.name.value.deep.value[0].data.value = 'changed'

      expect(field.isDirty.value).toBe(true)
    })
    it('should be dirty if an item was inserted into the array', () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'array' as const)
      field.mount()

      expect(field.isDirty.value).toBe(false)
      field.pushValueToArray(4)

      expect(field.isDirty.value).toBe(true)
    })
    it('should not be dirty if the default value is set', () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'test',
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'name')
      field.mount()

      expect(field.isDirty.value).toBe(false)
      field.handleChange('test1')

      expect(field.isDirty.value).toBe(true)
      field.handleChange('test')

      expect(field.isDirty.value).toBe(false)
    })
    it('should not be dirty if the values of the array are same as the default values', () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'array' as const)
      field.mount()

      expect(field.isDirty.value).toBe(false)
      field.pushValueToArray(1)

      expect(field.isDirty.value).toBe(true)
      field.removeValueFromArray(3)

      expect(field.isDirty.value).toBe(false)
    })
    it('should be touched after it was blurred', () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'test',
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'name')
      field.mount()

      expect(field.isTouched.value).toBe(false)
      field.handleBlur()

      expect(field.isTouched.value).toBe(true)
    })
    it('should not be touched after its value was changed', () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'test',
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'name')
      field.mount()

      expect(field.isTouched.value).toBe(false)
      field.handleChange('new value')

      expect(field.isTouched.value).toBe(false)
    })
    it('should be touched after its value was changed if configured', () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'test',
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'name')
      field.mount()

      expect(field.isTouched.value).toBe(false)
      field.handleChange('new value', { shouldTouch: true })

      expect(field.isTouched.value).toBe(true)
    })
    it('should not be touched after a value was pushed to the array', () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'array' as const)
      field.mount()

      expect(field.isTouched.value).toBe(false)
      field.pushValueToArray(4)

      expect(field.isTouched.value).toBe(false)
    })
    it('should be touched after a value was pushed to the array if configured', () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'array' as const)
      field.mount()

      expect(field.isTouched.value).toBe(false)
      field.pushValueToArray(4, { shouldTouch: true })

      expect(field.isTouched.value).toBe(true)
    })
    it('should not be touched after a value was inserted into the array', () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'array' as const)
      field.mount()

      expect(field.isTouched.value).toBe(false)
      field.insertValueInArray(1, 2)

      expect(field.isTouched.value).toBe(false)
    })
    it('should be touched after a value was inserted into the array if configured', () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'array' as const)
      field.mount()

      expect(field.isTouched.value).toBe(false)
      field.insertValueInArray(1, 2, { shouldTouch: true })

      expect(field.isTouched.value).toBe(true)
    })
    it('should not be touched after a value was removed from the array', () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'array' as const)
      field.mount()

      expect(field.isTouched.value).toBe(false)
      field.removeValueFromArray(1)

      expect(field.isTouched.value).toBe(false)
    })
    it('should be touched after a value was removed from the array if configured', () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'array' as const)
      field.mount()

      expect(field.isTouched.value).toBe(false)
      field.removeValueFromArray(1, { shouldTouch: true })

      expect(field.isTouched.value).toBe(true)
    })
    it('should not be touched after a value was swapped in the array', () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'array' as const)
      field.mount()

      expect(field.isTouched.value).toBe(false)
      field.swapValuesInArray(0, 2)

      expect(field.isTouched.value).toBe(false)
    })
    it('should be touched after a value was swapped in the array if configured', () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'array' as const)
      field.mount()

      expect(field.isTouched.value).toBe(false)
      field.swapValuesInArray(0, 2, { shouldTouch: true })

      expect(field.isTouched.value).toBe(true)
    })
    it('should remove child fields from form if parent is unmounted', () => {
      const form = new FormLogic<{ parent: { child: number } }>()
      form.mount()
      const field = new FieldLogic(form, 'parent')
      field.mount()
      const child = new FieldLogic(form, 'parent.child')
      child.mount()

      expect(form.fields.value.length).toBe(2)
      field.unmount()
      expect(form.fields.value.length).toBe(0)
    })
    it('should reset field state on unmount if configured', () => {
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: 'default',
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'name', {
        resetValueToDefaultOnUnmount: true,
      })
      field.mount()
      field.handleBlur()
      field.data.value = 'value'

      expect(field.isTouched.value).toBe(true)
      expect(form.data.value.name.value).toBe('value')
      field.unmount()

      expect(form.data.value.name.value).toBe('default')
      expect(field.isTouched.value).toBe(false)
    })
    it('should delete field state on unmount if not otherwise configured', () => {
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: 'default',
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'name')
      field.mount()
      field.handleBlur()
      field.data.value = 'value'

      expect(field.isTouched.value).toBe(true)
      expect(form.data.value.name.value).toBe('value')
      field.unmount()

      expect(form.data.value.name).toBeUndefined()
      expect(field.isTouched.value).toBe(false)
    })
    it('should preserve field state on unmount if configured', () => {
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: 'default',
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'name', {
        preserveValueOnUnmount: true,
      })
      field.mount()
      field.handleBlur()
      field.handleChange('value')

      expect(field.isTouched.value).toBe(true)
      expect(form.data.value.name.value).toBe('value')
      field.unmount()

      expect(form.data.value.name.value).toBe('value')
      expect(field.isTouched.value).toBe(true)
    })
    it('should preserve an array field state on unmount if configured', () => {
      const form = new FormLogic<{ name: string[] }>({
        defaultValues: {
          name: [],
        },
      })
      form.mount()

      const field = new FieldLogic(form, 'name', {
        preserveValueOnUnmount: true,
      })
      field.mount()
      field.handleBlur()
      field.pushValueToArray('value')
      field.pushValueToArray('value2')

      expect(field.isTouched.value).toBe(true)
      expect(form.json.value.name).toEqual(['value', 'value2'])
      field.unmount()

      expect(form.json.value.name).toEqual(['value', 'value2'])
      expect(field.isTouched.value).toBe(true)
    })
    it('should show the validating state while doing async validation', async () => {
      vi.useFakeTimers()
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const field = new FieldLogic(form, 'name', {
        validatorAsync: async (value) => {
          await new Promise((resolve) => setTimeout(resolve, 100))
          return value === 'test' ? undefined : 'error'
        },
      })
      field.mount()

      field.handleChange('test1')
      const validationPromise = field.validateForEvent('onSubmit')
      await vi.advanceTimersByTime(100)

      expect(field.isValidating.value).toBe(true)
      await validationPromise

      expect(field.isValidating.value).toBe(false)

      vi.useRealTimers()
    })
    it('should not accept value changes through its handlers when unmounted', () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const field = new FieldLogic(form, 'name')
      field.mount()
      field.unmount()

      expect(field.data).toBeUndefined()
      field.handleChange('test1')
      expect(field.data).toBeUndefined()
    })
    it('should update the default values if updated with new ones', () => {
      const form = new FormLogic<{ name: string }>()
      const field = new FieldLogic(form, 'name', {
        defaultValue: 'default',
      })
      field.mount()

      expect(form.data.value.name.value).toBe('default')
      field.updateOptions({ defaultValue: 'new' })
      expect(form.data.value.name.value).toBe('new')
    })
    it('should not update the default values if the value is dirty', () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const field = new FieldLogic(form, 'name', {
        defaultValue: 'default',
      })
      field.mount()

      field.handleChange('new')
      field.updateOptions({ defaultValue: 'default' })

      expect(form.data.value.name.value).toBe('new')
    })
    it('should treat value as default, if the default value is updated to the current value of the form (makes it not dirty and overridable by updates to the options)', () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const field = new FieldLogic(form, 'name', {
        defaultValue: 'default',
      })
      field.mount()

      field.handleChange('new')
      expect(field.isDirty.value).toBe(true)
      field.updateOptions({ defaultValue: 'new' })
      expect(field.isDirty.value).toBe(false)

      // This checks, that the value is now actually treated as a default value
      field.updateOptions({ defaultValue: 'new another' })
      expect(form.data.value.name.value).toEqual('new another')
    })
    it('should reset the value back to the default without running validation', () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const field = new FieldLogic(form, 'name', {
        defaultValue: 'default',
        validator: (value) => value === 'default' && 'error',
      })
      field.mount()

      field.handleChange('new')
      field.resetValue()

      expect(field.data.value).toBe('default')
      expect(field.errors.value).toEqual([])
    })
    it('should reset both value and state', () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const field = new FieldLogic(form, 'name', {
        defaultValue: 'default',
        validator: (value) => value === 'new' && 'error',
      })
      field.mount()

      field.handleChange('new')
      field.handleBlur()

      expect(field.data.value).toBe('new')
      expect(field.errors.value).toEqual(['error'])
      expect(field.isTouched.value).toBe(true)

      field.reset()

      expect(field.data.value).toBe('default')
      expect(field.errors.value).toEqual([])
      expect(field.isTouched.value).toBe(false)
    })
    it('should remove a key from the data when using the helper function', () => {
      const form = new FormLogic<{ name: { first: string; last?: string } }>()
      form.mount()
      const field = new FieldLogic(form, 'name', {
        defaultValue: { first: 'default', last: 'hey' },
      })
      field.mount()

      expect(field.data.value.last).toBeDefined()
      field.removeValueInObject('last')
      expect(field.data.value.last).toBeUndefined()
    })
  })
  describe('transform', () => {
    it('should return undefined if no transformers are given', () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const field = new FieldLogic(form, 'name')
      field.mount()

      expect(field.transformedData.value).toBeUndefined()
    })
    it('should not write to the form if no transformFromBinding is given', () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'test',
        },
      })
      form.mount()
      const field = new FieldLogic(form, 'name', {
        transformToBinding: (value) => `${value}!`,
      })
      field.mount()

      field.transformedData.value = 'asd!'
      expect(field.data.value).toBe('test')
      expect(field.transformedData.value).toBe('test!')
    })
    it('should not read from the form if no transformToBinding is given', () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'test',
        },
      })
      form.mount()
      const field = new FieldLogic(form, 'name', {
        transformFromBinding: (value: string) => value.replace('!', ''),
      })
      field.mount()

      expect(field.transformedData.value).toBeUndefined()
      expect(field.data.value).toBe('test')

      field.transformedData.value = 'asd!'

      expect(field.transformedData.value).toBeUndefined()
      expect(field.data.value).toBe('asd')
    })
    it('should return a reactive signal which is a transformed representation of the signal when transformers are given', () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'test',
        },
      })
      form.mount()
      const field = new FieldLogic(form, 'name', {
        transformFromBinding: (value: string) => value.replace('!', ''),
        transformToBinding: (value) => `${value}!`,
      })
      field.mount()

      expect(field.transformedData.value).toBe('test!')
      expect(field.data.value).toBe('test')
      field.transformedData.value = 'asd!'

      expect(field.transformedData.value).toBe('asd!')
      expect(field.data.value).toBe('asd')
    })
    it('should handle changes to the transformed signal', () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'test',
        },
      })
      form.mount()
      const field = new FieldLogic(form, 'name', {
        transformFromBinding: (value: string) => value.replace('!', ''),
        transformToBinding: (value) => `${value}!`,
      })
      field.mount()

      expect(field.transformedData.value).toBe('test!')
      expect(field.data.value).toBe('test')
      field.handleChangeBound('asd!')

      expect(field.transformedData.value).toBe('asd!')
      expect(field.data.value).toBe('asd')
    })
    it("should not handle changes to the transformed signal if it's not mounted", () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'test',
        },
      })
      form.mount()
      const field = new FieldLogic(form, 'name', {
        transformFromBinding: (value: string) => value.replace('!', ''),
        transformToBinding: (value) => `${value}!`,
      })

      expect(field.transformedData.value).toBe('test!')
      expect(field.data.value).toBe('test')
      field.handleChangeBound('asd!')

      expect(field.transformedData.value).toBe('test!')
      expect(field.data.value).toBe('test')
    })
    it('should touch the field if handle change is called with shouldTouch: true', () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'test',
        },
      })
      form.mount()
      const field = new FieldLogic(form, 'name', {
        transformFromBinding: (value: string) => value.replace('!', ''),
        transformToBinding: (value) => `${value}!`,
      })
      field.mount()

      expect(field.isTouched.value).toBe(false)
      field.handleChangeBound('asd!', { shouldTouch: true })

      expect(field.isTouched.value).toBe(true)
    })
  })
})
