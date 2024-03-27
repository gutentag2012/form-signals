import { FieldLogic, FormLogic } from '@signal-forms/form-core'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { configureZodAdapter } from './ZodAdapter'

describe('ZodAdapter (field)', () => {
  it('should validate the field on change with the ', () => {
    const form = new FormLogic<{ name: string }>()
    form.mount()
    const field = new FieldLogic(form, 'name', {
      validatorAdapter: configureZodAdapter(),
      validator: z.string().min(1, 'This field is required'),
    })
    field.mount()

    expect(field.errors.value).toEqual([])
    form.data.value.name.value = ''
    expect(field.errors.value).toEqual(['This field is required'])
  })
  it('should validated with a configured adapter', () => {
    const form = new FormLogic<{ field: { name: string; another: number } }>()
    form.mount()
    const field = new FieldLogic(form, 'field', {
      validatorAdapter: configureZodAdapter({ takeFirstError: true }),
      validator: z.object({
        another: z.number(),
        name: z.string(),
      }),
      defaultValue: {
        another: 0,
        name: '',
      },
    })
    field.mount()

    expect(field.errors.value).toEqual([])
    field.data.value = {
      name: 0 as never,
      another: 'string' as never,
    }
    expect(field.errors.value).toEqual(['Expected number, received string'])
  })
  it('should work with async validation', async () => {
    vi.useFakeTimers()

    const form = new FormLogic<{ name: string }>()
    await form.mount()
    const field = new FieldLogic(form, 'name', {
      validatorAdapter: configureZodAdapter(),
      validatorAsync: z.string().refine(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return false
      }, 'Custom validator'),
      defaultValue: 'default',
    })
    await field.mount()

    expect(field.errors.value).toEqual([])
    field.data.value = 'another'
    expect(field.errors.value).toEqual([])
    await vi.advanceTimersByTimeAsync(1000)
    expect(field.errors.value).toEqual(['Custom validator'])

    vi.useRealTimers()
  })
  it('should work with validation configurations on the form', () => {
    const form = new FormLogic({
      defaultValues: {
        name: '',
      },
    })
    form.mount()
    const field = new FieldLogic(form, 'name', {
      validatorAdapter: configureZodAdapter(),
      validator: z.string().min(1, 'This field is required'),
      validatorOptions: {
        validateOnMount: true,
      },
    })
    field.mount()

    expect(field.errors.value).toEqual(['This field is required'])
  })
  it('should still allow validation through a function when using an adapter', () => {
    const form = new FormLogic({
      defaultValues: {
        name: '',
      },
    })
    form.mount()
    const field = new FieldLogic(form, 'name', {
      validatorAdapter: configureZodAdapter(),
      validator: () => 'error',
      validatorOptions: {
        validateOnMount: true,
      },
    })
    field.mount()

    expect(field.errors.value).toEqual(['error'])
  })
  it('should fallback to the form adapter if the field adapter is not set', () => {
    const form = new FormLogic({
      defaultValues: {
        name: '',
      },
      validatorAdapter: configureZodAdapter(),
    })
    form.mount()
    const field = new FieldLogic(form, 'name', {
      validator: z.string().min(1, 'This field is required'),
      validatorOptions: {
        validateOnMount: true,
      },
    })
    field.mount()

    expect(field.errors.value).toEqual(['This field is required'])
  })
  it('should throw an error if trying to validate without an adapter', async () => {
    const form = new FormLogic({
      defaultValues: {
        name: '',
      },
    })
    await form.mount()
    const field = new FieldLogic(form, 'name', {
      validator: z.object({
        name: z.string().min(1, 'This field is required'),
      }) as never,
      validatorOptions: {
        validateOnMount: true,
      },
    })

    await expect(field.mount()).rejects.toThrowError()
  })
})
