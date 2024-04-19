import React from 'react'

// We want to use the layout effect if possible to avoid setting the state during a React render
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect
