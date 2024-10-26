import { FormLogic, formLogicToFormContext } from '@formsignals/form-react'
import { cleanup, render } from '@testing-library/react'
import fireEvent from '@testing-library/user-event'
// biome-ignore lint/correctness/noUnusedImports: This is the React import
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { FormDevTools } from './FormDevTools'

describe('FormDevTools', () => {
  it('display the initial state of a form', async () => {
    const form = new FormLogic({ defaultValues: { name: 'John' } })
    const formContext = formLogicToFormContext(form)
    await formContext.mount()

    function TestComponent() {
      return (
        <formContext.FormProvider>
          <FormDevTools />
        </formContext.FormProvider>
      )
    }

    const screen = render(<TestComponent />)

    const openButton = screen.getByRole('button')
    expect(openButton).toBeDefined()
    if (!openButton) throw new Error('openButton is not defined')
    await fireEvent.click(openButton)

    const container = screen.container.querySelector('#fs-dev-tools--container')
    expect(container).toBeDefined()
    if (!container) throw new Error('container is not defined')

    const boolValues = screen.container.querySelectorAll('.fs-boolean-display')
    if (!boolValues.length) throw new Error('boolValues is empty')

    const textValues = screen.container.querySelectorAll('.fs-text-display')
    if (!textValues.length) throw new Error('textValues is empty')

    const [
      mountedValue,
      disabledValue,
      touchedValue,
      dirtyValue,
      validValue,
      validatingValue,
      validFormValue,
      validatingFormValue,
      validFieldsValue,
      validatingFieldsValue,
      validFieldGroupsValue,
      validatingFieldGroupsValue,
      canSubmitValue,
      submittedValue,
      submittingValue,
    ] = boolValues
    const [
      dirtyFieldsValue,
      formErrorsValue,
      submittedCountValue,
      submittedCountSuccessValue,
      submittedCountErrorValue,
    ] = textValues

    expect(
      mountedValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-success'),
    ).toBeTruthy()
    expect(
      disabledValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()
    expect(
      touchedValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()
    expect(
      dirtyValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()
    expect(
      validValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-success'),
    ).toBeTruthy()
    expect(
      validFormValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-success'),
    ).toBeTruthy()
    expect(
      validFieldsValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-success'),
    ).toBeTruthy()
    expect(
      validFieldGroupsValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-success'),
    ).toBeTruthy()
    expect(
      validatingValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()
    expect(
      validatingFormValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()
    expect(
      validatingFieldsValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()
    expect(
      validatingFieldGroupsValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()
    expect(
      canSubmitValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-success'),
    ).toBeTruthy()
    expect(
      submittedValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()
    expect(
      submittingValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()

    expect(dirtyFieldsValue?.textContent?.replace('Dirty Fields ', '')).toBe(
      '-',
    )
    expect(formErrorsValue?.textContent?.replace('Form Errors ', '')).toBe('-')
    expect(
      submittedCountValue?.textContent?.replace('Submission Count ', ''),
    ).toBe('0')
    expect(
      submittedCountSuccessValue?.textContent?.replace('Successful ', ''),
    ).toBe('0')
    expect(
      submittedCountErrorValue?.textContent?.replace('Unsuccessful ', ''),
    ).toBe('0')

    const defaultValues = screen.getByText('Default Values')
    expect(defaultValues).toBeDefined()
    if (!defaultValues) throw new Error('defaultValues is not defined')

    await fireEvent.click(defaultValues)

    const currentValues = screen.getByText('Current Values')
    expect(currentValues).toBeDefined()
    if (!currentValues) throw new Error('currentValues is not defined')

    await fireEvent.click(currentValues)

    const [defaultValuesNode, currentValuesNode] =
      screen.container.querySelectorAll('pre')

    const defaultValueFromForm = JSON.stringify(
      form.defaultValues.peek(),
      null,
      2,
    )
    expect(defaultValuesNode.innerHTML).toBe(defaultValueFromForm)

    const currentValuesFromForm = JSON.stringify(form.json.peek(), null, 2)
    expect(currentValuesNode.innerHTML).toBe(currentValuesFromForm)

    cleanup()
  })
  it('should display validation errors within the form', async () => {
    const form = new FormLogic({
      defaultValues: { name: '' },
      validator: () => 'Name is required',
      validatorOptions: {
        validateOnMount: true,
      },
    })
    const formContext = formLogicToFormContext(form)
    await formContext.mount()

    function TestComponent() {
      return (
        <formContext.FormProvider>
          <FormDevTools />
        </formContext.FormProvider>
      )
    }

    const screen = render(<TestComponent />)

    const openButton = screen.getByRole('button')
    expect(openButton).toBeDefined()
    if (!openButton) throw new Error('openButton is not defined')
    await fireEvent.click(openButton)

    const container = screen.container.querySelector('#fs-dev-tools--container')
    expect(container).toBeDefined()
    if (!container) throw new Error('container is not defined')

    const boolValues = screen.container.querySelectorAll('.fs-boolean-display')
    if (!boolValues.length) throw new Error('boolValues is empty')

    const textValues = screen.container.querySelectorAll('.fs-text-display')
    if (!textValues.length) throw new Error('textValues is empty')

    const [
      _mountedValue,
      _disabledValue,
      _touchedValue,
      _dirtyValue,
      validValue,
      _validatingValue,
      validFormValue,
      _validatingFormValue,
      validFieldsValue,
      _validatingFieldsValue,
      _validFieldGroupsValue,
      _validatingFieldGroupsValue,
      canSubmitValue,
    ] = boolValues
    const [_dirtyFieldsValue, formErrorsValue] = textValues

    expect(
      validValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()
    expect(
      validFormValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()
    expect(
      validFieldsValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-success'),
    ).toBeTruthy()
    expect(
      canSubmitValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()

    expect(formErrorsValue?.textContent?.replace('Form Errors ', '')).toBe(
      'Name is required',
    )

    cleanup()
  })
  it('should be possible to reset the form state', async () => {
    const form = new FormLogic({
      defaultValues: { name: '' },
      validator: () => 'Name is required',
      validatorOptions: {
        validateOnMount: true,
      },
    })
    const formContext = formLogicToFormContext(form)
    await formContext.mount()

    form.data.value.name.value = 'John'

    function TestComponent() {
      return (
        <formContext.FormProvider>
          <FormDevTools />
        </formContext.FormProvider>
      )
    }

    const screen = render(<TestComponent />)

    const openButton = screen.getByRole('button')
    expect(openButton).toBeDefined()
    if (!openButton) throw new Error('openButton is not defined')
    await fireEvent.click(openButton)

    const container = screen.container.querySelector('#fs-dev-tools--container')
    expect(container).toBeDefined()
    if (!container) throw new Error('container is not defined')

    const boolValues = screen.container.querySelectorAll('.fs-boolean-display')
    if (!boolValues.length) throw new Error('boolValues is empty')

    const textValues = screen.container.querySelectorAll('.fs-text-display')
    if (!textValues.length) throw new Error('textValues is empty')

    const [
      _mountedValue,
      _disabledValue,
      _touchedValue,
      _dirtyValue,
      validValue,
    ] = boolValues
    const [_dirtyFieldsValue, formErrorsValue] = textValues

    expect(
      validValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()
    expect(formErrorsValue?.textContent?.replace('Form Errors ', '')).toBe(
      'Name is required',
    )

    const defaultValues = screen.getByText('Default Values')
    expect(defaultValues).toBeDefined()
    if (!defaultValues) throw new Error('defaultValues is not defined')
    await fireEvent.click(defaultValues)

    const currentValues = screen.getByText('Current Values')
    expect(currentValues).toBeDefined()
    if (!currentValues) throw new Error('currentValues is not defined')
    await fireEvent.click(currentValues)

    const currentValuesNode = screen.container.querySelectorAll('pre')[1]
    expect(currentValuesNode.innerHTML).toBe(
      JSON.stringify({ name: 'John' }, null, 2),
    )

    const resetButton = screen.getByText('Reset')
    expect(resetButton).toBeDefined()
    if (!resetButton) throw new Error('resetButton is not defined')
    await fireEvent.click(resetButton)

    screen.rerender(<TestComponent />)

    const currentValuesNodeAfterChange =
      screen.container.querySelectorAll('pre')[1]
    expect(currentValuesNodeAfterChange.innerHTML).toBe(
      JSON.stringify({ name: '' }, null, 2),
    )

    const boolValuesAfterChange = screen.container.querySelectorAll(
      '.fs-boolean-display',
    )
    if (!boolValuesAfterChange.length)
      throw new Error('boolValuesAfterChange is empty')

    const textValuesAfterChange =
      screen.container.querySelectorAll('.fs-text-display')
    if (!textValuesAfterChange.length)
      throw new Error('textValuesAfterChange is empty')

    const [
      _mountedValueAfterChange,
      _disabledValueAfterChange,
      _touchedValueAfterChange,
      _dirtyValueAfterChange,
      validValueAfterChange,
    ] = boolValuesAfterChange
    const [_dirtyFieldsValueAfterChange, formErrorsValueAfterChange] =
      textValuesAfterChange

    expect(
      validValueAfterChange
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-success'),
    ).toBeTruthy()
    expect(
      formErrorsValueAfterChange?.textContent?.replace('Form Errors ', ''),
    ).toBe('-')

    cleanup()
  })
  it('should display validation field states', async () => {
    // The z is added to make sure the fields are sorted correctly
    const form = new FormLogic<{
      name: string
      zage: number
      zzdob: Date
      zzzobj: { a: number }
    }>()
    const formContext = formLogicToFormContext(form)
    await formContext.mount()

    const field = form.getOrCreateField('name', {
      defaultValue: '',
      validator: () => 'Name is required',
      validatorOptions: {
        validateOnMount: true,
      },
    })
    await field.mount()
    field.data.value = 'John'

    const field2 = form.getOrCreateField('zage', {
      defaultValue: 21,
    })
    await field2.mount()

    const date = new Date()
    const field3 = form.getOrCreateField('zzdob', {
      defaultValue: date,
    })
    await field3.mount()

    const obj = { a: 0 }
    const field4 = form.getOrCreateField('zzzobj', {
      defaultValue: obj,
    })
    await field4.mount()

    function TestComponent() {
      return (
        <formContext.FormProvider>
          <FormDevTools />
        </formContext.FormProvider>
      )
    }

    const screen = render(<TestComponent />)

    const openButton = screen.getByRole('button')
    expect(openButton).toBeDefined()
    if (!openButton) throw new Error('openButton is not defined')
    await fireEvent.click(openButton)

    const fieldContainer = screen.container.querySelector(
      '.fs-drawer--field-states',
    )
    expect(fieldContainer).toBeDefined()
    if (!fieldContainer) throw new Error('fieldContainer is not defined')
    expect(fieldContainer.children.length).toBe(4)

    await fireEvent.click(fieldContainer.children[0].querySelector('button')!)
    await fireEvent.click(fieldContainer.children[1].querySelector('button')!)
    await fireEvent.click(fieldContainer.children[2].querySelector('button')!)
    await fireEvent.click(fieldContainer.children[3].querySelector('button')!)

    const fieldBooleanValues = fieldContainer.querySelectorAll(
      '.fs-boolean-display',
    )
    if (!fieldBooleanValues.length)
      throw new Error('fieldBooleanValues is empty')

    const fieldTextValues = fieldContainer.querySelectorAll('.fs-text-display')
    if (!fieldTextValues.length) throw new Error('fieldTextValues is empty')

    const [
      validValue,
      _disabled,
      mountedValue,
      touchedValue,
      dirtyValue,
      validatingValue,
    ] = fieldBooleanValues
    const [errorsValue] = fieldTextValues

    expect(
      validValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()
    expect(
      mountedValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-success'),
    ).toBeTruthy()
    expect(
      touchedValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()
    expect(
      dirtyValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-success'),
    ).toBeTruthy()
    expect(
      validatingValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()

    expect(errorsValue?.textContent?.replace('Errors ', '')).toBe(
      'Name is required',
    )

    const [valueEl, value2El, value3El, value4El] =
      screen.container.querySelectorAll('.fs-drawer--field-state--value')
    const value = valueEl?.textContent?.replace('Value ', '')
    const value2 = value2El?.textContent?.replace('Value ', '')
    const value3 = value3El?.textContent?.replace('Value ', '')
    const value4 = value4El?.textContent?.replace('Value ', '')

    expect(value).toBe('John')
    expect(value2).toBe('21')
    expect(value3).toBe(date.toISOString())
    expect(value4).toBe(JSON.stringify(obj, null, 2))

    cleanup()
  })
  it('should display validation field group states', async () => {
    // The z is added to make sure the fields are sorted correctly
    const date = new Date()
    const obj = { a: 0 }
    const form = new FormLogic({
      defaultValues: {
        name: 'default',
        zage: 21,
        zzdob: date,
        zzzobj: obj,
      },
    })
    const formContext = formLogicToFormContext(form)
    await formContext.mount()

    const field = form.getOrCreateFieldGroup(['name'])
    await field.mount()

    const field2 = form.getOrCreateFieldGroup(['zage'])
    await field2.mount()

    const field3 = form.getOrCreateFieldGroup(['zzdob'])
    await field3.mount()

    const field4 = form.getOrCreateFieldGroup(['zzzobj'])
    await field4.mount()

    form.data.value.name.value = 'John'

    function TestComponent() {
      return (
        <formContext.FormProvider>
          <FormDevTools />
        </formContext.FormProvider>
      )
    }

    const screen = render(<TestComponent />)

    const openButton = screen.getByRole('button')
    expect(openButton).toBeDefined()
    if (!openButton) throw new Error('openButton is not defined')
    await fireEvent.click(openButton)

    const fieldContainer = screen.container.querySelectorAll(
      '.fs-drawer--field-states',
    )[1]
    expect(fieldContainer).toBeDefined()
    if (!fieldContainer) throw new Error('fieldContainer is not defined')
    expect(fieldContainer.children.length).toBe(4)

    await fireEvent.click(fieldContainer.children[0].querySelector('button')!)
    await fireEvent.click(fieldContainer.children[1].querySelector('button')!)
    await fireEvent.click(fieldContainer.children[2].querySelector('button')!)
    await fireEvent.click(fieldContainer.children[3].querySelector('button')!)

    const boolValues = fieldContainer.querySelectorAll('.fs-boolean-display')
    if (!boolValues.length) throw new Error('boolValues is empty')

    const textValues = fieldContainer.querySelectorAll('.fs-text-display')
    if (!textValues.length) throw new Error('textValues is empty')

    const [
      disabledValue,
      validValue,
      mountedValue,
      _disabledValue,
      dirtyValue,
      _validValue,
      validatingValue,
      validFieldGroupValue,
      validatingFieldGroupValue,
      validFieldsValue,
      validatingFieldsValue,
      canSubmitValue,
      submittedValue,
      submittingValue,
    ] = boolValues
    const [
      dirtyFieldsValue,
      formErrorsValue,
      submittedCountValue,
      submittedCountSuccessValue,
      submittedCountErrorValue,
    ] = textValues

    expect(
      mountedValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-success'),
    ).toBeTruthy()
    expect(
      disabledValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()
    expect(
      dirtyValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-success'),
    ).toBeTruthy()
    expect(
      validValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-success'),
    ).toBeTruthy()
    expect(
      validatingValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()
    expect(
      validFieldGroupValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-success'),
    ).toBeTruthy()
    expect(
      validFieldsValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-success'),
    ).toBeTruthy()
    expect(
      validatingFieldGroupValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()
    expect(
      validatingFieldsValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()
    expect(
      canSubmitValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-success'),
    ).toBeTruthy()
    expect(
      submittedValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()
    expect(
      submittingValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()

    expect(dirtyFieldsValue?.textContent?.replace('Dirty Fields ', '')).toBe(
      'name',
    )
    expect(formErrorsValue?.textContent?.replace('Form Errors ', '')).toBe('-')
    expect(
      submittedCountValue?.textContent?.replace('Submission Count ', ''),
    ).toBe('0')
    expect(
      submittedCountSuccessValue?.textContent?.replace('Successful ', ''),
    ).toBe('0')
    expect(
      submittedCountErrorValue?.textContent?.replace('Unsuccessful ', ''),
    ).toBe('0')

    const elements = screen.container.querySelectorAll('.collapsible')

    await fireEvent.click(elements[3].querySelector('button')!)
    expect(
      JSON.parse(elements[3].querySelector('pre')!.textContent!).name,
    ).toBe('John')

    await fireEvent.click(elements[5].querySelector('button')!)
    expect(
      JSON.parse(elements[5].querySelector('pre')!.textContent!).zage,
    ).toBe(21)

    await fireEvent.click(elements[7].querySelector('button')!)
    expect(
      JSON.parse(elements[7].querySelector('pre')!.textContent!).zzdob,
    ).toBe(date.toISOString())

    await fireEvent.click(elements[9].querySelector('button')!)
    expect(
      JSON.parse(elements[9].querySelector('pre')!.textContent!).zzzobj,
    ).toEqual(obj)

    const resetButton = fieldContainer.querySelector(
      '.fs-drawer--action-buttons button',
    )
    await fireEvent.click(resetButton!)

    screen.rerender(<TestComponent />)

    const elements1 = screen.container.querySelectorAll('.collapsible')

    expect(
      JSON.parse(elements1[3].querySelector('pre')!.textContent!).name,
    ).toBe('default')

    cleanup()
  })
  it('should be possible to reset the field state', async () => {
    const form = new FormLogic<{ name: string }>()
    const formContext = formLogicToFormContext(form)
    await formContext.mount()

    const field = form.getOrCreateField('name', {
      defaultValue: '',
      validator: () => 'Name is required',
      validatorOptions: {
        validateOnMount: true,
      },
    })
    await field.mount()
    field.data.value = 'John'

    function TestComponent() {
      return (
        <formContext.FormProvider>
          <FormDevTools />
        </formContext.FormProvider>
      )
    }

    const screen = render(<TestComponent />)

    const openButton = screen.getByRole('button')
    expect(openButton).toBeDefined()
    if (!openButton) throw new Error('openButton is not defined')
    await fireEvent.click(openButton)

    const fieldContainer = screen.container.querySelector(
      '.fs-drawer--field-states',
    )
    expect(fieldContainer).toBeDefined()
    if (!fieldContainer) throw new Error('fieldContainer is not defined')
    expect(fieldContainer.children.length).toBe(1)

    await fireEvent.click(fieldContainer.children[0].querySelector('button')!)

    const resetButton = fieldContainer.querySelector(
      '.fs-drawer--action-buttons button',
    )
    await fireEvent.click(resetButton!)

    screen.rerender(<TestComponent />)

    const fieldBooleanValues = fieldContainer.querySelectorAll(
      '.fs-boolean-display',
    )
    if (!fieldBooleanValues.length)
      throw new Error('fieldBooleanValues is empty')

    const fieldTextValues = fieldContainer.querySelectorAll('.fs-text-display')
    if (!fieldTextValues.length) throw new Error('fieldTextValues is empty')

    const [
      disabledValue,
      validValue,
      mountedValue,
      touchedValue,
      dirtyValue,
      validatingValue,
    ] = fieldBooleanValues
    const [errorsValue] = fieldTextValues

    expect(
      disabledValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()
    expect(
      validValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-success'),
    ).toBeTruthy()
    expect(
      mountedValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-success'),
    ).toBeTruthy()
    expect(
      touchedValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()
    expect(
      dirtyValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()
    expect(
      validatingValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()

    expect(errorsValue?.textContent?.replace('Errors ', '')).toBe('-')

    const valueEl = screen.container.querySelector(
      '.fs-drawer--field-state--value',
    )
    const value = valueEl?.textContent?.replace('Value ', '')

    expect(value).toBe('')

    cleanup()
  })
  it('should hide removed fields from the list', async () => {
    const form = new FormLogic<{ name: string }>()
    const formContext = formLogicToFormContext(form)
    await formContext.mount()

    const field = form.getOrCreateField('name', {
      defaultValue: 'John',
      removeValueOnUnmount: true,
    })
    await field.mount()
    field.unmount()

    function TestComponent() {
      return (
        <formContext.FormProvider>
          <FormDevTools />
        </formContext.FormProvider>
      )
    }

    const screen = render(<TestComponent />)

    const openButton = screen.getByRole('button')
    expect(openButton).toBeDefined()
    if (!openButton) throw new Error('openButton is not defined')
    await fireEvent.click(openButton)

    const fieldContainer = screen.container.querySelector(
      '.fs-drawer--field-states',
    )
    expect(fieldContainer).toBeDefined()
    if (!fieldContainer) throw new Error('fieldContainer is not defined')
    expect(fieldContainer.children.length).toBe(0)

    cleanup()
  })
  it('should show async validating and submission state', async () => {
    vi.useFakeTimers()

    const form = new FormLogic({
      defaultValues: { name: '' },
      validatorAsync: async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        return 'Name is required'
      },
      onSubmit: async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
      },
    })
    const formContext = formLogicToFormContext(form)
    await formContext.mount()

    function TestComponent() {
      return (
        <formContext.FormProvider>
          <FormDevTools initialOpen />
        </formContext.FormProvider>
      )
    }

    const screen = render(<TestComponent />)

    const container = screen.container.querySelector('#fs-dev-tools--container')
    expect(container).toBeDefined()
    if (!container) throw new Error('container is not defined')

    const boolValues = screen.container.querySelectorAll('.fs-boolean-display')
    if (!boolValues.length) throw new Error('boolValues is empty')

    const [
      _mountedValue,
      _disabledValue,
      _touchedValue,
      _dirtyValue,
      _validValue,
      validatingValue,
      _validFormValue,
      validatingFormValue,
      _validFieldsValue,
      validatingFieldsValue,
      _validFieldGroupsValue,
      _validatingFieldGroupsValue,
      _canSubmitValue,
      _submittedValue,
      submittingValue,
    ] = boolValues

    expect(
      validatingValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()
    expect(
      validatingFormValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()
    expect(
      validatingFieldsValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()
    expect(
      submittingValue
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()

    form.data.value.name.value = 'John'

    screen.rerender(<TestComponent />)

    const boolValues2 = screen.container.querySelectorAll('.fs-boolean-display')
    if (!boolValues2.length) throw new Error('boolValues is empty')

    const [
      _mountedValue2,
      _disabledValue2,
      _touchedValue2,
      _dirtyValue2,
      _validValue2,
      validatingValue2,
      _validFormValue2,
      validatingFormValue2,
      _validFieldsValue2,
      validatingFieldsValue2,
      _validFieldGroupsValue2,
      _validatingFieldGroupsValue2,
      _canSubmitValue2,
      _submittedValue2,
      submittingValue2,
    ] = boolValues2

    expect(
      validatingValue2
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-success'),
    ).toBeTruthy()
    expect(
      validatingFormValue2
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-success'),
    ).toBeTruthy()
    expect(
      validatingFieldsValue2
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()
    expect(
      submittingValue2
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()

    await vi.advanceTimersToNextTimerAsync()
    screen.rerender(<TestComponent />)

    const boolValues3 = screen.container.querySelectorAll('.fs-boolean-display')
    if (!boolValues3.length) throw new Error('boolValues is empty')

    const [
      _mountedValue3,
      _disabledValue3,
      _touchedValue3,
      _dirtyValue3,
      _validValue3,
      validatingValue3,
      _validFormValue3,
      validatingFormValue3,
      _validFieldsValue3,
      validatingFieldsValue3,
      _validFieldGroupsValue3,
      _validatingFieldGroupsValue3,
      _canSubmitValue3,
      _submittedValue3,
      submittingValue3,
    ] = boolValues3

    expect(
      validatingValue3
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()
    expect(
      validatingFormValue3
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()
    expect(
      validatingFieldsValue3
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()
    expect(
      submittingValue3
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()

    // If we do not reset, it still has the validation error and cannot submit
    form.reset()
    const submitPromise = form.handleSubmit()

    screen.rerender(<TestComponent />)

    const boolValues4 = screen.container.querySelectorAll('.fs-boolean-display')
    if (!boolValues4.length) throw new Error('boolValues is empty')

    const [
      _mountedValue4,
      _disabledValue4,
      _touchedValue4,
      _dirtyValue4,
      _validValue4,
      validatingValue4,
      _validFormValue4,
      validatingFormValue4,
      _validFieldsValue4,
      validatingFieldsValue4,
      _validFieldGroupsValue4,
      _validatingFieldGroupsValue4,
      _canSubmitValue4,
      _submittedValue4,
      submittingValue4,
    ] = boolValues4

    expect(
      validatingValue4
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()
    expect(
      validatingFormValue4
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()
    expect(
      validatingFieldsValue4
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()
    expect(
      submittingValue4
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-success'),
    ).toBeTruthy()

    await vi.advanceTimersToNextTimerAsync()
    await submitPromise
    screen.rerender(<TestComponent />)

    const boolValues5 = screen.container.querySelectorAll('.fs-boolean-display')
    if (!boolValues5.length) throw new Error('boolValues is empty')

    const [
      _mountedValue5,
      _disabledValue5,
      _touchedValue5,
      _dirtyValue5,
      _validValue5,
      validatingValue5,
      _validFormValue5,
      validatingFormValue5,
      _validFieldsValue5,
      validatingFieldsValue5,
      _validFieldGroupsValue5,
      _validatingFieldGroupsValue5,
      _canSubmitValue5,
      _submittedValue5,
      submittingValue5,
    ] = boolValues5

    expect(
      validatingValue5
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()
    expect(
      validatingFormValue5
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()
    expect(
      validatingFieldsValue5
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()
    expect(
      submittingValue5
        .querySelector('div')
        ?.classList?.contains('fs-utils--bg-error'),
    ).toBeTruthy()

    vi.useRealTimers()
    cleanup()
  })
  it('should be possible to close the drawer', async () => {
    const form = new FormLogic()
    const formContext = formLogicToFormContext(form)

    function TestComponent() {
      return (
        <formContext.FormProvider>
          <FormDevTools initialOpen />
        </formContext.FormProvider>
      )
    }

    const screen = render(<TestComponent />)

    const container = screen.container.querySelector('#fs-dev-tools--container')
    expect(container).toBeDefined()
    if (!container) throw new Error('container is not defined')

    const closeButton = screen.getByText('Close')
    expect(closeButton).toBeDefined()
    if (!closeButton) throw new Error('closeButton is not defined')
    await fireEvent.click(closeButton)

    const containerAfterClose = screen.container.querySelector(
      '#fs-dev-tools--container',
    )
    expect(containerAfterClose?.innerHTML).contains('id="fs-open-button"')

    cleanup()
  })
  it('should be possible to place the drawer in different corners', () => {
    const form = new FormLogic()
    const formContext = formLogicToFormContext(form)

    function TestComponent({
      position,
    }: { position: `${'top' | 'bottom'}-${'left' | 'right'}` }) {
      return (
        <formContext.FormProvider>
          <FormDevTools initialOpen position={position} />
        </formContext.FormProvider>
      )
    }

    const screen = render(<TestComponent position="bottom-right" />)

    const containerHtml = screen.container.outerHTML

    screen.rerender(<TestComponent position="top-left" />)

    const containerHtmlAfterChange = screen.container.outerHTML

    // We cannot check the bounding box since this is not supported, but we can check, that at least the close button is different and the anchores
    expect(containerHtml).not.toBe(containerHtmlAfterChange)

    cleanup()
  })
})
