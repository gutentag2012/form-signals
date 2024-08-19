import { Button } from '@/components/ui/button'
import { type CartFormValues, productsField } from '@/lib/CartForm.ts'
import { useFieldContext } from '@formsignals/form-react'
import { useComputed } from '@preact/signals-react'
import { FileImageIcon } from 'lucide-react'

const products = [
  {
    id: '1',
    name: 'Cozy Fleece Pullover',
    price: 49.99,
  },
  {
    id: '2',
    name: 'Stylish Leather Tote',
    price: 79.99,
  },
  {
    id: '3',
    name: 'Wireless Noise-Cancelling Headphones',
    price: 99.99,
  },
  {
    id: '4',
    name: 'Ergonomic Desk Chair',
    price: 149.99,
  },
  {
    id: '5',
    name: 'Bamboo Cutting Board',
    price: 24.99,
  },
  {
    id: '6',
    name: 'Stainless Steel Water Bottle',
    price: 29.99,
  },
  {
    id: '7',
    name: 'Portable Bluetooth Speaker',
    price: 39.99,
  },
  {
    id: '8',
    name: 'Smartphone Stand',
    price: 9.99,
  },
]

export function ProductList() {
  return (
    <productsField.FieldProvider>
      <section className="grid grid-cols-1 gap-2 py-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </section>
    </productsField.FieldProvider>
  )
}

function ProductCard({
  product,
}: { product: Omit<CartFormValues['products'][0], 'quantity'> }) {
  const parentField = useFieldContext<CartFormValues, 'products'>()

  const buttonText = useComputed(() => {
    const existingProduct = parentField.data.value.find(
      (p) => p.data.value.id.peek() === product.id,
    )

    return existingProduct
      ? `Add Another (${existingProduct.data.value.quantity.value})`
      : 'Add to Cart'
  })

  return (
    <div className="flex flex-col justify-between rounded-xl bg-card">
      <FileImageIcon className="h-48 w-full p-12" />
      <div className="p-4">
        <h3 className="mb-2 font-semibold text-xl">{product.name}</h3>
        <div className="flex items-center justify-between">
          <span className="font-base text-muted-foreground">
            ${product.price}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const existingProduct = parentField.data
                .peek()
                .find((p) => p.data.peek().id.peek() === product.id)

              if (existingProduct) {
                existingProduct.data.peek().quantity.value += 1
                return
              }

              parentField.pushValueToArray({
                ...product,
                quantity: 1,
              })
            }}
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </div>
  )
}
