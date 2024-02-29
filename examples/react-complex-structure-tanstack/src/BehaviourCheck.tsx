import { Button } from '@/components/ui/button.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import { cn } from '@/lib/utils.ts'
import { useForm } from '@tanstack/react-form'
import { useEffect, useState } from 'react'

export const BehaviourCheck = () => {
  const [show, setShow] = useState(false)

  const form = useForm<{
    name: string
    other: string
    nested: { deep: string }
  }>({
    validators: {
      onSubmit: (v) => {
        console.log('onSubmit Form', v)
        return (v.value.name?.length ?? 0) >= 3 && 'error'
      },
      onChange: (v) => {
        console.log('onChange Form', v)
        return (v.value.name?.length ?? 0) >= 3 && 'error'
      },
      onBlur: (v) => {
        console.log('onBlur Form', v)
        return (v.value.name?.length ?? 0) >= 3 && 'error'
      },
      onMount: (v) => {
        console.log('onMount Form', v)
        return (v.value.name?.length ?? 0) >= 3 && 'error'
      },
    },
  })

  useEffect(() => {
    const timeout1 = setTimeout(
      () => form.setFieldValue('other', 'value'),
      1000,
    )
    const timeout2 = setTimeout(
      () => form.setFieldValue('other', 'value2'),
      2000,
    )
    const timeout3 = setTimeout(
      () => form.fieldInfo?.other?.instances?.[0]?.handleChange('value3'),
      3000,
    )

    return () => {
      clearTimeout(timeout1)
      clearTimeout(timeout2)
      clearTimeout(timeout3)
    }
  }, [form, form.fieldInfo?.other?.instances?.[0]])

  const [render, setRender] = useState(0)
  useEffect(() => {
    const timeout = setTimeout(() => setRender(render + 1), 2_000)
    return () => clearTimeout(timeout)
  })

  return (
    <main className="container mt-3">
      <h1 className="text-4xl font-extrabold tracking-tight mb-1">
        BehaviourCheck
      </h1>
      <form.Provider>
        {show && (
          <form.Field
            name={'other'}
            preserveValue
            children={(field) => field.getValue()}
          />
        )}
        <Button onClick={() => setShow((v) => !v)}>
          {show ? 'Hide' : 'Show'}
        </Button>
        <form.Field
          name={'name'}
          validators={{
            onSubmit: (v) => {
              console.log('onSubmit Field', v)
              return (v.value?.length ?? 0) >= 3 && 'error'
            },
            onChange: (v) => {
              console.log('onChange Field', v)
              return (v.value?.length ?? 0) >= 3 && 'error'
            },
            onBlur: (v) => {
              console.log('onBlur Field', v)
              return (v.value?.length ?? 0) >= 3 && 'error'
            },
            onMount: (v) => {
              console.log('onMount Field', v)
              return (v.value?.length ?? 0) >= 3 && 'error'
            },
          }}
          children={(field) => (
            <div>
              <Label htmlFor={field.name}>Name</Label>
              <Input
                id={field.name}
                name={field.name}
                type="text"
                placeholder="Name"
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                value={field.state.value}
              />
              <div
                className={cn(
                  'flex flex-row justify-between text-[0.8rem] font-medium',
                  !!field.state.meta.errors.length && 'text-destructive',
                )}
              >
                <p>{field.state.meta.errors}</p>
              </div>
            </div>
          )}
        />

        <Button type="submit" onClick={form.handleSubmit} className="mt-2">
          Submit
        </Button>

        <pre className="mt-8">{JSON.stringify(form.state, null, 2)}</pre>
      </form.Provider>
    </main>
  )
}
