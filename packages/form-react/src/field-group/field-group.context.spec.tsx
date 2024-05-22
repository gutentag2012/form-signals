import { FormLogic } from '@formsignals/form-core'
import { cleanup, render } from '@testing-library/react'
// biome-ignore lint/correctness/noUnusedImports: This is the React import
import React from 'react'
import { describe, expect, it } from 'vitest'
import {
  fieldGroupLogicToFieldGroupContext,
  useFieldGroupContext,
} from './field-group.context'

describe('Field Group Context', () => {
  describe('fieldGroupLogicToFieldGroupContext', () => {
    it('should add FieldGroupProvider and FieldProvider to the logic', () => {
      const form = new FormLogic<{ name: string }>()
      const groupLogic = form.getOrCreateFieldGroup(['name'])
      const groupContext = fieldGroupLogicToFieldGroupContext(groupLogic)

      expect(groupContext.FieldProvider).toBeDefined()
      expect(groupContext.FieldGroupProvider).toBeDefined()
    })
    it('should provide the logic with the FieldGroupProvider and FieldProvider with the FieldGroupProvider', () => {
      function ContextConsumer() {
        const context = useFieldGroupContext<{ v: string }, ['v']>()
        return (
          <div>
            <p>Has Provider: {JSON.stringify(!!context.FieldProvider)}</p>
            <p>
              Has FieldGroupProvider:{' '}
              {JSON.stringify(!!context.FieldGroupProvider)}
            </p>
            <p>Value: {context.data.value.v}</p>
          </div>
        )
      }
      const form = new FormLogic({
        defaultValues: {
          v: 'default',
        },
      })
      const groupLogic = form.getOrCreateFieldGroup(['v'])
      const groupContext = fieldGroupLogicToFieldGroupContext(groupLogic)

      const screen = render(
        <groupContext.FieldGroupProvider>
          <ContextConsumer />
        </groupContext.FieldGroupProvider>,
      )

      expect(screen.getByText('Has Provider: true')).toBeDefined()
      expect(screen.getByText('Has FieldGroupProvider: true')).toBeDefined()
      expect(screen.getByText('Value: default')).toBeDefined()

      cleanup()
    })
  })
  describe('useFieldGroupContext', () => {
    it('should throw an error if used outside of a FieldGroupProvider', () => {
      function ContextConsumer() {
        useFieldGroupContext()
        return null
      }
      expect(() => {
        render(<ContextConsumer />)
      }).toThrowError(
        'useFieldGroupContext must be used within a FieldGroupProvider',
      )
    })
    it('should return the field group context when used within a FieldGroupProvider', () => {
      function ContextConsumer() {
        const context = useFieldGroupContext()
        return (
          <div>
            <p>Has context: {JSON.stringify(!!context)}</p>
          </div>
        )
      }
      const form = new FormLogic<{ name: string }>()
      const groupLogic = form.getOrCreateFieldGroup(['name'])
      const groupContext = fieldGroupLogicToFieldGroupContext(groupLogic)

      const screen = render(
        <groupContext.FieldGroupProvider>
          <ContextConsumer />
        </groupContext.FieldGroupProvider>,
      )

      expect(screen.getByText('Has context: true')).toBeDefined()

      cleanup()
    })
  })
})
