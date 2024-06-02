import { FileUploadIcon } from '@/components/ui/FileUploadIcon.tsx'
import { Input } from '@/components/ui/input.tsx'
import { cn } from '@/lib/utils.ts'
import { useFieldContext } from '@formsignals/form-react'
import type { InputHTMLAttributes } from 'react'
import { Label } from './label'

interface FileInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'value' | 'onChange' | 'type'
  > {
  label?: string
  useBound?: boolean
  preview?: 'img' | 'list'
}

export function FileInput({
  className,
  label,
  useBound,
  preview = 'list',
  ...props
}: FileInputProps) {
  const field = useFieldContext<File[] | null, '', File[] | null>()
  const data = useBound ? field.transformedData.value : field.data.value

  const previewDisplay = !data ? null : preview === 'list' ? (
    <>
      <ul className="list-disc">
        {data
          .filter(Boolean)
          .map((file) =>
            'key' in file ? (
              <li key={file.key}>{file.data.value.name}</li>
            ) : (
              <li key={file.name}>{file.name}</li>
            ),
          )}
      </ul>
      <p className="text-foreground/60 text-xs">Click to change or drag over</p>
    </>
  ) : (
    <>
      {data
        .filter(Boolean)
        .map((file) =>
          'key' in file ? (
            <img
              key={file.key}
              src={URL.createObjectURL(file.data.value as unknown as File)}
              alt="Prview"
              className="max-w-4xl object-cover"
            />
          ) : (
            <img
              key={file.name}
              src={URL.createObjectURL(file as unknown as File)}
              alt="Prview"
              className="max-w-4xl object-cover"
            />
          ),
        )}
      <p className="text-foreground/60 text-xs">Click to change or drag over</p>
    </>
  )

  return (
    <Label
      className={cn(
        'relative flex min-h-64 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-border border-dashed bg-muted/10 p-8 hover:bg-muted/20',
        className,
      )}
    >
      <Input
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        type="file"
        onChange={(e) => {
          const files = e.target.files ? Array.from(e.target.files) : null
          if (useBound) field.handleChangeBound(files)
          else field.handleChange(files)
        }}
        {...props}
      />
      {data ? (
        previewDisplay
      ) : (
        <>
          <FileUploadIcon size={32} />
          <div className="flex flex-col items-center">
            <p className="font-semibold text-foreground/80 text-sm">
              Click to upload or drag over
            </p>
            {label && <p className="text-foreground/60 text-xs">{label}</p>}
          </div>
        </>
      )}
    </Label>
  )
}
