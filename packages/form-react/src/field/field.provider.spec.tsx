import { FormLogic } from '@formsignals/form-core'
import { cleanup, render } from '@testing-library/react'
// biome-ignore lint/correctness/noUnusedImports: This is the React import
import React from 'react'
import { describe, expect, it } from 'vitest'
import { FormContext, formLogicToFormContext } from '../form/form.context'
import { fieldLogicToFieldContext, useFieldContext } from './field.context'
import { Field, FieldProvider, FieldWithForm, SubField } from './field.provider'

describe('FieldProvider', () => {
  describe('FieldProvider', () => {
    it('should provide the field within the field context to the children', () => {
      const form = new FormLogic({ defaultValues: { name: 'John' } })
      const field = form.getOrCreateField('name')

      function ContextConsumer() {
        const field = useFieldContext()
        return field.data.value as any
      }

      function TestComponent() {
        return (
          <FieldProvider field={field as never}>
            <ContextConsumer />
          </FieldProvider>
        )
      }

      const screen = render(<TestComponent />)

      expect(screen.getByText('John')).toBeDefined()

      cleanup()
    })
    it('should accept a function to render the children with the form as a parameter', () => {
      const form = new FormLogic({ defaultValues: { name: 'John' } })
      const field = form.getOrCreateField('name')

      function TestComponent() {
        return (
          <FieldProvider field={field as never}>
            {(field) => field.data.value as any}
          </FieldProvider>
        )
      }

      const screen = render(<TestComponent />)

      expect(screen.getByText('John')).toBeDefined()

      cleanup()
    })
    it('should provider the field within the field context to the children if they are a function', () => {
      const form = new FormLogic({ defaultValues: { name: 'John' } })
      const field = form.getOrCreateField('name')

      function ContextConsumer() {
        const field = useFieldContext()
        return field.data.value as any
      }

      function TestComponent() {
        return (
          <FieldProvider field={field as never}>
            {(field) => (
              <>
                {field.data.value}
                <ContextConsumer />
              </>
            )}
          </FieldProvider>
        )
      }

      const screen = render(<TestComponent />)

      expect(screen.getByText('JohnJohn')).toBeDefined()

      cleanup()
    })
  })
  describe('Field', () => {
    it('should create a new field within the form inside the context with the provided options', () => {
      type FormValues = { name: string }
      const form = new FormLogic<FormValues>()

      function TestComponent() {
        return (
          <Field<FormValues, 'name'> name="name" defaultValue="default">
            {(field) => field.data.value}
          </Field>
        )
      }

      const screen = render(
        <FormContext.Provider value={form as never}>
          <TestComponent />
        </FormContext.Provider>,
      )

      expect(screen.getByText('default')).toBeDefined()
      expect(form.fields.value.length).toBe(1)

      cleanup()
    })
    it('should create a new field if the value of the name prop changes', () => {
      type FormValues = { name: string; other: string }
      const form = new FormLogic<FormValues>()

      function TestComponent({ name }: { name: 'name' | 'other' }) {
        return (
          <Field<FormValues, typeof name> name={name} defaultValue="default">
            {(field) => field.data.value}
          </Field>
        )
      }

      const screen = render(
        <FormContext.Provider value={form as never}>
          <TestComponent name="name" />
        </FormContext.Provider>,
      )

      expect(screen.getByText('default')).toBeDefined()
      expect(form.fields.value.length).toBe(1)
      expect(form.json.value).toEqual({ name: 'default' })

      screen.rerender(
        <FormContext.Provider value={form as never}>
          <TestComponent name="other" />
        </FormContext.Provider>,
      )

      expect(screen.getByText('default')).toBeDefined()
      expect(form.fields.value.length).toBe(1)
      expect(form.json.value).toEqual({ other: 'default' })

      cleanup()
    })
    it('should update the options of the field if the props change', () => {
      type FormValues = { name: string }
      const form = new FormLogic<FormValues>()

      function TestComponent({ defaultValue }: { defaultValue: string }) {
        return (
          <Field<FormValues, 'name'> name="name" defaultValue={defaultValue}>
            {(field) => field.data.value}
          </Field>
        )
      }

      const screen = render(
        <FormContext.Provider value={form as never}>
          <TestComponent defaultValue="default" />
        </FormContext.Provider>,
      )

      expect(screen.getByText('default')).toBeDefined()
      expect(form.fields.value.length).toBe(1)

      screen.rerender(
        <FormContext.Provider value={form as never}>
          <TestComponent defaultValue="new" />
        </FormContext.Provider>,
      )

      expect(screen.getByText('new')).toBeDefined()
      expect(form.fields.value.length).toBe(1)

      cleanup()
    })
  })
  describe('FieldWithForm', () => {
    it('should create a new field within the provided form with the provided options', () => {
      type FormValues = { name: string }
      const form = new FormLogic<FormValues>()
      const formContext = formLogicToFormContext(form)

      function TestComponent() {
        return (
          <FieldWithForm<FormValues, 'name'>
            form={formContext}
            name="name"
            defaultValue="default"
          >
            {(field) => field.data.value}
          </FieldWithForm>
        )
      }

      const screen = render(<TestComponent />)

      expect(screen.getByText('default')).toBeDefined()
      expect(form.fields.value.length).toBe(1)

      cleanup()
    })
  })
  describe('SubField', () => {
    it('should create a new field based on the provided parent with the provided options', () => {
      type FormValues = { name: { first: string } }
      const form = new FormLogic<FormValues>()
      const parentField = form.getOrCreateField('name')
      const parentFieldContext = fieldLogicToFieldContext(parentField)

      function TestComponent() {
        return (
          <SubField<
            FormValues,
            'name',
            never,
            FormValues['name'],
            'first',
            never
          >
            parentField={parentFieldContext}
            name="first"
            defaultValue="default"
          >
            {(field) => field.data.value}
          </SubField>
        )
      }

      const screen = render(
        <FormContext.Provider value={form as never}>
          <TestComponent />
        </FormContext.Provider>,
      )

      expect(screen.getByText('default')).toBeDefined()
      expect(form.fields.value.length).toBe(2)
      expect(form.json.value).toEqual({ name: { first: 'default' } })

      cleanup()
    })
    it('should create a new field if the value of the name prop changes', () => {
      type FormValues = { name: { first: string; last: string } }
      const form = new FormLogic<FormValues>()
      const parentField = form.getOrCreateField('name')
      const parentFieldContext = fieldLogicToFieldContext(parentField)

      function TestComponent({ name }: { name: 'first' | 'last' }) {
        return (
          <SubField<
            FormValues,
            'name',
            never,
            FormValues['name'],
            typeof name,
            never
          >
            parentField={parentFieldContext}
            name={name}
            defaultValue="default"
          >
            {(field) => field.data.value}
          </SubField>
        )
      }

      const screen = render(
        <FormContext.Provider value={form as never}>
          <TestComponent name="first" />
        </FormContext.Provider>,
      )

      expect(screen.getByText('default')).toBeDefined()
      expect(form.fields.value.length).toBe(2)
      expect(form.json.value).toEqual({ name: { first: 'default' } })

      screen.rerender(
        <FormContext.Provider value={form as never}>
          <TestComponent name="last" />
        </FormContext.Provider>,
      )

      expect(screen.getByText('default')).toBeDefined()
      expect(form.fields.value.length).toBe(2)
      expect(form.json.value).toEqual({ name: { last: 'default' } })

      cleanup()
    })
    it('should update the options of the field if the props change', () => {
      type FormValues = { name: { first: string } }
      const form = new FormLogic<FormValues>()
      const parentField = form.getOrCreateField('name')
      const parentFieldContext = fieldLogicToFieldContext(parentField)

      function TestComponent({ defaultValue }: { defaultValue: string }) {
        return (
          <SubField<
            FormValues,
            'name',
            never,
            FormValues['name'],
            'first',
            never
          >
            parentField={parentFieldContext}
            name="first"
            defaultValue={defaultValue}
          >
            {(field) => field.data.value}
          </SubField>
        )
      }

      const screen = render(
        <FormContext.Provider value={form as never}>
          <TestComponent defaultValue="default" />
        </FormContext.Provider>,
      )

      expect(screen.getByText('default')).toBeDefined()
      expect(form.fields.value.length).toBe(2)

      screen.rerender(
        <FormContext.Provider value={form as never}>
          <TestComponent defaultValue="new" />
        </FormContext.Provider>,
      )

      expect(screen.getByText('new')).toBeDefined()
      expect(form.fields.value.length).toBe(2)

      cleanup()
    })
  })
})
