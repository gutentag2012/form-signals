import './index.css'
// biome-ignore lint/correctness/noUnusedImports: This is the React import
import React, {type CSSProperties} from "react"
import {useSignal} from '@preact/signals-react'
import {defaultContext, formDevToolsContext,} from './FormDevToolsContext'
import {FormDevToolsDrawer} from "./components/FormDevToolsDrawer";
import {AppIcon} from "./icons/AppIcon";
import {TooltipProvider} from "./components/Tooltip";

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

// TODO Testing
// TODO Docs

// TODO When removing a variant, the value is still preserved event though I explicitly removed it
// TODO Dynamic object is not marked as dirty
// TODO Dynamic object cannot be reset (price)
// TODO Reset does not reset not defined default values

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
      <TooltipProvider>
        <div
          id="fs-dev-tools--container"
          style={{
            ...cssVars,
            [contextValue.verticalKey]: 0,
            [contextValue.horizontalKey]: 0,
          } as CSSProperties}
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
      </TooltipProvider>
    </formDevToolsContext.Provider>
  )
}
