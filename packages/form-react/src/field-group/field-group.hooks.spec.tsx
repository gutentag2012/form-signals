import { FormLogic } from '@formsignals/form-core'
import { cleanup, render } from '@testing-library/react'
// biome-ignore lint/correctness/noUnusedImports: This is the React import
import React from 'react'
import { describe, expect, it } from 'vitest'
import { useFieldGroup, useFieldGroupWithComponents } from './field-group.hooks'

describe('Field Group hooks', () => {
  describe('useFieldGroup', () => {
    it('should create a new field group within the given form with the provided options', () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'John',
        },
      })

      function MyComponent() {
        const field = useFieldGroup(form, ['name'])
        return <div>{field.data.value.name}</div>
      }

      const screen = render(<MyComponent />)

      expect(screen.getByText('John')).toBeDefined()
      expect(form.fieldGroups.value.length).toBe(1)

      cleanup()
    })
    it("should mount and unmount the field group with component's lifecycle", () => {
      const form = new FormLogic({
        defaultValues: {
          name: 'John',
        },
      })

      function MyComponent() {
        const field = useFieldGroup(form, ['name'])
        return <div>{field.data.value.name}</div>
      }

      const screen = render(<MyComponent />)

      expect(screen.getByText('John')).toBeDefined()
      expect(form.fieldGroups.value.length).toBe(1)

      screen.unmount()

      expect(form.fieldGroups.value.length).toBe(0)

      cleanup()
    })
    it("should update the field groups options when the hooks' options change", () => {
      const form = new FormLogic<{ name: string }>()

      function MyComponent({ disabled }: { disabled: boolean }) {
        const field = useFieldGroup(form, ['name'], {
          disabled,
        })
        return <div>{JSON.stringify(field.disabled.value)}</div>
      }

      const screen = render(<MyComponent disabled />)
      expect(screen.getByText('true')).toBeDefined()

      screen.rerender(<MyComponent disabled={false} />)
      expect(screen.getByText('false')).toBeDefined()

      cleanup()
    })
    it('should create a new field if the members changes', () => {
      const form = new FormLogic({
        defaultValues: { name: 'name', otherName: 'otherName' },
      })

      function MyComponent({ members }: { members: 'name' | 'otherName' }) {
        const group = useFieldGroup(form, [members])
        return <p>{(group.data.value as any)[members]}</p>
      }

      const screen = render(<MyComponent members={'name'} />)
      expect(form.fieldGroups.value.length).toBe(1)
      expect(screen.getByText('name')).toBeDefined()

      screen.rerender(<MyComponent members={'otherName'} />)
      expect(form.fieldGroups.value.length).toBe(1)
      expect(screen.getByText('otherName')).toBeDefined()

      cleanup()
    })
    it('should not unmount the group if it was mounted from another source', () => {
      const form = new FormLogic<{ name: string }>()
      const group = form.getOrCreateFieldGroup(['name'])
      group.mount()

      function MyComponent() {
        useFieldGroup(form, ['name'])
        return null
      }

      const screen = render(<MyComponent />)
      expect(group.isMounted.value).toBeTruthy()
      screen.unmount()
      expect(group.isMounted.value).toBeTruthy()

      cleanup()
    })
  })
  describe('useFieldGroupWithComponents', () => {
    it('should return the field group context from the provided field group logic', () => {
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: '',
        },
      })
      const group = form.getOrCreateFieldGroup(['name'])

      function MyComponent() {
        const fieldWithComponents = useFieldGroupWithComponents(group)

        return (
          <div>
            <p>
              Has Provider:{' '}
              {JSON.stringify(!!fieldWithComponents.FieldProvider)}
            </p>
            <p>
              Has FieldGroupProvider:{' '}
              {JSON.stringify(!!fieldWithComponents.FieldGroupProvider)}
            </p>
            <p>
              Has Value: {JSON.stringify(fieldWithComponents.data?.value?.name)}
            </p>
          </div>
        )
      }

      // We cannot test reactivity since signals do not work in this testing environment
      form.data.value.name.value = 'John'
      const screen = render(<MyComponent />)

      expect(screen.getByText('Has Provider: true')).toBeDefined()
      expect(screen.getByText('Has FieldGroupProvider: true')).toBeDefined()
      expect(screen.getByText('Has Value: "John"')).toBeDefined()

      cleanup()
    })
  })
})
