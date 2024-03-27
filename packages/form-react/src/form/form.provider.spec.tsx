import { FormLogic } from '@signal-forms/form-core'
import { render } from '@testing-library/react'
// biome-ignore lint/correctness/noUnusedImports: This is the React import
import React from 'react'
import { describe, expect, it } from 'vitest'
import { useFormContext } from './form.context'
import { FormProvider } from './form.provider'

describe('FormProvider', () => {
  it('should provider the form within the form context', () => {
    const form = new FormLogic({ defaultValues: { name: 'default' } })

    function TestComponent() {
      const context = useFormContext()
      return (
        <p>
          Has context: {JSON.stringify(context.data.value === form.data.value)}
        </p>
      )
    }

    const screen = render(
      <FormProvider form={form as never}>
        <TestComponent />
      </FormProvider>,
    )

    expect(screen.getByText('Has context: true')).toBeDefined()
  })
})
