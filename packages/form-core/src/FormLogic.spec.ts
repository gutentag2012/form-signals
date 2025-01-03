import { effect } from '@preact/signals-core'
import { describe, expect, it, vi } from 'vitest'
import { FieldLogic } from './FieldLogic'
import { FormLogic } from './FormLogic'
import {
  ErrorTransformers,
  type ValidatorAdapter,
  type ValidatorAsync,
  type ValidatorSync,
  deepSignalifyValue,
} from './utils'
import { Truthy } from './utils/internal.utils'

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

describe('FormLogic', () => {
  it('should have the correct initial state', () => {
    const form = new FormLogic()

    expect(form.isMounted.value).toBeFalsy()
    form.mount()
    expect(form.isMounted.value).toBeTruthy()
    expect(form.disabled.value).toBe(false)

    expect(form.fields.value.length).toBe(0)

    expect(form.data.value).toStrictEqual({})
    expect(form.json.value).toStrictEqual({})
    expect(form.errors.value).toStrictEqual([])

    expect(form.isValidForm.value).toBe(true)
    expect(form.isValidFields.value).toBe(true)
    expect(form.isValid.value).toBe(true)

    expect(form.isTouched.value).toBe(false)
    expect(form.isDirty.value).toBe(false)
    expect(form.dirtyFields.value).toEqual([])

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
      expect(form.fields.peek().length).toBe(1)
      expect(form.fields.peek()[0]).toBe(field)
    })
    it('should loose a fields value once it is unmounted if configured', () => {
      const form = new FormLogic<{ name: string }>()
      const field = new FieldLogic(form, 'name', {
        removeValueOnUnmount: true,
      })
      field.mount()
      field.data.value = 'asd'
      expect(form.fields.peek().length).toBe(1)
      expect(form.json.value.name).toBe('asd')

      field.unmount()
      expect(form.fields.peek().length).toBe(0)
      expect(form.json.value.name).toBeUndefined()
    })
    it('should reset a fields value to default once it is unmounted if configured', () => {
      const form = new FormLogic<{ name: string }>()
      const field = new FieldLogic(form, 'name', {
        resetValueToDefaultOnUnmount: true,
        defaultValue: 'default',
      })
      field.mount()
      field.data.value = 'asd'
      expect(form.fields.peek().length).toBe(1)
      expect(form.json.value.name).toBe('asd')

      field.unmount()
      expect(form.fields.peek().length).toBe(0)
      expect(form.json.value.name).toBe('default')
    })
    it('should only keep a fields value once it is unmounted', () => {
      const form = new FormLogic<{ name: string }>()
      const field = new FieldLogic(form, 'name')
      field.mount()
      field.data.value = 'asd'
      expect(form.fields.peek().length).toBe(1)
      expect(form.json.value.name).toBe('asd')

      field.unmount()
      expect(form.fields.peek().length).toBe(0)
      expect(form.json.value.name).toBe('asd')
    })
    it('should no register a field that is already registered', () => {
      const form = new FormLogic<{ name: string }>()
      new FieldLogic(form, 'name')
      expect(form.fields.peek().length).toBe(1)

      new FieldLogic(form, 'name')
      expect(form.fields.peek().length).toBe(1)
    })
    it('should set the value of the form if a field with default value is registered', () => {
      const form = new FormLogic<{ name: string }>()
      expect(form.data.value.name).toBeUndefined()
      new FieldLogic(form, 'name', { defaultValue: 'default' })
      expect(form.data.value.name.value).toBe('default')
    })

    it('should have reactive data', () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()
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
      form.mount()
      const field = new FieldLogic(form, 'name')
      field.mount()
      expect(form.json.value).toStrictEqual({ name: '', array: [1, 2, 3] })

      form.data.value.array.value[0].data.value = 9
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
      form.mount()
      const field = new FieldLogic(form, 'name')
      field.mount()

      field.handleChange('value')
      expect(form.isDirty.value).toBe(true)

      field.handleChange('default')
      expect(form.isDirty.value).toBe(false)
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

      expect(form.isDirty.value).toBe(false)
      field.pushValueToArray(4)
      expect(form.isDirty.value).toBe(true)
    })
    it('should also consider newly added fields when calculating touched and dirty', () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'default',
          other: 'default',
        },
      })
      form.mount()
      const field = new FieldLogic(form, 'name')
      field.mount()

      expect(form.isTouched.value).toBe(false)
      expect(form.isDirty.value).toBe(false)

      const newField = new FieldLogic(form, 'other')
      newField.mount()

      expect(form.isTouched.value).toBe(false)
      expect(form.isDirty.value).toBe(false)

      field.handleBlur()
      expect(form.isTouched.value).toBe(true)
      expect(form.isDirty.value).toBe(false)

      newField.handleChange('value')
      expect(form.isTouched.value).toBe(true)
      expect(form.isDirty.value).toBe(true)
    })
    it('should not consider removed fields when calculating touched', () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'default',
          other: 'default',
        },
      })
      form.mount()
      const field = new FieldLogic(form, 'name')
      field.mount()

      expect(form.isTouched.value).toBe(false)
      expect(form.isDirty.value).toBe(false)

      const newField = new FieldLogic(form, 'other', {
        removeValueOnUnmount: true,
      })
      newField.mount()

      newField.handleBlur()
      newField.handleChange('value')
      expect(form.isTouched.value).toBe(true)
      expect(form.isDirty.value).toBe(true)
      newField.unmount()
      expect(form.isTouched.value).toBe(false)
      expect(form.isDirty.value).toBe(true)
    })
    it('should consider removed fields when calculating dirty (but not touched) state when configured', () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'default',
          other: 'default',
        },
      })
      form.mount()
      const field = new FieldLogic(form, 'name')
      field.mount()

      expect(form.isTouched.value).toBe(false)
      expect(form.isDirty.value).toBe(false)

      const newField = new FieldLogic(form, 'other')
      newField.mount()

      newField.handleBlur()
      newField.handleChange('value')
      expect(form.isTouched.value).toBe(true)
      expect(form.isDirty.value).toBe(true)

      newField.unmount()
      // It should not be touched, since the field that was touched was removed and a form is only touched if one of its fields is touched
      expect(form.isTouched.value).toBe(false)
      expect(form.isDirty.value).toBe(true)
    })
    it('should stay dirty but not touched when removed field sets value to undefined', () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'default',
          other: 'default',
        },
      })
      form.mount()
      const field = new FieldLogic(form, 'name')
      field.mount()

      expect(form.isTouched.value).toBe(false)
      expect(form.isDirty.value).toBe(false)

      const newField = new FieldLogic(form, 'other', {
        removeValueOnUnmount: true,
      })
      newField.mount()

      newField.handleBlur()
      newField.handleChange('value')
      expect(form.isTouched.value).toBe(true)
      expect(form.isDirty.value).toBe(true)

      newField.unmount()
      expect(form.isTouched.value).toBe(false)
      expect(form.isDirty.value).toBe(true)
    })

    it('should increment the submit count on submit', async () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'default',
        },
        validator: (value) => (value.name === 'test' ? undefined : 'error'),
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
        validatorAsync: async (value) => {
          await new Promise((resolve) => setTimeout(resolve, 100))
          return value.name === 'test' ? undefined : 'error'
        },
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
        validatorAsync: async () => {
          await new Promise((resolve) => setTimeout(resolve, 100))
          return undefined
        },
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
        validatorAsync: async () => {
          await new Promise((resolve) => setTimeout(resolve, 100))
          return undefined
        },
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
        validator: () => 'error',
      })
      await form.mount()

      await form.handleSubmit()
      expect(form.canSubmit.value).toBe(false)
    })
    it('should can submit if a form field is invalid, unmounted and did preserve its value', async () => {
      const form = new FormLogic<{ name: string }>()
      await form.mount()
      const field = new FieldLogic(form, 'name', {
        validator: () => 'error',
        validatorOptions: {
          validateOnMount: true,
        },
      })
      await field.mount()
      expect(form.canSubmit.value).toBe(false)
      field.unmount()
      // It should be possible to submit since the validator is not mounted anymore
      expect(form.canSubmit.value).toBe(true)
    })
    it('should not can submit if the form is disabled', async () => {
      const form = new FormLogic<{ name: string }>()
      await form.mount()
      form.disable()
      expect(form.canSubmit.value).toBe(false)
    })
    it("should can submit if a form field is invalid, unmounted and didn't preserve its value", async () => {
      const form = new FormLogic<{ name: string }>()
      await form.mount()
      const field = new FieldLogic(form, 'name', {
        removeValueOnUnmount: true,
        validator: () => 'error',
        validatorOptions: {
          validateOnMount: true,
        },
      })
      await field.mount()
      expect(form.canSubmit.value).toBe(false)
      field.unmount()
      expect(form.canSubmit.value).toBe(true)
    })

    it('should update the default values if updated with new ones', () => {
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: 'default',
        },
      })

      expect(form.data.value.name.value).toBe('default')
      form.updateOptions({ defaultValues: { name: 'new' } })
      expect(form.data.value.name.value).toBe('new')
    })
    it('should not update the default values if the value is dirty', () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'default',
          dirty: false,
        },
      })

      form.data.value.dirty.value = true

      form.updateOptions({ defaultValues: { name: 'new', dirty: false } })
      expect(form.data.value.name.value).toBe('new')
      expect(form.data.value.dirty.value).toBe(true)
    })
    it('should treat value as default, if the default value is updated to the current value of the form (makes it not dirty and overridable by updates to the options)', () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'default',
        },
      })

      form.data.value.name.value = 'new'
      expect(form.isDirty.value).toBe(true)
      form.updateOptions({ defaultValues: { name: 'new' } })
      expect(form.isDirty.value).toBe(false)

      // This checks, that the value is now actually treated as a default value
      form.updateOptions({ defaultValues: { name: 'new another' } })
      expect(form.data.value.name.value).toEqual('new another')
    })
    it('should not update default values for fields that are dirty', () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'default',
        },
      })
      form.mount()
      const field = new FieldLogic(form, 'name')
      field.mount()

      field.handleChange('new')
      form.updateOptions({ defaultValues: { name: 'changed this' } })
      expect(form.data.value.name.value).toBe('new')

      field.handleChange('changed this')
      form.updateOptions({ defaultValues: { name: 'another' } })
      expect(form.data.value.name.value).toBe('another')
    })
    it('should not update default values that are dirty even without a field', () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'default',
        },
      })

      form.data.value.name.value = 'new'
      form.updateOptions({ defaultValues: { name: 'changed this' } })
      expect(form.data.value.name.value).toBe('new')

      form.data.value.name.value = 'changed this'
      form.updateOptions({ defaultValues: { name: 'another' } })
      expect(form.data.value.name.value).toBe('another')
    })
    it('should be able to remove fields of dynamic objects or items from an array when updating the options', () => {
      const form = new FormLogic<{
        obj: { [key: string]: string }
        array: number[]
      }>({
        defaultValues: {
          obj: {
            stay: 'stay',
            go: 'go',
          },
          array: [1, 2, 3],
        },
      })
      form.mount()

      expect(form.json.value).toEqual({
        obj: {
          stay: 'stay',
          go: 'go',
        },
        array: [1, 2, 3],
      })
      form.updateOptions({
        defaultValues: {
          obj: { stay: 'stay(changed)', new: 'new' },
          array: [2],
        },
      })
      expect(form.json.value).toEqual({
        obj: {
          stay: 'stay(changed)',
          new: 'new',
        },
        array: [2],
      })
    })
    it('should not update the defaultValue of an array when updating the options', async () => {
      const form = new FormLogic<{ array: number[] }>({
        defaultValues: {
          array: [1, 2, 3],
        },
      })
      await form.mount()

      form.handleChange('array', [4, 5])
      form.updateOptions({ defaultValues: { array: [1, 2, 3] } })
      expect(form.json.value.array).toEqual([4, 5])
    })
    it('should not change dates when updating options of a dirty fields', () => {
      const d1 = new Date('2021-01-01')
      const d2 = new Date('2021-01-02')
      const form = new FormLogic<{ date: Date }>({
        defaultValues: {
          date: d1,
        },
      })
      form.mount()
      const field = new FieldLogic(form, 'date')
      field.mount()

      field.data.value = d2
      form.updateOptions({ defaultValues: { date: d1 } })
      form.updateOptions({ defaultValues: { date: d1 } })
      expect(form.json.value.date).toEqual(d2)
    })

    it('should update the data when using the handleChange method', () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()

      form.handleChange('name', 'value')
      expect(form.data.value.name.value).toBe('value')
    })
    it('should update the data when using the handleChange method when the nested value does not exist', () => {
      const form = new FormLogic<{ name: { nested: string } }>()
      form.mount()

      form.handleChange('name.nested', 'value')
      expect(form.data.value.name.value.nested.value).toBe('value')
    })
    it('should touch a connected field when handling calling handleChange with a field connected', () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()
      const field = new FieldLogic(form, 'name')
      field.mount()

      expect(field.isTouched.value).toBe(false)
      expect(form.isTouched.value).toBe(false)
      form.handleChange('name', 'value', { shouldTouch: true })
      expect(field.isTouched.value).toBe(true)
      expect(form.isTouched.value).toBe(true)
    })
    it('should not touch anything when handling calling handleChange with no field connected', () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()

      form.handleChange('name', 'value', { shouldTouch: true })
      expect(form.isTouched.value).toBe(false)
    })
    it('should not handleChange if form is not mounted', () => {
      const form = new FormLogic<{ name: string }>()
      form.handleChange('name', 'value')
      expect(form.data.value.name).toBeUndefined()
    })

    it('should be possible to enable and disable the form', () => {
      const form = new FormLogic<{ name: string }>()
      form.mount()
      form.disable()
      expect(form.disabled.value).toBe(true)
      form.enable()
      expect(form.disabled.value).toBe(false)
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
      form.mount()
      const field = new FieldLogic(form, 'name', {
        validator: (v) => v.length >= 3 && 'error',
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

      field.handleChange('value')
      expect(form.isValidatingFields.value).toBe(false)
      const validatingPromise = field.validateForEvent('onSubmit')
      expect(form.isValidatingFields.value).toBe(true)

      vi.advanceTimersByTime(100)
      await validatingPromise
      expect(form.isValidatingFields.value).toBe(false)

      vi.useRealTimers()
    })
    it('should not overwrite existing values in the form with a newly created field', () => {
      const form = new FormLogic({
        defaultValues: {
          name: '',
        },
      })
      form.mount()

      form.data.value.name.value = 'test'
      const field = form.getOrCreateField('name', {
        defaultValue: 'default',
      })
      field.mount()

      expect(field.data.value).toBe('test')
    })
    it('should skip the form validation that is triggered by adding a field to the form', () => {
      const form = new FormLogic<{ name: string }>({
        validator: () => 'error',
        defaultValues: {
          name: 'default',
        },
      })
      form.mount()
      const field = new FieldLogic(form, 'name')
      field.mount()

      expect(form.isValid.value).toBe(true)
      field.handleChange('test')
      expect(form.isValid.value).toBe(false)
    })
  })
  describe('state (field groups)', () => {
    it('should be valid if all field groups are valid', () => {
      const form = new FormLogic({
        defaultValues: {
          start: 0,
          end: 1,
        },
      })
      form.mount()
      const group = form.getOrCreateFieldGroup(['start', 'end'], {
        validator: (value) =>
          value.start < value.end ? undefined : 'Start must be before end',
      })
      group.mount()
      group.validateForEvent('onChange')

      expect(group.isValid.value).toBeTruthy()
      expect(form.isValidFieldGroups.value).toBeTruthy()
      expect(form.isValid.value).toBeTruthy()
    })
    it('should be invalid if any field group is invalid', () => {
      const form = new FormLogic({
        defaultValues: {
          start: 1,
          end: 0,
        },
      })
      form.mount()
      const group = form.getOrCreateFieldGroup(['start', 'end'], {
        validator: (value) =>
          value.start < value.end ? undefined : 'Start must be before end',
      })
      group.mount()
      group.validateForEvent('onChange')

      expect(group.isValid.value).toBeFalsy()
      expect(form.isValidFieldGroups.value).toBeFalsy()
      expect(form.isValid.value).toBeFalsy()
      expect(form.fieldGroupErrors.value).toEqual(['Start must be before end'])
    })
    it('should be validating if any field group is validating', async () => {
      vi.useFakeTimers()
      const form = new FormLogic({
        defaultValues: {
          start: 0,
          end: 1,
        },
      })
      await form.mount()
      const group = form.getOrCreateFieldGroup(['start', 'end'], {
        validatorAsync: async (value) => {
          await new Promise((resolve) => setTimeout(resolve, 100))
          return value.start < value.end
            ? undefined
            : 'Start must be before end'
        },
      })
      await group.mount()
      const validatingPromise = group.validateForEvent('onChange')

      expect(form.isValidatingFieldGroups.value).toBeTruthy()
      await vi.advanceTimersByTimeAsync(100)
      await validatingPromise
      expect(form.isValidatingFieldGroups.value).toBeFalsy()

      vi.useRealTimers()
    })
    it('should return all groups registered on the form', () => {
      const form = new FormLogic({
        defaultValues: {
          start: 0,
          end: 1,
        },
      })
      form.mount()
      const group1 = form.getOrCreateFieldGroup(['start', 'end'])
      const group2 = form.getOrCreateFieldGroup(['start'])
      const group3 = form.getOrCreateFieldGroup(['end', 'start'])

      expect(form.fieldGroups.value).toEqual([group1, group2])
      expect(group3).toBe(group1)
    })
    it('should remove groups that are unregistered', () => {
      const form = new FormLogic({
        defaultValues: {
          start: 0,
          end: 1,
        },
      })
      form.mount()
      const group = form.getOrCreateFieldGroup(['start', 'end'])
      group.mount()

      expect(form.fieldGroups.value).toEqual([group])
      group.unmount()
      // The second `unmount` does nothing, but is used to increase the coverage
      group.unmount()
      expect(form.fieldGroups.value).toEqual([])
    })
    it('should not mutate the passed members array when creating a field group', () => {
      const members = ['start', 'end'] as ['start', 'end']
      const form = new FormLogic({
        defaultValues: {
          start: 0,
          end: 1,
        },
      })
      form.mount()

      form.getOrCreateFieldGroup(members)
      expect(members).toEqual(['start', 'end'])
    })
  })
  describe('validation', () => {
    it('should trigger submit validation for all fields on submit as well as the form', async () => {
      const form = new FormLogic<{ name: string; other: string }>({
        validator: (value) => {
          return [
            !value.name && 'name is required',
            !value.other && 'other is required',
          ]
            .filter(Truthy)
            .join(',')
        },
      })
      const field1 = new FieldLogic(form, 'name', {
        validator: () => 'error',
      })
      const field2 = new FieldLogic(form, 'other', {
        validator: () => 'error',
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
        validator: (value) => (value.name === 'test' ? undefined : 'error'),
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
        validator: (value) => (value.name === 'test' ? undefined : 'error'),
        validatorOptions: {
          disableOnChangeValidation: true,
        },
      })
      await form.mount()
      const field = new FieldLogic(form, 'name')
      await field.mount()

      await field.handleBlur()
      expect(form.errors.value).toEqual(['error'])
      field.handleChange('test')
      expect(form.errors.value).toEqual([])
      await field.handleBlur()
      expect(form.errors.value).toEqual([])
    })
    it('should validate on mount', async () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'test',
          other: undefined,
        },
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
      await form.mount()

      expect(form.errors.value).toEqual(['other is required'])
    })
    it('should work with async validators', async () => {
      vi.useFakeTimers()
      const form = new FormLogic<{ name: string }>({
        validatorAsync: async () => {
          await new Promise((resolve) => setTimeout(resolve, 100))
          return 'error'
        },
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
        validatorAsync: async (value) => {
          validateFn(value.name)
          await new Promise((resolve) => setTimeout(resolve, 100))
          return value.name === 'test' ? undefined : 'error'
        },
        validatorAsyncOptions: {
          debounceMs: 100,
        },
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
        validator: (value) => (value.name === 'test' ? undefined : 'error'),
        validatorOptions: {
          disableOnChangeValidation: true,
        },
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
    it('should reset the change errors after change', () => {
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: '',
        },
        validator: (value) => (value.name === 'test' ? undefined : 'error'),
      })
      form.mount()

      form.data.value.name.value = 'test1'

      expect(form.errors.value).toEqual(['error'])
      form.data.value.name.value = 'test'
      expect(form.errors.value).toEqual([])
    })
    it('should abort async validations if there was another validation before the promise resolved', async () => {
      vi.useFakeTimers()
      const validateFn = vi.fn()
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: '',
        },
        validatorAsync: async (value, abortSignal) => {
          await new Promise((resolve) => setTimeout(resolve, 100))
          if (abortSignal.aborted) return 'aborted'
          validateFn(value)
          return value.name === 'test' ? undefined : 'error'
        },
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
    it('should not run async validations if the sync validation already failed unless configured otherwise', async () => {
      vi.useFakeTimers()
      const validateFn = vi.fn()
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: '',
        },
        validatorAsync: async (value) => {
          validateFn(value)
          await new Promise((resolve) => setTimeout(resolve, 100))
          return value.name === 'test' ? undefined : 'error'
        },
        validator: (value) => (value.name === 'test' ? undefined : 'error'),
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
      await form.mount()

      form.data.value.name.value = 'test1'
      const promise = form.handleSubmit()
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
        validator: validate,
        validatorOptions: {
          validateOnMount: true,
        },
      })
      form.mount()

      form.handleBlur()
      form.data.value.name.value = 'test'
      await form.handleSubmit()

      expect(validate).toHaveBeenCalledTimes(4)
    })
    it('should not validate if unmounted', async () => {
      const validate = vi.fn(() => undefined)
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: '',
        },
        validator: validate,
      })
      await form.mount().then((unmount) => unmount())

      form.data.value.name.value = 'asd'
      await form.handleBlur()
      await form.handleSubmit()

      expect(validate).toHaveBeenCalledTimes(0)
    })
    it('should only force validate if unmounted for submit event', async () => {
      const validate = vi.fn(() => undefined)
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: '',
        },
        validator: validate,
      })

      form.validateForEvent('onMount')
      form.validateForEvent('onBlur')
      form.validateForEvent('onChange')
      form.validateForEvent('onSubmit')

      expect(validate).toHaveBeenCalledTimes(1)
    })
    it('should not show errors for fields that are unmounted', async () => {
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: '',
        },
      })
      form.mount()
      const field = new FieldLogic(form, 'name', {
        validator: () => 'error',
        removeValueOnUnmount: true,
      })
      field.mount()

      form.data.value.name.value = 'test1'

      expect(field.errors.value).toEqual(['error'])
      expect(form.fieldErrors.value).toEqual(['error'])
      field.unmount()

      expect(field.errors.value).toEqual([])
      expect(form.fieldErrors.value).toEqual([])
    })
    it('should validate with a given adapter', () => {
      const form = new FormLogic<number, typeof adapter>({
        validatorAdapter: adapter,
        validator: 5 as never,
      })
      form.mount()

      form.data.value = 6
      expect(form.errors.value).toEqual([
        'Value must be less than or equal to 5',
      ])
      form.data.value = 4
      expect(form.errors.value).toEqual([])
    })
    it('should validate with the usual validation even if an adapter is given', () => {
      const form = new FormLogic<number, typeof adapter>({
        validatorAdapter: adapter,
        validator: (value) => (value === 5 ? 'Value must not be 5' : undefined),
      })
      form.mount()

      form.data.value = 5
      expect(form.errors.value).toEqual(['Value must not be 5'])
      form.data.value = 6
      expect(form.errors.value).toEqual([])
    })
    it('should work with an adapter and async validation', async () => {
      vi.useFakeTimers()

      const form = new FormLogic<number, typeof adapter>({
        validatorAdapter: adapter,
        validatorAsync: 5 as never,
      })
      await form.mount()

      form.data.value = 6
      const validationPromise = form.validateForEvent('onChange')
      expect(form.errors.value).toEqual([])
      await vi.advanceTimersByTimeAsync(100)
      await validationPromise
      expect(form.errors.value).toEqual([
        'Value must be less than or equal to 5',
      ])

      vi.useRealTimers()
    })
    it('should throw an error if non-function validator is given without an adapter for sync validation', async () => {
      const form = new FormLogic<number, typeof adapter>({
        validator: 5 as never,
      })

      await expect(form.mount()).rejects.toThrowError(
        'The sync validator must be a function',
      )
    })
    it('should throw an error if non-function validator is given without an adapter for async validation', async () => {
      const form = new FormLogic<number, typeof adapter>({
        validatorAsync: 5 as never,
      })

      await expect(form.mount()).rejects.toThrowError(
        'The async validator must be a function',
      )
    })
    it('should not validate unmounted fields onSubmit', async () => {
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: 'default',
        },
      })
      await form.mount()
      const field = new FieldLogic(form, 'name', {
        validator: () => 'error',
      })
      await field.mount()

      field.unmount()
      await form.handleSubmit()
      expect(field.errors.value).toEqual([])
    })
    it('should validate unmounted fields if they are kept, only for the submit event', async () => {
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: 'default',
        },
      })
      await form.mount()
      const field = new FieldLogic(form, 'name', {
        validator: () => 'error',
        keepInFormOnUnmount: true,
      })
      await field.mount()

      field.unmount()
      await form.handleSubmit()
      expect(field.errors.value).toEqual(['error'])
    })
    it("should not validate unmounted fields if they are kept, for any event other than 'onSubmit'", async () => {
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: 'default',
        },
      })
      await form.mount()
      const field = new FieldLogic(form, 'name', {
        validator: () => 'error',
        keepInFormOnUnmount: true,
      })
      await field.mount()

      field.unmount()
      form.data.value.name.value = 'asd'
      expect(field.errors.value).toEqual([])
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
        validatorAsync: async () => {
          await new Promise((resolve) => setTimeout(resolve, 100))
          return undefined
        },
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
        validatorAsync: async () => {
          await new Promise((resolve) => setTimeout(resolve, 100))
          return undefined
        },
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

      await expect(form.handleSubmit()).resolves.toBeUndefined()
      expect(form.submitCountUnsuccessful.value).toBe(1)
      expect(form.errors.value).toEqual([error.message])
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
      const submitPromise = expect(form.handleSubmit()).resolves.toBeUndefined()
      expect(form.submitCountUnsuccessful.value).toBe(0)
      await vi.advanceTimersByTimeAsync(100)
      await submitPromise
      expect(form.submitCountUnsuccessful.value).toBe(1)
      expect(form.errors.value).toEqual([error.message])
      vi.useRealTimers()
    })
    it("should put any thrown sync error into the form's errors", async () => {
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

      await expect(form.handleSubmit()).resolves.toBeUndefined()
      expect(form.errors.value).toEqual([error.message])
    })
    it("should put any thrown async error into the form's errors", async () => {
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
      const submitPromise = expect(form.handleSubmit()).resolves.toBeUndefined()
      await vi.advanceTimersByTimeAsync(100)
      await submitPromise
      expect(form.errors.value).toEqual([error.message])
      vi.useRealTimers()
    })
    it('should throw any non-error that is thrown', async () => {
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: 'test',
        },
        onSubmit: () => {
          throw 'error'
        },
      })
      await form.mount()

      const promise = expect(form.handleSubmit()).rejects.toEqual('error')
      expect(form.isSubmitting.value).toBe(true)
      await promise
      expect(form.isSubmitting.value).toBe(false)
      expect(form.errors.value).toEqual([])
    })
    it('should add errors to fields they are added during submission', async () => {
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: 'test',
        },
        onSubmit: (_, addErrors) => {
          addErrors({
            name: 'error',
          })
        },
      })
      await form.mount()
      const field = form.getOrCreateField('name')
      await field.mount()

      expect(field.errors.value).toEqual([])
      await form.handleSubmit()
      expect(field.errors.value).toEqual(['error'])
    })
    it('should reset submission errors after any change', async () => {
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: 'test',
        },
        onSubmit: () => {
          throw new Error('error')
        },
      })
      await form.mount()

      await form.handleSubmit()
      expect(form.errors.value).toEqual(['error'])
      form.data.value.name.value = 'test1'
      expect(form.errors.value).toEqual([])
    })
    it('should not add errors during submission to non-existing fields', async () => {
      const form = new FormLogic({
        defaultValues: {
          other: 'test',
        },
        onSubmit: (_, addErrors) => {
          addErrors({
            other: 'error',
          })
        },
      })
      await form.mount()

      expect(form.errors.value).toEqual([])
      await form.handleSubmit()
      expect(form.errors.value).toEqual([])
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
      await form.mount()

      const firstNameField = form.getOrCreateField('names.1')
      await firstNameField.mount()
      const addressField = form.getOrCreateField('address')
      await addressField.mount()
      const zipCodeField = form.getOrCreateField('address.zipCode')
      await zipCodeField.mount()

      expect(firstNameField.errors.value).toEqual([])
      expect(addressField.errors.value).toEqual([])
      expect(zipCodeField.errors.value).toEqual([])
      const submitPromise = form.handleSubmit()
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
    it('should be able to add errors to the form itself during submission', async () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'test',
        },
        onSubmit: (_, addErrors) => {
          addErrors({
            '': 'error',
          })
        },
      })
      await form.mount()

      expect(form.errors.value).toEqual([])
      await form.handleSubmit()
      expect(form.errors.value).toEqual(['error'])
    })
    it('should be able to add a general error by passing a string to the add errors function during submission', async () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'test',
        },
        onSubmit: (_, addErrors) => {
          addErrors('error')
        },
      })
      await form.mount()

      expect(form.errors.value).toEqual([])
      await form.handleSubmit()
      expect(form.errors.value).toEqual(['error'])
    })
    it('should not be able to submit if the form is disabled', async () => {
      const onSubmit = vi.fn()
      const form = new FormLogic({
        defaultValues: {
          name: 'test',
        },
        onSubmit,
      })
      await form.mount()
      form.disable()

      await form.handleSubmit()
      expect(onSubmit).not.toBeCalled()
    })
    it('should validate all groups for the submit event', async () => {
      const form = new FormLogic({
        defaultValues: {
          start: 1,
          end: 0,
        },
      })
      await form.mount()
      const group = form.getOrCreateFieldGroup(['start', 'end'], {
        validator: (value) =>
          value.start < value.end ? undefined : 'Start must be before end',
      })
      await group.mount()

      expect(group.errors.value).toEqual([])
      await form.handleSubmit()
      expect(group.errors.value).toEqual(['Start must be before end'])
      expect(form.submitCountUnsuccessful.value).toBe(1)
    })
    it('should ignore debounce for submit validation', async () => {
      vi.useFakeTimers()

      const validateFn = vi.fn()
      const form = new FormLogic({
        defaultValues: {
          name: 'test',
        },
        validatorAsync: async (value) => {
          validateFn(value.name)
          return 'error'
        },
        validatorAsyncOptions: {
          debounceMs: 100,
        },
      })
      await form.mount()

      const formPromise = form.handleSubmit()
      expect(form.errors.value).toEqual([])
      await formPromise
      expect(form.errors.value).toEqual(['error'])

      vi.useRealTimers()
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
          validator: () => 'error',
          validatorOptions: {
            disableOnBlurValidation: true,
          },
        })
        await form.mount()
        const field = new FieldLogic(form, 'deep.value' as const, {
          validator: () => 'error',
          validatorOptions: {
            disableOnBlurValidation: true,
          },
        })
        await field.mount()
        await field.handleBlur()

        await form.handleSubmit()

        field.handleChange(2)
        form.data.value.name.value = 'test1'
        form.pushValueToArray('array', 2)

        expect(form.data.value.name.value).toBe('test1')
        expect(form.data.value.deep.value.value.value).toBe(2)
        expect(form.errors.value).toEqual(['error'])
        expect(field.errors.value).toEqual(['error'])
        expect(form.isTouched.value).toBe(true)
        expect(form.isDirty.value).toBe(true)
        expect(form.dirtyFields.value).toEqual([
          'name',
          'deep.value',
          'array',
          'array.1',
        ])
        expect(form.submitCount.value).toBe(1)

        form.reset()

        expect(form.data.value.name.value).toBe('test')
        expect(form.data.value.deep.value.value.value).toBe(1)
        expect(form.errors.value).toEqual([])
        expect(field.errors.value).toEqual([])
        expect(form.isTouched.value).toBe(false)
        expect(form.isDirty.value).toBe(false)
        expect(form.dirtyFields.value).toEqual([])
        expect(form.submitCount.value).toBe(0)
      })
      it('should use the default values of the fields when resetting the values', () => {
        const form = new FormLogic<{ name: string }>()
        const field = new FieldLogic(form, 'name', {
          defaultValue: 'test',
        })
        form.mount()
        field.mount()

        field.handleChange('value')
        expect(form.data.value.name.value).toBe('value')
        form.reset()
        expect(form.data.value.name.value).toBe('test')
      })
      it('should trigger the reactive updates of all nested values within the default values', () => {
        const defaultValues = {
          name: 'test',
          deep: {
            item: 1,
          },
          array: [
            {
              value: 1,
            },
          ],
        }
        const form = new FormLogic<{
          name: string
          deep: { item: number; other?: string }
          array: Array<{ value: number }>
          hidden?: string
        }>({
          defaultValues,
        })
        form.mount()

        form.data.value.name.value = 'test1'
        form.data.value.deep.value.item.value = 2
        form.pushValueToArray('array', { value: 2 })
        form.data.value.array.value[0].data.value.value.value = 3
        form.data.value.deep.value = {
          ...form.data.value.deep.value,
          other: deepSignalifyValue('test'),
        }
        form.data.value = {
          ...form.data.value,
          hidden: deepSignalifyValue('test'),
        }

        expect(form.json.value).toEqual({
          name: 'test1',
          deep: {
            item: 2,
            other: 'test',
          },
          array: [{ value: 3 }, { value: 2 }],
          hidden: 'test',
        })

        const nestedUpdate = vi.fn()
        let ignoreEffect = 9
        effect(() => {
          const value = form.data.peek().name.value
          if (ignoreEffect-- > 0) return
          nestedUpdate(value)
        })
        effect(() => {
          const value = form.data.peek().deep.peek().item.value
          if (ignoreEffect-- > 0) return
          nestedUpdate(value)
        })
        effect(() => {
          const value = form.data.peek().deep.peek().other?.value
          if (ignoreEffect-- > 0) return
          // This should not trigger
          nestedUpdate(value)
          throw new Error(
            'Should not update the other deep value since it is not included in the default values',
          )
        })
        effect(() => {
          const value = form.data.peek().array.peek()[0].data.peek().value.value
          if (ignoreEffect-- > 0) return
          nestedUpdate(value)
        })
        effect(() => {
          const value = form.data.peek().array.peek()[1].data.peek().value.value
          if (ignoreEffect-- > 0) return
          // This should not trigger
          nestedUpdate(value)
          throw new Error(
            'Should not update the second array value since it is not included in the default values',
          )
        })
        effect(() => {
          const value = form.data.peek().deep.value
          if (ignoreEffect-- > 0) return
          nestedUpdate(value)
        })
        effect(() => {
          const value = form.data.peek().array.value

          if (ignoreEffect-- > 0) return
          nestedUpdate(value)
        })
        effect(() => {
          const value = form.data.peek().hidden?.value
          if (ignoreEffect-- > 0) return
          nestedUpdate(value)
        })
        effect(() => {
          const value = form.data.value
          if (ignoreEffect-- > 0) return
          nestedUpdate(value)
        })
        expect(ignoreEffect).toBe(0)

        form.reset()

        expect(form.json.value).toEqual(defaultValues)
        expect(nestedUpdate).toHaveBeenCalledTimes(6)
      })
      it('should reset dirty array fields back to default value', () => {
        const form = new FormLogic({
          defaultValues: {
            array: [1, 2, 3],
          },
        })
        form.mount()
        const arrayField = form.getOrCreateField('array')
        arrayField.mount()

        arrayField.pushValueToArray(4)

        expect(form.json.value).toEqual({
          array: [1, 2, 3, 4],
        })
        expect(arrayField.data.value.length).toBe(4)
        form.reset()
        expect(form.json.value).toEqual({
          array: [1, 2, 3],
        })
        expect(arrayField.data.value.length).toBe(3)
      })
      it('should reset dirty array fields if the default value is on the field', () => {
        const form = new FormLogic<{ array: number[] }>()
        form.mount()
        const arrayField = form.getOrCreateField('array', {
          defaultValue: [1, 2, 3],
        })
        arrayField.mount()

        arrayField.pushValueToArray(4)

        expect(form.json.value).toEqual({
          array: [1, 2, 3, 4],
        })
        expect(arrayField.data.value.length).toBe(4)
        form.reset()
        expect(form.json.value).toEqual({
          array: [1, 2, 3],
        })
        expect(arrayField.data.value.length).toBe(3)
      })
    })

    describe('array', () => {
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
      it('should do nothing when trying to inser a value into a form value when disabled', () => {
        const form = new FormLogic({
          defaultValues: {
            array: [1, 2, 3],
          },
        })
        form.mount()
        form.disable()
        form.insertValueInArray('array', 1, 4)
        expect(form.json.value.array).toEqual([1, 2, 3])
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
      it("should remove fields that are removed from the form's array", () => {
        const form = new FormLogic({
          defaultValues: {
            array: [1, 2, 3],
          },
        })
        form.mount()
        const field = new FieldLogic(form, 'array.1')
        field.mount()

        expect(form.fields.value.length).toBe(1)
        form.removeValueFromArray('array', 1)
        expect(form.fields.value.length).toBe(0)
      })
      it('should remove from the base object, if the whole form is an array', () => {
        const form = new FormLogic({
          defaultValues: [1, 2, 3],
        })
        form.mount()
        form.removeValueFromArray('', 1)
        expect(form.json.value).toEqual([1, 3])
      })
      it('should do nothing when trying to remove from a non existing index', () => {
        const form = new FormLogic({
          defaultValues: [1, 2, 3],
        })
        form.mount()
        form.removeValueFromArray('', 3)
        form.removeValueFromArray('', -1)
        expect(form.json.value).toEqual([1, 2, 3])
      })
      it('should do nothing when trying to remove an array item when disabled', () => {
        const form = new FormLogic({
          defaultValues: [1, 2, 3],
        })
        form.mount()
        form.disable()
        form.removeValueFromArray('', 1)
        expect(form.json.value).toEqual([1, 2, 3])
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
      it('should do nothing when trying to push a value into a form value when disabled', () => {
        const form = new FormLogic({
          defaultValues: {
            array: [1, 2, 3],
          },
        })
        form.mount()
        form.disable()
        form.pushValueToArray('array', 4)
        expect(form.json.value.array).toEqual([1, 2, 3])
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
      it('should push a value into a form value array at an index', () => {
        const form = new FormLogic({
          defaultValues: {
            array: [1, 2, 3],
          },
        })
        form.mount()
        form.pushValueToArrayAtIndex('array', 1, 4)
        expect(form.json.value.array).toEqual([1, 4, 2, 3])
      })
      it('should not do anything when trying to push a value at an index into a form value that is not an array', () => {
        const form = new FormLogic({
          defaultValues: {
            array: 1,
          },
        })
        form.mount()
        form.pushValueToArrayAtIndex('array', 1 as never, 4 as never)
        expect(form.data.value.array.value).toEqual(1)
      })
      it('should do nothing when trying to push a value at an index into a form value when disabled', () => {
        const form = new FormLogic({
          defaultValues: {
            array: [1, 2, 3],
          },
        })
        form.mount()
        form.disable()
        form.pushValueToArrayAtIndex('array', 1, 4)
        expect(form.json.value.array).toEqual([1, 2, 3])
      })
      it('should touch a field when pushing a value into a form value array at an index if a field is attached', () => {
        const form = new FormLogic({
          defaultValues: {
            array: [1, 2, 3],
          },
        })
        form.mount()
        const field = new FieldLogic(form, 'array')
        field.mount()
        form.pushValueToArrayAtIndex('array', 1, 4, { shouldTouch: true })
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
      it('should do nothing when trying to swap two values in a form value when disabled', () => {
        const form = new FormLogic({
          defaultValues: {
            array: [1, 2, 3],
          },
        })
        form.mount()
        form.disable()
        form.swapValuesInArray('array', 1, 2)
        expect(form.json.value.array).toEqual([1, 2, 3])
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
      it('should do nothing when trying to swap two values from non existing indexes', () => {
        const form = new FormLogic({
          defaultValues: {
            array: [1, 2, 3],
          },
        })
        form.mount()
        form.swapValuesInArray('array', 3, 4)
        form.swapValuesInArray('array', -1, 4)
        expect(form.json.value.array).toEqual([1, 2, 3])
      })
      it('should move a value in a form value array', () => {
        const form = new FormLogic({
          defaultValues: {
            array: [1, 2, 3],
          },
        })
        form.mount()
        form.moveValueInArray('array', 0, 2)
        expect(form.json.value.array).toEqual([2, 3, 1])
      })
      it('should not do anything when trying to move a value in a form value that is not an array', () => {
        const form = new FormLogic({
          defaultValues: {
            array: 1,
          },
        })
        form.mount()
        form.moveValueInArray('array', 1 as never, 2 as never)
        expect(form.data.value.array.value).toEqual(1)
      })
      it('should do nothing when trying to move a value in a form value when disabled', () => {
        const form = new FormLogic({
          defaultValues: {
            array: [1, 2, 3],
          },
        })
        form.mount()
        form.disable()
        form.moveValueInArray('array', 1, 2)
        expect(form.json.value.array).toEqual([1, 2, 3])
      })
      it('should touch a field when moving a value in a form value array if a field is attached', () => {
        const form = new FormLogic({
          defaultValues: {
            array: [1, 2, 3],
          },
        })
        form.mount()
        const field = new FieldLogic(form, 'array')
        field.mount()
        form.moveValueInArray('array', 1, 2, { shouldTouch: true })
        expect(field.isTouched.value).toBe(true)
      })
      it('should not touch a field when moving a value in a form value array if no field is attached', () => {
        const form = new FormLogic({
          defaultValues: {
            array: [1, 2, 3],
          },
        })
        form.mount()
        expect(() =>
          form.moveValueInArray('array', 1, 2, { shouldTouch: true }),
        ).not.toThrow()
      })
      it('should do nothing when trying to move a value from non existing indexes', () => {
        const form = new FormLogic({
          defaultValues: {
            array: [1, 2, 3],
          },
        })
        form.mount()
        form.moveValueInArray('array', 3, 4)
        form.moveValueInArray('array', -1, 4)
        expect(form.json.value.array).toEqual([1, 2, 3])
      })
    })

    describe('object', () => {
      it('should add a new key to an object', () => {
        const form = new FormLogic<{ deep: { [key: string]: number } }>({
          defaultValues: {
            deep: {
              value: 1,
            },
          },
        })
        form.mount()

        const fn = vi.fn()
        effect(() => {
          fn(form.data.peek().deep.value)
        })
        fn.mockReset()

        form.setValueInObject('deep', 'new', 2)
        expect(form.data.value.deep.value.new.value).toBe(2)
        expect(fn).toHaveBeenCalledTimes(1)
      })
      it('should touch a field when adding a new key to an object if configured', () => {
        const form = new FormLogic<{ deep: { [key: string]: number } }>({
          defaultValues: {
            deep: {
              value: 1,
            },
          },
        })
        form.mount()
        const field = new FieldLogic(form, 'deep')
        field.mount()

        expect(field.isTouched.value).toBe(false)
        form.setValueInObject('deep', 'new', 2, { shouldTouch: true })
        expect(field.isTouched.value).toBe(true)
      })
      it('should update a value in an object that already has the key', () => {
        const form = new FormLogic<{ deep: { [key: string]: number } }>({
          defaultValues: {
            deep: {
              value: 1,
            },
          },
        })
        form.mount()

        const fn = vi.fn()
        effect(() => {
          fn(form.data.peek().deep.peek().value.value)
        })
        fn.mockReset()

        form.setValueInObject('deep', 'value', 2)
        expect(form.data.value.deep.value.value.value).toBe(2)
        expect(fn).toHaveBeenCalledTimes(1)
      })
      it('should be able to add a new key to the root object', () => {
        const form = new FormLogic<{ [key: string]: number }>({
          defaultValues: {
            value: 1,
          },
        })
        form.mount()

        const fn = vi.fn()
        effect(() => {
          fn(form.data.value)
        })
        fn.mockReset()

        form.setValueInObject('', 'new', 2)
        expect(form.data.value.new.value).toBe(2)
        expect(fn).toHaveBeenCalledTimes(1)
      })
      it('should do nothing when trying to add a key to a value that is not an object or a date', () => {
        const form = new FormLogic({
          defaultValues: {
            deep: 1,
            date: new Date(),
          },
        })
        form.mount()

        const fn = vi.fn()
        effect(() => {
          fn(form.data.peek().deep.value)
        })
        fn.mockReset()

        form.setValueInObject('deep', 'new' as never, 2 as never)
        form.setValueInObject('date', 'new' as never, 2 as never)
        expect(fn).toHaveBeenCalledTimes(0)
      })
      it('should do nothing when trying to add a new key to an object when disabled', () => {
        const form = new FormLogic<{ deep: { [key: string]: number } }>({
          defaultValues: {
            deep: {
              value: 1,
            },
          },
        })
        form.mount()
        form.disable()

        form.setValueInObject('deep', 'new', 2)
        expect(form.data.value.deep.value.new).toBeUndefined()
      })
      it('should remove a key to an object', () => {
        const form = new FormLogic<{ deep: { value?: number } }>({
          defaultValues: {
            deep: {
              value: 1,
            },
          },
        })
        form.mount()

        const fn = vi.fn()
        effect(() => {
          fn(form.data.peek().deep.value)
        })
        fn.mockReset()

        form.removeValueInObject('deep', 'value')
        expect(form.data.value.deep.value.value).toBeUndefined()
        expect(fn).toHaveBeenCalledTimes(1)
      })
      it("should remove fields that are removed from the object's keys", () => {
        const form = new FormLogic<{ deep: { value?: number } }>({
          defaultValues: {
            deep: {
              value: 1,
            },
          },
        })
        form.mount()
        const field = new FieldLogic(form, 'deep.value')
        field.mount()

        expect(form.fields.value.length).toBe(1)
        form.removeValueInObject('deep', 'value')
        expect(form.fields.value.length).toBe(0)
      })
      it('should touch a field when removing a key from an object if configured', () => {
        const form = new FormLogic<{ deep: { value?: number } }>({
          defaultValues: {
            deep: {
              value: 1,
            },
          },
        })
        form.mount()
        const field = new FieldLogic(form, 'deep')
        field.mount()

        expect(field.isTouched.value).toBe(false)
        form.removeValueInObject('deep', 'value', { shouldTouch: true })
        expect(field.isTouched.value).toBe(true)
      })
      it('should do nothing when trying to remove a key to a value that is not an object or a date', () => {
        const form = new FormLogic({
          defaultValues: {
            deep: 1,
            date: new Date(),
          },
        })
        form.mount()

        const fn = vi.fn()
        effect(() => {
          fn(form.data.peek().deep.value)
        })
        fn.mockReset()

        form.removeValueInObject('deep', 'new' as never)
        form.removeValueInObject('date', 'new' as never)
        expect(fn).toHaveBeenCalledTimes(0)
      })
      it("should do nothing when trying to remove a key that doesn't exist", () => {
        const form = new FormLogic<{ deep: { value?: number } }>({
          defaultValues: {
            deep: {
              value: 1,
            },
          },
        })
        form.mount()

        const fn = vi.fn()
        effect(() => {
          fn(form.data.peek().deep.value)
        })
        fn.mockReset()

        form.removeValueInObject('deep', 'new' as never)
        expect(fn).toHaveBeenCalledTimes(0)
      })
      it('should do nothing when trying to remove a key from an object when disabled', () => {
        const form = new FormLogic<{ deep: { value?: number } }>({
          defaultValues: {
            deep: {
              value: 1,
            },
          },
        })
        form.mount()
        form.disable()

        form.removeValueInObject('deep', 'value')
        expect(form.data.value.deep.value).toBeDefined()
      })
    })

    describe('getOrCreateField', () => {
      it('should create a new field if it is not already existing', () => {
        const form = new FormLogic<{ name: string }>({
          defaultValues: {
            name: 'default',
          },
        })

        expect(form.fields.value.length).toBe(0)
        const field = form.getOrCreateField('name')
        expect(field).toBeInstanceOf(FieldLogic)
        expect(field.data.value).toEqual('default')
        expect(form.fields.value.length).toBe(1)
      })
      it('should retrieve an existing field if it is already existing', () => {
        const form = new FormLogic<{ name: string }>({
          defaultValues: {
            name: 'default',
          },
        })
        const field = form.getOrCreateField('name')
        expect(form.fields.value.length).toBe(1)
        expect(form.getOrCreateField('name')).toBe(field)
      })
      it('should create a new field with provided options', () => {
        const form = new FormLogic<{ name: string }>({
          defaultValues: {
            name: 'default',
          },
        })
        form.mount()
        const field = form.getOrCreateField('name', {
          validator: () => 'error',
          validatorOptions: {
            validateOnMount: true,
          },
        })
        field.mount()
        expect(field.errors.value).toEqual(['error'])
      })
      it('should retrieve an existing field and update its options', () => {
        const form = new FormLogic<{ name: string }>()
        form.mount()
        new FieldLogic(form, 'name', {
          defaultValue: 'default',
        }).mount()

        const field = form.getOrCreateField('name', {
          defaultValue: 'new default',
        })
        expect(field.data.value).toEqual('new default')
      })
    })

    it('should allow to handleChange on the data itself', () => {
      const form = new FormLogic({
        defaultValues: 'value',
      })
      form.mount()

      form.handleChange('', 'newValue')

      expect(form.data.value).toBe('newValue')
    })
  })
  describe('bugs', () => {
    it('#119 - should be able to reset array fields after children mounted', () => {
      const form = new FormLogic<{
        variants: Array<{ name: string; options: string[] }>
      }>()
      form.mount()
      const variantsField = form.getOrCreateField('variants', {
        defaultValue: [],
      })
      variantsField.mount()
      variantsField.pushValueToArray({ name: 'variant1', options: [] })

      const variant1NameField = form.getOrCreateField('variants.0.name')
      variant1NameField.mount()
      const variant1OptionsField = form.getOrCreateField('variants.0.options')
      variant1OptionsField.mount()

      expect(form.json.value).toEqual({
        variants: [{ name: 'variant1', options: [] }],
      })
      form.reset()
      expect(form.json.value).toEqual({
        variants: [],
      })
    })
  })
})
