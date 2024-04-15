// biome-ignore lint/correctness/noUnusedImports: This is the React import
import React from "react"
import {useSignal} from "@preact/signals-react";
import {ChevronDownIcon} from "../icons/ChevronDownIcon";
import {ChevronRightIcon} from "../icons/ChevronRightIcon";
import type {PropsWithChildren, ReactNode} from "react";

export type CollapsibleProps = {
  title: string
  endAttachment?: ReactNode
}

export function Collapsible({ title, endAttachment, children }: PropsWithChildren<CollapsibleProps>) {
  const isOpen = useSignal(false)

  return (
    <div className="collapsible">
      <button
        type="button"
        className="collapsible__button"
        onClick={() =>{
          isOpen.value = !isOpen.peek()
        }}
      >
        {isOpen.value ? <ChevronDownIcon /> : <ChevronRightIcon />}
        {title}
        {endAttachment && <div className="collapsible__endAttachment">{endAttachment}</div>}
      </button>
      {isOpen.value && <div className="collapsible__content">{children}</div>}
    </div>
  )
}
