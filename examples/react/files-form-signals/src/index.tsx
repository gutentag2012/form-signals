import { createRoot } from 'react-dom/client'
import './index.css'
import { FileInput } from '@/components/ui/FileInput.tsx'
import { Button } from '@/components/ui/button.tsx'
import { InputSignal } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import { useForm } from '@formsignals/form-react'
import { ZodAdapter } from '@formsignals/validation-adapter-zod'
import { z } from 'zod'
import { ErrorText } from './components/form/ErrorText'

interface FormData {
  packageName: string
  description: string
  thumbnail: File | null
  packageFiles: File[] | null
}

export const Index = () => {
  const form = useForm<FormData, typeof ZodAdapter>({
    validatorAdapter: ZodAdapter,
    onSubmit: (values) => {
      console.log(values)
    },
  })
  return (
    <main className="container mt-3 flex flex-col gap-2">
      <h1 className="mb-2 font-extrabold text-4xl tracking-tight">
        Create Package
      </h1>

      <form.FormProvider>
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void form.handleSubmit()
          }}
        >
          <form.FieldProvider name="packageName" validator={z.string().min(1)}>
            {(field) => (
              <div>
                <Label htmlFor={field.name}>Name</Label>
                <InputSignal
                  id={field.name}
                  value={field.data}
                  onBlur={field.handleBlur}
                  placeholder="Name"
                  disabled={field.disabled}
                />
                <ErrorText />
              </div>
            )}
          </form.FieldProvider>
          <form.FieldProvider name="description" validator={z.string().min(1)}>
            {(field) => (
              <div>
                <Label htmlFor={field.name}>Description</Label>
                <InputSignal
                  id={field.name}
                  value={field.data}
                  onBlur={field.handleBlur}
                  placeholder="Description"
                  disabled={field.disabled}
                />
                <ErrorText />
              </div>
            )}
          </form.FieldProvider>
          <form.FieldProvider
            name="thumbnail"
            transformFromBinding={(files: File[] | null) => files?.[0] ?? null}
            transformToBinding={(e) => (e ? [e] : null)}
            validator={(v) => !v && 'This field is required!'}
          >
            <Label>Thumbnail</Label>
            <FileInput
              useBound
              label="Upload Thumbnail"
              accept="image/*"
              preview="img"
            />
            <ErrorText />
          </form.FieldProvider>
          <form.FieldProvider
            name="packageFiles"
            validator={(v) =>
              !v?.length &&
              'At least one file has to be included in the package!'
            }
          >
            <Label>Files</Label>
            <FileInput label="Upload Thumbnail" multiple />
            <ErrorText />
          </form.FieldProvider>

          <Button type="submit">Create Package</Button>
        </form>
      </form.FormProvider>
    </main>
  )
}

const rootElement = document.getElementById('root')!

createRoot(rootElement).render(<Index />)
