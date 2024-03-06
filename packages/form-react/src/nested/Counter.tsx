// biome-ignore lint/nursery/noUnusedImports: This is the React import
import  React from "react";
import { useState } from 'react'

export const Counter = () => {
  const [counter, setCounter] = useState(0)
  return (
    <button type="button" onClick={() => setCounter((prev) => prev + 1)}>
      Count is {counter}
    </button>
  )
}
