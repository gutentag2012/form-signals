import { cn } from '@/lib/utils.ts'
import type { Signal } from '@preact/signals-react'

type PartButtonProps = {
  step: number
  currentStep: Signal<number>
  isValid?: Signal<boolean>
}

export const PartButton = (props: PartButtonProps) => {
  const currentStep = props.currentStep.value
  const isError = props.isValid && !props.isValid.value
  return (
    <i
      className={cn('h-3 w-3 rounded-full bg-gray-300', {
        'bg-green-500': props.step < currentStep,
        'bg-green-400/70': !isError && props.step === currentStep,
        'bg-red-500': isError,
      })}
    />
  )
}
