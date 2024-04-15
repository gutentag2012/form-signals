// biome-ignore lint/correctness/noUnusedImports: This is the React import
import React from "react"
import type { Signal } from '@preact/signals-react'

export type BooleanDisplayProps = {
  value: Signal<boolean>
  label: string
}

export function BooleanDisplay(props: BooleanDisplayProps) {
  const value = props.value.value
  const dotClass = `${value ? 'bg-success' : 'bg-error'} fs-boolean-dot`

  return (
    <label
      className="fs-boolean-display"
    >
      <strong>{props.label}</strong> <div className={dotClass} />
    </label>
  )
}
