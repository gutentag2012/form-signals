import { FormLogic } from '@form-signals/form-core'
import { cleanup, render } from '@testing-library/react'
// biome-ignore lint/correctness/noUnusedImports: This is the React import
import React from 'react'
import { describe, expect, it } from 'vitest'
import { useField, useFieldWithComponents } from './field.hooks'

describe('Field hooks', () => {
  describe('useField', () => {
    it('should create a new field within the given form with the provided options', () => {
      const form = new FormLogic<{ name: string }>()

      function MyComponent() {
        const field = useField(form, 'name', {
          defaultValue: 'John',
        })
        return <div>{field.data.value}</div>
      }

      const screen = render(<MyComponent />)

      expect(screen.getByText('John')).toBeDefined()
      expect(form.fields.value.length).toBe(1)

      cleanup()
    })
    it("should mount and unmount the field with component's lifecycle", () => {
      const form = new FormLogic<{ name: string }>()

      function MyComponent() {
        const field = useField(form, 'name', {
          defaultValue: 'John',
        })
        return <div>{field.data.value}</div>
      }

      const screen = render(<MyComponent />)

      expect(screen.getByText('John')).toBeDefined()
      expect(form.fields.value.length).toBe(1)

      screen.unmount()

      expect(form.fields.value.length).toBe(0)

      cleanup()
    })
    it("should update the fields options when the hooks' options change", () => {
      const form = new FormLogic<{ name: string }>()

      function MyComponent({ defaultValue }: { defaultValue: string }) {
        const field = useField(form, 'name', {
          defaultValue,
        })
        return <div>{field.data.value}</div>
      }

      const screen = render(<MyComponent defaultValue={'John'} />)
      expect(screen.getByText('John')).toBeDefined()

      screen.rerender(<MyComponent defaultValue={'NoJohn'} />)
      expect(screen.getByText('NoJohn')).toBeDefined()

      // The value should not update if the field is dirty
      form.data.value.name.value = 'John'
      screen.rerender(<MyComponent defaultValue={'Something different'} />)
      expect(screen.getByText('John')).toBeDefined()

      cleanup()
    })
    it('should create a new field if the name changes', () => {
      const form = new FormLogic<{ name: string; otherName: string }>()

      function MyComponent({ name }: { name: 'name' | 'otherName' }) {
        useField(form, name, {
          defaultValue: 'set',
        })
        return null
      }

      expect(form.json.value).toEqual({})

      const screen = render(<MyComponent name={'name'} />)
      expect(form.fields.value.length).toBe(1)
      expect(form.json.value).toEqual({
        name: 'set',
      })

      screen.rerender(<MyComponent name={'otherName'} />)
      expect(form.fields.value.length).toBe(1)
      expect(form.json.value).toEqual({
        otherName: 'set',
      })

      cleanup()
    })
  })
  describe('useFieldWithComponents', () => {
    it('should return the field context from the provided field logic', () => {
      const form = new FormLogic<{ name: string }>()
      const field = form.getOrCreateField('name')

      function MyComponent() {
        const fieldWithComponents = useFieldWithComponents(field)

        return (
          <div>
            <p>
              Has Provider:{' '}
              {JSON.stringify(!!fieldWithComponents.FieldProvider)}
            </p>
            <p>
              Has SubProvider:{' '}
              {JSON.stringify(!!fieldWithComponents.SubFieldProvider)}
            </p>
            <p>Has Value: {JSON.stringify(fieldWithComponents.data.value)}</p>
          </div>
        )
      }

      // We cannot test reactivity since signals do not work in this testing environment
      field.data.value = 'John'
      const screen = render(<MyComponent />)

      expect(screen.getByText('Has Provider: true')).toBeDefined()
      expect(screen.getByText('Has SubProvider: true')).toBeDefined()
      expect(screen.getByText('Has Value: "John"')).toBeDefined()

      cleanup()
    })
  })
})
