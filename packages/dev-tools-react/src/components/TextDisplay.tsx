// biome-ignore lint/correctness/noUnusedImports: This is the React import
import React from "react"
import type { Signal } from '@preact/signals-react'

export type NumberDisplayProps = {
  value: Signal<number | string>
  label: string
}

export function TextDisplay(props: NumberDisplayProps) {
  return (
    <label className="fs-number-display">
      <strong>{props.label}</strong> {props.value}
    </label>
  )
}
