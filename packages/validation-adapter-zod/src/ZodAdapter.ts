import type {
  ValidatorAdapter,
  ValidatorAsync,
  ValidatorSync,
} from '@formsignals/form-core'
import type { z } from 'zod'

/**
 * A validator adapter for Zod that allows to use Zod schemas as validators in Signal Forms
 */
export interface ZodAdapterOptions {
  /**
   * If this is true, only the first error message will be returned, otherwise all error messages will be joined
   */
  takeFirstError?: boolean
  /**
   * The string to join error messages with
   * @default ', '
   */
  joinErrorsWith?: string
}

function handleZodResult(
  result: z.SafeParseReturnType<any, any>,
  options?: ZodAdapterOptions,
): string | undefined {
  if (result.success) return undefined
  const errorMessages = result.error.issues.map((issue) => issue.message)
  if (options?.takeFirstError) return errorMessages[0]
  return errorMessages.join(options?.joinErrorsWith ?? ', ')
}

/**
 * Creates a validator adapter for Zod with specified options
 *
 * @param options Options for the adapter
 *
 * @returns A validator adapter that can be used with Signal Forms
 */
export function configureZodAdapter(
  options?: ZodAdapterOptions,
): ValidatorAdapter {
  return {
    sync<TValue, TMixins extends readonly any[] = never[]>(
      validator: z.ZodType<TValue>,
    ): ValidatorSync<TValue, TMixins> {
      const res = (value: TValue) => {
        const result = validator.safeParse(value)
        return handleZodResult(result, options)
      }
      return res as ValidatorSync<TValue, TMixins>
    },
    async<TValue, TMixins extends readonly any[] = never[]>(
      validator: z.ZodType<TValue>,
    ): ValidatorAsync<TValue, TMixins> {
      const res = async (value: TValue, abortSignal: AbortSignal) => {
        if (abortSignal.aborted) return undefined
        const result = await validator.safeParseAsync(value)
        if (abortSignal.aborted) return undefined
        return handleZodResult(result, options)
      }
      return res as ValidatorAsync<TValue, TMixins>
    },
  }
}

/**
 * The default Zod adapter with the default options
 */
export const ZodAdapter: ValidatorAdapter = configureZodAdapter()

declare module '@formsignals/form-core' {
  export interface ValidatorSchemaType<TValue, TMixin = never[]> {
    // biome-ignore lint/style/useShorthandFunctionType: We need this to be an interface to allow for it to be overridden
    (): z.ZodType<
      TMixin extends never[]
        ? TValue
        : TMixin extends any[]
          ? [TValue, ...TMixin]
          : TMixin extends readonly any[]
            ? [TValue, ...TMixin]
            : TValue
    >
  }
}
