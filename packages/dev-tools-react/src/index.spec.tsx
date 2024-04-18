import { useForm } from '@formsignals/form-react'
import { cleanup, render } from '@testing-library/react'
// biome-ignore lint/correctness/noUnusedImports: This is the React import
import React from 'react'
import { describe, expect, it, vi } from 'vitest'

describe('FormDevTools Import', () => {
  it('should import noop for production environments', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.resetModules()
    const { FormDevTools } = await import('./index')

    function App() {
      const form = useForm()
      return (
        <form.FormProvider>
          <FormDevTools />
        </form.FormProvider>
      )
    }

    const screen = render(<App />)
    const html = screen.container.innerHTML

    expect(html).toBe('')

    cleanup()
    vi.unstubAllEnvs()
  })
  it('should import DevTools for development environments', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.resetModules()
    const { FormDevTools } = await import('./index')

    function App() {
      const form = useForm()
      return (
        <form.FormProvider>
          <FormDevTools />
        </form.FormProvider>
      )
    }

    const screen = render(<App />)
    const openButton = screen.getByRole('button')

    expect(openButton).toBeDefined()

    cleanup()
    vi.unstubAllEnvs()
  })
})
