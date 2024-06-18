import { createRoot } from 'react-dom/client'
import './index.css'
import { CheckoutDialog } from '@/components/application/CheckoutDialog.tsx'
import { ProductList } from '@/components/application/ProductList.tsx'
import { Button } from '@/components/ui/button.tsx'
import { form } from '@/lib/CartForm.ts'
import { useFormWithComponents } from '@formsignals/form-react'
import { useComputed, useSignal } from '@preact/signals-react'
import { CreditCardIcon } from 'lucide-react'

/**
 * @useSignals
 */
export function Index() {
  const isCartOpen = useSignal(false)
  const cartSize = useComputed(
    () => form.data.value.products?.value?.length ?? 0,
  )

  const formWithComponents = useFormWithComponents(form)

  return (
    <main className="flex h-screen flex-col gap-2 bg-muted">
      <header className="flex items-center justify-between bg-card px-4 py-4">
        <div className="flex items-center gap-2">
          <CreditCardIcon className="h-6 w-6 text-gray-900 dark:text-gray-100" />
          <h1 className="font-semibold text-lg">E Commerce</h1>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            isCartOpen.value = true
          }}
        >
          Open Cart ({cartSize})
        </Button>
      </header>

      <formWithComponents.FormProvider>
        <CheckoutDialog open={isCartOpen} />

        <div className="container h-full overflow-auto">
          <ProductList />
        </div>
      </formWithComponents.FormProvider>
    </main>
  )
}

const rootElement = document.getElementById('root')!

createRoot(rootElement).render(<Index />)
