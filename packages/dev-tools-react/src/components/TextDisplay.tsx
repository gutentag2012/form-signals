// biome-ignore lint/correctness/noUnusedImports: This is the React import
import React from 'react'
import type { Signal } from '@preact/signals-react'
import { Tooltip, TooltipContent, TooltipTrigger } from './Tooltip'

export type NumberDisplayProps = {
  value: Signal<number | string>
  label: string
  tooltip: string
}

export function TextDisplay(props: NumberDisplayProps) {
  return (
    <div className="fs-utils--flex">
      <Tooltip delayDuration={500}>
        <label className="fs-number-display">
          <TooltipTrigger asChild>
            <strong>{props.label}</strong>
          </TooltipTrigger>{' '}
          {props.value}
        </label>
        <TooltipContent>
          <p>{props.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
