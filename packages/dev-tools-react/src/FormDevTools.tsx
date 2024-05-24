import { useSignal } from '@preact/signals-react'
// biome-ignore lint/correctness/noUnusedImports: This is the React import
import React, { type CSSProperties } from 'react'
import { FormDevToolsDrawer } from './components/FormDevToolsDrawer'
import { TooltipProvider } from './components/Tooltip'
import { AppIcon } from './icons/AppIcon'
import './css-reset.css'
import './index.css'

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

const defaultValues = {
  bgColor: '#1c1917',
  bgSecondaryColor: '#44403c',
  textColor: '#fafaf9',
  accentColor: '#0369a1',
  onAccentColor: '#f0f9ff',
  errorColor: '#b91c1c',
  successColor: '#15803d',

  initialOpen: false,
  verticalKey: 'bottom',
  horizontalKey: 'right',
} as const

export function FormDevTools(props: FormDevToolsProps) {
  const [verticalKey, horizontalKey] = (props.position?.split('-') ?? [
    'bottom',
    'right',
  ]) as ['top' | 'bottom', 'left' | 'right']

  const cssVars = {
    '--fs-bg-color': props.bgColor ?? defaultValues.bgColor,
    '--fs-bg-secondary-color':
      props.bgSecondaryColor ?? defaultValues.bgSecondaryColor,
    '--fs-text-color': props.textColor ?? defaultValues.textColor,
    '--fs-accent-color': props.accentColor ?? defaultValues.accentColor,
    '--fs-on-accent-color': props.onAccentColor ?? defaultValues.onAccentColor,
    '--fs-error-color': props.errorColor ?? defaultValues.errorColor,
    '--fs-success-color': props.successColor ?? defaultValues.successColor,
  }

  const isOpen = useSignal(props.initialOpen ?? defaultValues.initialOpen)

  return (
    <TooltipProvider>
      <div
        id="fs-dev-tools--container"
        style={
          {
            ...cssVars,
            [verticalKey]: 0,
            [horizontalKey]: 0,
          } as CSSProperties
        }
      >
        {isOpen.value ? (
          <FormDevToolsDrawer
            isOpen={isOpen}
            verticalKey={verticalKey}
            horizontalKey={horizontalKey}
          />
        ) : (
          <button
            id="fs-open-button"
            type="button"
            onClick={() => {
              isOpen.value = true
            }}
          >
            <AppIcon />
          </button>
        )}
      </div>
    </TooltipProvider>
  )
}
