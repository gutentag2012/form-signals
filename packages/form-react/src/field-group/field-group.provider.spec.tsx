import { FormLogic } from '@formsignals/form-core'
import { cleanup, render } from '@testing-library/react'
// biome-ignore lint/correctness/noUnusedImports: This is the React import
import React from 'react'
import { describe, expect, it } from 'vitest'
import { FormContext, formLogicToFormContext } from '../form/form.context'
import {
  fieldGroupLogicToFieldGroupContext,
  useFieldGroupContext
} from './field-group.context'
import {
  FieldGroup,
  FieldGroupProvider,
  FieldGroupWithForm,
} from './field-group.provider'
import {useFieldContext} from "../field";

describe('FieldGroupProvider', () => {
  describe('FieldGroupProvider', () => {
    it('should provide the field group within the field context to the children', () => {
      const form = new FormLogic({ defaultValues: { name: 'John' } })
      const group = form.getOrCreateFieldGroup(['name'])

      function ContextConsumer() {
        const field = useFieldGroupContext<{name: string}, ["name"]>()
        return field.data.value.name as any
      }

      function TestComponent() {
        return (
          <FieldGroupProvider group={group as never}>
            <ContextConsumer />
          </FieldGroupProvider>
        )
      }

      const screen = render(<TestComponent />)

      expect(screen.getByText('John')).toBeDefined()

      cleanup()
    })
    it('should accept a function to render the children with the form as a parameter', () => {
      const form = new FormLogic({ defaultValues: { name: 'John' } })
      const group = form.getOrCreateFieldGroup(['name'])
      const groupContext = fieldGroupLogicToFieldGroupContext(group)

      function TestComponent() {
        return (
          <FieldGroupProvider group={groupContext}>
            {(field) => field.data.value.name as any}
          </FieldGroupProvider>
        )
      }

      const screen = render(<TestComponent />)

      expect(screen.getByText('John')).toBeDefined()

      cleanup()
    })
    it('should provider the field group within the field context to the children if they are a function', () => {
      const form = new FormLogic({ defaultValues: { name: 'John' } })
      const group = form.getOrCreateFieldGroup(['name'])

      function ContextConsumer() {
        const group = useFieldGroupContext<{name: string}, ["name"]>()
        return group.data.value.name as any
      }

      function TestComponent() {
        return (
          <FieldGroupProvider group={fieldGroupLogicToFieldGroupContext(group)}>
            {(field) => (
              <>
                {field.data.value.name}
                <ContextConsumer />
              </>
            )}
          </FieldGroupProvider>
        )
      }

      const screen = render(<TestComponent />)

      expect(screen.getByText('JohnJohn')).toBeDefined()

      cleanup()
    })
    it("should create a new field through the passed FieldProvider", () => {
      const form = new FormLogic({ defaultValues: { name: 'John' } })
      const group = form.getOrCreateFieldGroup(['name'])

      function ContextConsumer() {
        const group = useFieldContext<{name: string}, "name">()
        return group.data.value as any
      }

      function TestComponent() {
        return (
          <FieldGroupProvider group={fieldGroupLogicToFieldGroupContext(group)}>
            {(group) => (
              <group.FieldProvider name="name">
                <ContextConsumer />
              </group.FieldProvider>
            )}
          </FieldGroupProvider>
        )
      }

      const screen = render(<TestComponent />)

      expect(screen.getByText('John')).toBeDefined()

      cleanup()
    })
  })
  describe('FieldGroup', () => {
    it('should create a new field group within the form inside the context with the provided options', () => {
      type FormValues = { name: string }
      const form = new FormLogic<FormValues>({
        defaultValues: { name: 'default' },
      })

      function TestComponent() {
        return (
          <FieldGroup<FormValues, ['name']> members={["name"]}>
            {(field) => field.data.value.name}
          </FieldGroup>
        )
      }

      const screen = render(
        <FormContext.Provider value={form as never}>
          <TestComponent />
        </FormContext.Provider>,
      )

      expect(screen.getByText('default')).toBeDefined()
      expect(form.fieldGroups.value.length).toBe(1)

      cleanup()
    })
    it('should create a new field group if the value of the name prop changes', () => {
      type FormValues = { name: string; other: string }
      const form = new FormLogic<FormValues>({
        defaultValues: { name: "name", other: "other" }
      })

      function TestComponent({ name }: { name: 'name' | 'other' }) {
        return (
          <FieldGroup<FormValues, [typeof name]> members={[name]}>
            {(field) => (field.data.value as any)[name]}
          </FieldGroup>
        )
      }

      const screen = render(
        <FormContext.Provider value={form as never}>
          <TestComponent name="name" />
        </FormContext.Provider>,
      )

      expect(screen.getByText('name')).toBeDefined()
      expect(form.fieldGroups.value.length).toBe(1)

      screen.rerender(
        <FormContext.Provider value={form as never}>
          <TestComponent name="other" />
        </FormContext.Provider>,
      )

      expect(screen.getByText('other')).toBeDefined()
      expect(form.fieldGroups.value.length).toBe(1)

      cleanup()
    })
  })
  describe('FieldGroupWithForm', () => {
    it('should create a new field group within the provided form with the provided options', () => {
      type FormValues = { name: string }
      const form = new FormLogic<FormValues>({
        defaultValues: { name: 'default' },
      })
      const formContext = formLogicToFormContext(form)

      function TestComponent() {
        return (
          <FieldGroupWithForm<FormValues, ['name']>
            form={formContext}
            members={["name"]}
          >
            {(field) => field.data.value.name}
          </FieldGroupWithForm>
        )
      }

      const screen = render(<TestComponent />)

      expect(screen.getByText('default')).toBeDefined()
      expect(form.fieldGroups.value.length).toBe(1)

      cleanup()
    })
    it('should create a new field group with the provided form context with the provided options', () => {
      type FormValues = { name: string }
      const form = new FormLogic<FormValues>({
        defaultValues: { name: 'default' },
      })
      const formContext = formLogicToFormContext(form)

      function TestComponent() {
        return (
          <formContext.FieldGroupProvider
            members={["name"]}
          >
            {(field) => field.data.value.name}
          </formContext.FieldGroupProvider>
        )
      }

      const screen = render(<TestComponent />)

      expect(screen.getByText('default')).toBeDefined()
      expect(form.fieldGroups.value.length).toBe(1)

      cleanup()
    })
  })
})
