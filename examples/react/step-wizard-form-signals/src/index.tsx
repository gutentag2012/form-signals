import { useFieldGroup, useForm } from '@formsignals/form-react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AccountStep } from '@/components/stepper/AccountStep.tsx'
import { AddressStep } from '@/components/stepper/AddressStep.tsx'
import { PartButton } from '@/components/stepper/PartButton.tsx'
import { PersonalStep } from '@/components/stepper/PersonalStep.tsx'
import { PreferencesStep } from '@/components/stepper/PreferencesStep.tsx'
import { ReviewStep } from '@/components/stepper/ReviewStep.tsx'
import { type FormValues, MAX_STEPS } from '@/types.ts'
import { FormDevTools } from '@formsignals/dev-tools-react'
import { ZodAdapter } from '@formsignals/validation-adapter-zod'
import { useSignal } from '@preact/signals-react'
import { useCallback } from 'react'

export const Index = () => {
  const step = useSignal(1)
  const nextStep = useCallback(() => {
    step.value++
  }, [step])

  const form = useForm<FormValues, typeof ZodAdapter>({
    validateUnmountedChildren: true,
    validatorAdapter: ZodAdapter,
    onSubmit: (values) => {
      alert(`Form submitted!\n${JSON.stringify(values, null, 2)}`)
      step.value = 1
      form.reset()
    },
  })
  const personalGroup = useFieldGroup(
    form,
    ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth'],
    {
      onSubmit: nextStep,
    },
  )
  const addressGroup = useFieldGroup(
    form,
    ['street', 'city', 'state', 'zip', 'country'],
    {
      onSubmit: nextStep,
    },
  )
  const accountGroup = useFieldGroup(
    form,
    ['username', 'password', 'confirmPassword'],
    {
      onSubmit: nextStep,
    },
  )
  const preferencesGroup = useFieldGroup(
    form,
    ['newsletter', 'contact', 'language'],
    {
      onSubmit: nextStep,
    },
  )

  return (
    <main className="container mt-3">
      <h1 className="mb-1 font-extrabold text-4xl tracking-tight">
        Step Wizard
      </h1>

      <form.FormProvider>
        <div className="mt-4">
          <div className="mb-2 flex flex-row items-center justify-between px-2">
            <div className="flex flex-row gap-1">
              <PartButton
                step={1}
                currentStep={step}
                isValid={personalGroup.isValid}
              />
              <PartButton
                step={2}
                currentStep={step}
                isValid={addressGroup.isValid}
              />
              <PartButton
                step={3}
                currentStep={step}
                isValid={accountGroup.isValid}
              />
              <PartButton
                step={4}
                currentStep={step}
                isValid={preferencesGroup.isValid}
              />
              <PartButton step={5} currentStep={step} />
            </div>
            <p className="font-semibold text-sm">
              Step {step} of {MAX_STEPS}
            </p>
          </div>

          <personalGroup.FieldGroupProvider>
            <PersonalStep step={1} currentStep={step} />
          </personalGroup.FieldGroupProvider>

          <addressGroup.FieldGroupProvider>
            <AddressStep step={2} currentStep={step} />
          </addressGroup.FieldGroupProvider>

          <accountGroup.FieldGroupProvider>
            <AccountStep step={3} currentStep={step} />
          </accountGroup.FieldGroupProvider>

          <preferencesGroup.FieldGroupProvider>
            <PreferencesStep step={4} currentStep={step} />
          </preferencesGroup.FieldGroupProvider>

          <ReviewStep step={5} currentStep={step} />

          <FormDevTools />
        </div>
      </form.FormProvider>
    </main>
  )
}

const rootElement = document.getElementById('root')!

createRoot(rootElement).render(<Index />)
