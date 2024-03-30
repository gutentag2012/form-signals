import { FormLogic } from '@formsignals/form-core'
import { cleanup, render } from '@testing-library/react'
// biome-ignore lint/correctness/noUnusedImports: This is the React import
import React, { useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useForm, useFormWithComponents } from './form.hooks'

describe('Form hooks', () => {
  describe('useForm', () => {
    it('should create a new form with the provided options', () => {
      function MyComponent() {
        const form = useForm({
          defaultValues: {
            name: 'John',
          },
        })
        return <div>{form.data.value.name.value}</div>
      }

      const screen = render(<MyComponent />)

      expect(screen.getByText('John')).toBeDefined()

      cleanup()
    })
    it("should mount and unmount the form with component's lifecycle", () => {
      const mounted = vi.fn()
      function MyComponent() {
        const form = useForm({
          defaultValues: {
            name: 'John',
          },
        })

        useEffect(() => {
          mounted(form.isMounted.value)
          return () => mounted(form.isMounted.value)
        }, [form, mounted])
        return <div>{form.data.value.name.value}</div>
      }

      const screen = render(<MyComponent />)

      expect(screen.getByText('John')).toBeDefined()

      screen.unmount()

      expect(mounted.mock.calls).toEqual([[true], [false]])

      cleanup()
    })
    it("should update the form options when the hooks' options change", () => {
      function MyComponent({ defaultValue }: { defaultValue: string }) {
        const form = useForm({
          defaultValues: {
            name: defaultValue,
          },
        })
        return <div>{form.data.value.name.value}</div>
      }

      const screen = render(<MyComponent defaultValue={'John'} />)
      expect(screen.getByText('John')).toBeDefined()

      screen.rerender(<MyComponent defaultValue={'NoJohn'} />)
      expect(screen.getByText('NoJohn')).toBeDefined()

      cleanup()
    })
  })
  describe('useFormWithComponents', () => {
    it('should return the field context from the provided field logic', () => {
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: 'John',
        },
      })

      function MyComponent() {
        const fieldWithComponents = useFormWithComponents(form)

        return (
          <div>
            <p>
              Has Provider: {JSON.stringify(!!fieldWithComponents.FormProvider)}
            </p>
            <p>
              Has FieldProvider:{' '}
              {JSON.stringify(!!fieldWithComponents.FieldProvider)}
            </p>
            <p>
              Has handleSubmitOnEnter:{' '}
              {JSON.stringify(!!fieldWithComponents.handleSubmitOnEnter)}
            </p>
            <p>
              Has Value:{' '}
              {JSON.stringify(fieldWithComponents.data.value.name.value)}
            </p>
          </div>
        )
      }

      const screen = render(<MyComponent />)

      expect(screen.getByText('Has Provider: true')).toBeDefined()
      expect(screen.getByText('Has FieldProvider: true')).toBeDefined()
      expect(screen.getByText('Has handleSubmitOnEnter: true')).toBeDefined()
      expect(screen.getByText('Has Value: "John"')).toBeDefined()

      cleanup()
    })
  })
})
