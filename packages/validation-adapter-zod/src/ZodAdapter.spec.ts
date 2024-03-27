import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { configureZodAdapter } from './ZodAdapter'

describe('ZodAdapter', () => {
  it.each([
    ['string', z.string(), 'correct', 0],
    ['number', z.number(), 1, 'incorrect'],
    ['boolean', z.boolean(), true, 'incorrect'],
    ['date', z.date(), new Date(), 'incorrect'],
    [
      'object',
      z.object({
        name: z.string(),
        age: z.number(),
      }),
      {
        name: 'correct',
        age: 0,
      },
      'incorrect',
    ],
    ['array', z.array(z.string()), ['correct'], 'incorrect'],
    ['tuple', z.tuple([z.string(), z.number()]), ['correct', 0], 'incorrect'],
  ])(
    'should handle errors for schema %s',
    async (_, schema, correct, incorrect) => {
      const adapter = configureZodAdapter()
      const noError = adapter.sync(schema as never)(correct)
      expect(noError).toBeUndefined()
      const noError2 = await adapter.async(schema as never)(correct, {
        aborted: false,
      } as AbortSignal)
      expect(noError2).toBeUndefined()

      const error = adapter.sync(schema as never)(incorrect)
      expect(error).toBeDefined()
      const error2 = await adapter.async(schema as never)(incorrect, {
        aborted: false,
      } as AbortSignal)
      expect(error2).toBeDefined()
    },
  )
  it('should ignore async validation if signal is aborted', async () => {
    const adapter = configureZodAdapter()
    const schema = z.string()
    const error = await adapter.async(schema)('incorrect', {
      aborted: true,
    } as AbortSignal)
    expect(error).toBeUndefined()
  })
  it('should ignore async validation if signal is aborted after the validation ran', async () => {
    vi.useFakeTimers()
    const schema = z.string().refine(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
      return false
    }, 'this is an error')

    const adapter = configureZodAdapter()
    const abortController = new AbortController()
    const validationPromise = adapter.async(schema)(
      'incorrect',
      abortController.signal,
    )

    await vi.advanceTimersByTimeAsync(50)
    abortController.abort()
    await vi.advanceTimersByTimeAsync(50)

    const error = await validationPromise
    expect(error).toBeUndefined()

    vi.useRealTimers()
  })
  it('should join multiple errors if not configured otherwise', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    })
    const adapter = configureZodAdapter()
    const error = adapter.sync(schema)({
      name: 0 as never,
      age: '0' as never,
    })
    expect(error).toBe(
      'Expected string, received number, Expected number, received string',
    )
  })
  it('should allow to change the join string', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    })
    const adapter = configureZodAdapter({ joinErrorsWith: ' - ' })
    const error = adapter.sync(schema)({
      name: 0 as never,
      age: '0' as never,
    })
    expect(error).toBe(
      'Expected string, received number - Expected number, received string',
    )
  })
  it('should only take the first error if configured', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    })
    const adapter = configureZodAdapter({ takeFirstError: true })
    const error = adapter.sync(schema)({
      name: 0 as never,
      age: '0' as never,
    })
    expect(error).toBe('Expected string, received number')
  })
})
