import { FormLogic } from '@form-signals/form-core'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { ZodAdapter, configureZodAdapter } from './ZodAdapter'

describe('ZodAdapter (form)', () => {
  it('should validate the complete form on change', () => {
    const form = new FormLogic({
      validatorAdapter: ZodAdapter,
      validator: z.object({
        name: z.string(),
      }),
      defaultValues: {
        name: '',
      },
    })
    form.mount()

    expect(form.errors.value).toEqual([])
    form.data.value.name.value = 1 as never
    expect(form.errors.value).toEqual(['Expected string, received number'])
  })
  it('should validated with a configured adapter', () => {
    const form = new FormLogic({
      validatorAdapter: configureZodAdapter({ takeFirstError: true }),
      validator: z.object({
        another: z.number(),
        name: z.string(),
      }),
      defaultValues: {
        another: 0,
        name: '',
      },
    })
    form.mount()

    expect(form.errors.value).toEqual([])
    form.data.value.name.value = 1 as never
    form.data.value.another.value = '1' as never
    expect(form.errors.value).toEqual(['Expected number, received string'])
  })
  it('should work with async validation', async () => {
    vi.useFakeTimers()

    const form = new FormLogic({
      validatorAdapter: ZodAdapter,
      validatorAsync: z
        .object({
          name: z.string(),
        })
        .refine(async () => {
          await new Promise((resolve) => setTimeout(resolve, 1000))
          return false
        }, 'Custom validator'),
      defaultValues: {
        name: '',
      },
    })
    await form.mount()

    expect(form.errors.value).toEqual([])
    form.data.value.name.value = 'another'
    expect(form.errors.value).toEqual([])
    await vi.advanceTimersByTimeAsync(1000)
    expect(form.errors.value).toEqual(['Custom validator'])

    vi.useRealTimers()
  })
  it('should work with validation configurations on the form', () => {
    const form = new FormLogic({
      validatorAdapter: ZodAdapter,
      validator: z.object({
        name: z.string().min(1, 'This field is required'),
      }),
      validatorOptions: {
        validateOnMount: true,
      },
      defaultValues: {
        name: '',
      },
    })
    form.mount()

    expect(form.errors.value).toEqual(['This field is required'])
  })
  it('should still allow validation through a function when using an adapter', () => {
    const form = new FormLogic({
      validatorAdapter: ZodAdapter,
      validator: () => 'error',
      validatorOptions: {
        validateOnMount: true,
      },
      defaultValues: {
        name: '',
      },
    })
    form.mount()

    expect(form.errors.value).toEqual(['error'])
  })
  it('should throw an error if trying to validate without an adapter', async () => {
    const form = new FormLogic({
      validator: z.object({
        name: z.string().min(1, 'This field is required'),
      }) as never,
      validatorOptions: {
        validateOnMount: true,
      },
      defaultValues: {
        name: '',
      },
    })

    await expect(form.mount()).rejects.toThrowError()
  })
})
