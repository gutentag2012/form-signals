import type { Signal } from '@preact/signals-react'
// biome-ignore lint/correctness/noUnusedImports: This is the React import
import React from 'react'
import { useFormDevToolsContext } from '../FormDevToolsContext'
import { FormDevToolsDrawerContent } from './FormDevToolsDrawerContent'

type FormDevToolsDrawerProps = {
  isOpen: Signal<boolean>
}

export function FormDevToolsDrawer(props: FormDevToolsDrawerProps) {
  const context = useFormDevToolsContext()

  const isCloseOpen = context.verticalKey === 'top'

  const CloseButton = (
    <div id="fs-close-button">
      <button
        type="button"
        onClick={() => {
          props.isOpen.value = false
        }}
        style={{
          marginLeft: context.horizontalKey === 'right' ? 'auto' : undefined,
          marginBottom: context.verticalKey === 'bottom' ? undefined : '0',
        }}
      >
        Close
      </button>
    </div>
  )

  return (
    <div
      id="fs-drawer"
      style={{
        alignItems:
          context.horizontalKey === 'right' ? 'flex-end' : 'flex-start',
      }}
    >
      {isCloseOpen && CloseButton}

      <FormDevToolsDrawerContent />

      {!isCloseOpen && CloseButton}
    </div>
  )
}
