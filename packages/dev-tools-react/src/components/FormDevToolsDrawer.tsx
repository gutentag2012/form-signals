import type { Signal } from '@preact/signals-react'
// biome-ignore lint/correctness/noUnusedImports: This is the React import
import React from 'react'
import { FormDevToolsDrawerContent } from './FormDevToolsDrawerContent'

type FormDevToolsDrawerProps = {
  isOpen: Signal<boolean>
  verticalKey: 'top' | 'bottom'
  horizontalKey: 'left' | 'right'
}

export function FormDevToolsDrawer(props: FormDevToolsDrawerProps) {
  const isCloseOpen = props.verticalKey === 'top'

  const CloseButton = (
    <div id="fs-close-button">
      <button
        type="button"
        onClick={() => {
          props.isOpen.value = false
        }}
        style={{
          marginLeft: props.horizontalKey === 'right' ? 'auto' : undefined,
          marginBottom: props.verticalKey === 'bottom' ? undefined : '0',
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
        alignItems: props.horizontalKey === 'right' ? 'flex-end' : 'flex-start',
        justifyContent:
          props.verticalKey === 'top' ? undefined : 'space-between',
      }}
    >
      {isCloseOpen && CloseButton}

      <FormDevToolsDrawerContent />

      {!isCloseOpen && CloseButton}
    </div>
  )
}
