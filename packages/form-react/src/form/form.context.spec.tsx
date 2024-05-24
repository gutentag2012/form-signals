import { FormLogic } from '@formsignals/form-core'
import { cleanup, render } from '@testing-library/react'
// biome-ignore lint/correctness/noUnusedImports: This is the React import
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { formLogicToFormContext, useFormContext } from './form.context'

describe('Form Context', () => {
  describe('formLogicToFormContext', () => {
    it('should add FormProvider, FieldProvider, FieldGroupProvider and handleSubmitOnEnter to the logic', () => {
      const formLogic = new FormLogic()
      const formContext = formLogicToFormContext(formLogic)

      expect(formContext.FormProvider).toBeDefined()
      expect(formContext.FieldProvider).toBeDefined()
      expect(formContext.FieldGroupProvider).toBeDefined()
      expect(formContext.handleSubmitOnEnter).toBeDefined()
    })
    it('should provide the logic with the FormProvider, FieldProvider, FieldGroupProvider and handleSubmitOnEnter with the FormProvider', () => {
      function ContextConsumer() {
        const context = useFormContext()
        return (
          <div>
            <p>Has FormProvider: {JSON.stringify(!!context.FormProvider)}</p>
            <p>Has FieldProvider: {JSON.stringify(!!context.FieldProvider)}</p>
            <p>
              Has FieldGroupProvider:{' '}
              {JSON.stringify(!!context.FieldGroupProvider)}
            </p>
            <p>
              Has handleSubmitOnEnter:{' '}
              {JSON.stringify(!!context.handleSubmitOnEnter)}
            </p>
            <p>Has Value: {JSON.stringify(!!context.data.value)}</p>
          </div>
        )
      }
      const form = new FormLogic({
        defaultValues: {
          name: 'default',
        },
      })
      const formContext = formLogicToFormContext(form)

      const screen = render(
        <formContext.FormProvider>
          <ContextConsumer />
        </formContext.FormProvider>,
      )

      expect(screen.getByText('Has FormProvider: true')).toBeDefined()
      expect(screen.getByText('Has FieldProvider: true')).toBeDefined()
      expect(screen.getByText('Has FieldGroupProvider: true')).toBeDefined()
      expect(screen.getByText('Has handleSubmitOnEnter: true')).toBeDefined()
      expect(screen.getByText('Has Value: true')).toBeDefined()

      cleanup()
    })
    it('should create a Field based on the form when using the FieldProvider', () => {
      type FormValues = {
        name: string
      }
      function ContextConsumer() {
        const context = useFormContext<FormValues>()
        return (
          <context.FieldProvider name="name">
            {(field) => field.data.value}
          </context.FieldProvider>
        )
      }
      const form = new FormLogic({
        defaultValues: {
          name: 'default',
        },
      })
      const formContext = formLogicToFormContext(form)

      const screen = render(
        <formContext.FormProvider>
          <ContextConsumer />
        </formContext.FormProvider>,
      )

      expect(screen.getByText('default')).toBeDefined()

      cleanup()
    })
    it('should bind submit handler', async () => {
      const submitHandler = vi.fn()
      const formLogic = new FormLogic({
        onSubmit: submitHandler,
      })
      await formLogic.mount()
      const formContext = formLogicToFormContext(formLogic)

      const screen = render(
        <formContext.FormProvider>
          <button type="button" onClick={formContext.handleSubmit}>
            Submit
          </button>
        </formContext.FormProvider>,
      )

      screen.getByText('Submit').click()

      await new Promise((r) => setTimeout(r, 0))

      expect(submitHandler).toHaveBeenCalled()

      cleanup()
    })
  })
  describe('useFormContext', () => {
    it('should throw an error when used outside of a FormProvider', () => {
      function ContextConsumer() {
        const context = useFormContext()
        return (
          <div>
            <p>Has context: {JSON.stringify(!!context)}</p>
          </div>
        )
      }

      expect(() => {
        render(<ContextConsumer />)
      }).toThrowError('useFormContext must be used within a FormProvider')
    })
    it('should return the form context when used within a FormProvider', () => {
      function ContextConsumer() {
        const context = useFormContext()
        return (
          <div>
            <p>Has context: {JSON.stringify(!!context)}</p>
          </div>
        )
      }
      const form = new FormLogic({
        defaultValues: {
          name: 'default',
        },
      })
      const formContext = formLogicToFormContext(form)

      const screen = render(
        <formContext.FormProvider>
          <ContextConsumer />
        </formContext.FormProvider>,
      )

      expect(screen.getByText('Has context: true')).toBeDefined()

      cleanup()
    })
  })
})
