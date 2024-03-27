import type React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { handleSubmitOnEnterForForm } from './form.utils'

describe('form utils', () => {
  describe('handleSubmitOnEnterForForm', () => {
    it.each([
      'checkbox',
      'date',
      'datetime-local',
      'email',
      'month',
      'number',
      'password',
      'radio',
      'range',
      'reset', // This will not reset the form since we only want to submit on enter and not reset on enter
      'search',
      'submit',
      'tel',
      'text',
      'time',
      'url',
      'week',
    ])(
      'should call form.handleSubmit when enter is pressed on an input of type %s',
      (type) => {
        const form = {
          handleSubmit: vi.fn(),
        }

        const target = document.createElement('input')
        target.type = type

        const event = {
          key: 'Enter',
          shiftKey: false,
          ctrlKey: false,
          altKey: false,
          metaKey: false,
          target: target,
          stopPropagation: vi.fn(),
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent<HTMLDivElement>

        const handler = handleSubmitOnEnterForForm(form)
        handler(event)

        expect(form.handleSubmit).toHaveBeenCalled()
      },
    )
    it.each(['button', 'hidden', 'image', 'file', 'color', 'image'])(
      'should not call form.handleSubmit when enter is pressed on an input of type %s',
      (type) => {
        const form = {
          handleSubmit: vi.fn(),
        }

        const target = document.createElement('input')
        target.type = type

        const event = {
          key: 'Enter',
          shiftKey: false,
          ctrlKey: false,
          altKey: false,
          metaKey: false,
          target: target,
          stopPropagation: vi.fn(),
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent<HTMLDivElement>

        const handler = handleSubmitOnEnterForForm(form)
        handler(event)

        expect(form.handleSubmit).not.toHaveBeenCalled()
      },
    )
    it.each([
      {
        shiftKey: true,
        ctrlKey: false,
        altKey: false,
        metaKey: false,
      },
      {
        shiftKey: false,
        ctrlKey: true,
        altKey: false,
        metaKey: false,
      },
      {
        shiftKey: false,
        ctrlKey: false,
        altKey: true,
        metaKey: false,
      },
      {
        shiftKey: false,
        ctrlKey: false,
        altKey: false,
        metaKey: true,
      },
    ])(
      'should only call form.handleSubmit when plain enter is pressed',
      (options) => {
        const form = {
          handleSubmit: vi.fn(),
        }

        const target = document.createElement('input')
        target.type = 'text'

        const event = {
          key: 'Enter',
          target: target,
          stopPropagation: vi.fn(),
          preventDefault: vi.fn(),
          ...options,
        } as unknown as React.KeyboardEvent<HTMLDivElement>

        const handler = handleSubmitOnEnterForForm(form)
        handler(event)

        expect(form.handleSubmit).not.toHaveBeenCalled()
      },
    )
    it('should ignore other keys than enter', () => {
      const form = {
        handleSubmit: vi.fn(),
      }

      const target = document.createElement('input')
      target.type = 'text'

      const event = {
        key: 'a',
        target: target,
        stopPropagation: vi.fn(),
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLDivElement>

      const handler = handleSubmitOnEnterForForm(form)
      handler(event)

      expect(form.handleSubmit).not.toHaveBeenCalled()
    })
  })
})
