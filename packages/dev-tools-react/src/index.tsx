import './index.css'
// biome-ignore lint/correctness/noUnusedImports: This is the React import
import React from "react"
import {useSignal} from '@preact/signals-react'
import {defaultContext, formDevToolsContext,} from './FormDevToolsContext'
import {FormDevToolsDrawer} from "./components/FormDevToolsDrawer";
import {AppIcon} from "./icons/AppIcon";

export type FormDevToolsProps = {
  bgColor?: string
  bgSecondaryColor?: string
  textColor?: string
  accentColor?: string
  onAccentColor?: string
  errorColor?: string
  successColor?: string

  initialOpen?: boolean
  position?: `${'top' | 'bottom'}-${'left' | 'right'}`
}

// TODO Improve styling
  // TODO 1. Add header with brand + action buttons (close, full screen)
  // TODO 2. Add form actions (submit, reset, resetState, resetValues, validateForEvent)
  // TODO 3. Add collapsible sections for form state, fields, field state
  // TODO 4. Improve spacing and alignment (currently the state takes up way too much space) maybe don't use a table
  // TODO 5. Hover over a value or key to show a description of what it is + if applicable what it is calculated from

// TODO When removing a variant, the value is still preserved event though I explicitly removed it
// TODO Dynamic object is not marked as dirty
// TODO Reset does not reset not defined default values

// TODO When bundeling make sure, that the production bundle does not include the form debugger, this can be done by changing the pacakge.json entry files and only includeing the form debugger in the development bundle

export function FormDevTools(props: FormDevToolsProps) {
  const [verticalKey, horizontalKey] = props.position?.split('-') ?? [
    'bottom',
    'right',
  ]
  const contextValue = {
    bgColor: props.bgColor ?? defaultContext.bgColor,
    bgSecondaryColor: props.bgSecondaryColor ?? defaultContext.bgSecondaryColor,
    textColor: props.textColor ?? defaultContext.textColor,
    accentColor: props.accentColor ?? defaultContext.accentColor,
    onAccentColor: props.onAccentColor ?? defaultContext.onAccentColor,
    errorColor: props.errorColor ?? defaultContext.errorColor,
    successColor: props.successColor ?? defaultContext.successColor,

    initialOpen: props.initialOpen ?? defaultContext.initialOpen,
    verticalKey:
      (verticalKey as 'top' | 'bottom') ?? defaultContext.verticalKey,
    horizontalKey:
      (horizontalKey as 'left' | 'right') ?? defaultContext.horizontalKey,
  }
  const cssVars = {
    '--fs-bg-color': contextValue.bgColor,
    '--fs-bg-secondary-color': contextValue.bgSecondaryColor,
    '--fs-text-color': contextValue.textColor,
    '--fs-accent-color': contextValue.accentColor,
    '--fs-on-accent-color': contextValue.onAccentColor,
    '--fs-error-color': contextValue.errorColor,
    '--fs-success-color': contextValue.successColor,
  }

  const isOpen = useSignal(contextValue.initialOpen)

  return (
    <formDevToolsContext.Provider value={contextValue}>
      <div
        style={{
          ...cssVars,
          position: 'fixed',
          [contextValue.verticalKey]: 0,
          [contextValue.horizontalKey]: 0,
          overflow: 'auto',
          maxHeight: '100vh',
          maxWidth: '30vw',
          opacity: 1,
          zIndex: 1000,
        }}
      >
        {isOpen.value ? (
          <FormDevToolsDrawer isOpen={isOpen} />
        ) : (
          <button
            id="fs-open-button"
            type="button"
            onClick={() => {
              isOpen.value = true
            }}
          >
            <AppIcon size={32} />
          </button>
        )}
      </div>
    </formDevToolsContext.Provider>
  )
}
