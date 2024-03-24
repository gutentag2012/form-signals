import { FieldLogic, FormLogic } from '@signal-forms/form-core'
import { cleanup, render } from '@testing-library/react'
// biome-ignore lint/correctness/noUnusedImports: This is the React import
import React from 'react'
import { describe, expect, it } from 'vitest'
import { fieldLogicToFieldContext, useFieldContext } from './field.context'

describe('Field Context', () => {
  describe('fieldLogicToFieldContext', () => {
    it('should add FieldProvider and SubFieldProvider to the logic', () => {
      const fieldLogic = {} as FieldLogic<never, never, unknown>
      const fieldContext = fieldLogicToFieldContext(fieldLogic)

      expect(fieldContext.FieldProvider).toBeDefined()
      expect(fieldContext.SubFieldProvider).toBeDefined()
    })
    it('should provide the logic with the FieldProvider and SubFieldProvider with the FieldProvider', () => {
      function ContextConsumer() {
        const context = useFieldContext()
        return (
          <div>
            <p>Has Provider: {JSON.stringify(!!context.FieldProvider)}</p>
            <p>
              Has SubFieldProvider: {JSON.stringify(!!context.SubFieldProvider)}
            </p>
            <p>Value: {context.signal.value}</p>
          </div>
        )
      }
      const form = new FormLogic({
        defaultValues: {
          name: 'default',
        },
      })
      const field = new FieldLogic(form, 'name')
      const fieldContext = fieldLogicToFieldContext(field)

      const screen = render(
        <fieldContext.FieldProvider>
          <ContextConsumer />
        </fieldContext.FieldProvider>,
      )

      expect(screen.getByText('Has Provider: true')).toBeDefined()
      expect(screen.getByText('Has SubFieldProvider: true')).toBeDefined()
      expect(screen.getByText('Value: default')).toBeDefined()

      cleanup()
    })
    it('should create a SubField based on the parent field when using the SubFieldProvider', () => {
      function ContextConsumer() {
        const context = useFieldContext()
        return (
          <div>
            <p>Value: {context.signal.value}</p>
          </div>
        )
      }
      const form = new FormLogic({
        defaultValues: {
          name: {
            first: 'default',
          },
        },
      })
      const field = new FieldLogic(form, 'name')
      const fieldContext = fieldLogicToFieldContext(field)

      const screen = render(
        <fieldContext.FieldProvider>
          <fieldContext.SubFieldProvider name="first">
            <ContextConsumer />
          </fieldContext.SubFieldProvider>
        </fieldContext.FieldProvider>,
      )

      expect(screen.getByText('Value: default')).toBeDefined()

      cleanup()
    })
  })
  describe('useFieldContext', () => {
    it('should throw an error if used outside of a FieldProvider', () => {
      function ContextConsumer() {
        useFieldContext()
        return null
      }
      expect(() => {
        render(<ContextConsumer />)
      }).toThrowError('useFieldContext must be used within a FieldProvider')
    })
    it('should return the field context when used within a FieldProvider', () => {
      function ContextConsumer() {
        const context = useFieldContext()
        return (
          <div>
            <p>Has context: {JSON.stringify(!!context)}</p>
          </div>
        )
      }
      const fieldContext = fieldLogicToFieldContext(
        {} as FieldLogic<never, never>,
      )

      const screen = render(
        <fieldContext.FieldProvider>
          <ContextConsumer />
        </fieldContext.FieldProvider>,
      )

      expect(screen.getByText('Has context: true')).toBeDefined()

      cleanup()
    })
  })
})
