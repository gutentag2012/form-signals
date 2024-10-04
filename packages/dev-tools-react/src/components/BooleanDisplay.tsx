import type { Signal } from '@preact/signals-react'
// biome-ignore lint/correctness/noUnusedImports: This is the React import
import React from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from './Tooltip'

export type BooleanDisplayProps = {
  value: Signal<boolean>
  label: string
  tooltip: string
}

export function BooleanDisplay(props: BooleanDisplayProps) {
  const value = props.value.value
  const dotClass = `${
    value ? 'fs-utils--bg-success' : 'fs-utils--bg-error'
  } fs-boolean-dot`

  return (
    <div className="fs-utils--flex">
      <Tooltip delayDuration={500}>
        <span className="fs-boolean-display">
          <TooltipTrigger asChild>
            <strong>{props.label}</strong>
          </TooltipTrigger>
          <div className={dotClass} />
        </span>
        <TooltipContent>
          <p>{props.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
