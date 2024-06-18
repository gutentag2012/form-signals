import {type Signal, useComputed} from "@preact/signals-react";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog.tsx";
import {useFieldGroup} from "@formsignals/form-react";
import {form, productsField} from "@/lib/CartForm.ts";
import { Label } from "../ui/label";
import {InputSignal} from "@/components/ui/input.tsx";
import {ErrorText} from "@/components/form/ErrorText.tsx";
import {Button} from "@/components/ui/button.tsx";
import {FileImageIcon, MinusIcon, PlusIcon, TrashIcon} from "lucide-react";
import { Separator } from "../ui/separator";

export type CheckoutDialogProps = {
  open: Signal<boolean>
}

export function CheckoutDialog({open}: CheckoutDialogProps) {
  return (
    <Dialog open={open.value} onOpenChange={newOpen => {
      open.value = newOpen
    }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cart</DialogTitle>
            <DialogDescription>Proceed with your checkout</DialogDescription>
          </DialogHeader>

          <div className="max-h-[80vh] overflow-y-auto px-1">
            <h3 className="mb-2 font-semibold text-lg">Shipping Address</h3>
            <ShippingAddressForm/>
            <h3 className='mt-4 mb-2 font-semibold text-lg'>Cart Overview</h3>
            <CartList />
          </div>

        </DialogContent>
      </Dialog>
  )
}

function CartList() {
  const subtotal = useComputed(() => productsField.data.value.reduce((acc, item) => acc + item.data.value.price.value * item.data.value.quantity.value, 0))
  const shipping = 5.99
  const totalCost = useComputed(() => subtotal.value + shipping)

  const subTotalDisplay = useComputed(() => subtotal.value.toFixed(2))
  const totalCostDisplay = useComputed(() => totalCost.value.toFixed(2))

  return (
    <productsField.FieldProvider>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          {!productsField.data.value.length && <p className="mb-2 text-muted-foreground italic">Your cart is empty</p>}
          {productsField.data.value.map((item, index) => (
            <div
              key={item.key}
              className="flex flex-row items-center gap-2"
            >
              <FileImageIcon className="h-24 w-24 p-6"/>
              <div>
                <h3 className="font-medium">{item.data.value.name}</h3>
                <p className="text-gray-500 text-sm dark:text-gray-400">${item.data.value.price.value.toFixed(2)}</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant={item.data.value.quantity.value <= 1 ? "destructive" : "outline"}
                  size="icon"
                  onClick={() => {
                    if (item.data.value.quantity.value <= 1) {
                      form.removeValueFromArray('products', index)
                      return
                    }
                    item.data.value.quantity.value -= 1
                  }}
                >
                  {item.data.value.quantity.value <= 1 ? <TrashIcon className="h-4 w-4"/> :
                    <MinusIcon className="h-4 w-4"/>}
                </Button>
                <span>{item.data.value.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    item.data.value.quantity.value += 1
                  }}
                >
                  <PlusIcon className="h-4 w-4"/>
                </Button>
              </div>
            </div>
          ))}
          <ErrorText/>
      </div>
        <div className="flex flex-col gap-2">
          <div className="text-sm">
            <p>Standard Shipping</p>
            <p className="text-gray-500 dark:text-gray-400">Estimated delivery in 5-7 business days</p>
          </div>
          <h2 className="font-medium">Total</h2>
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex items-center justify-between">
              <p>Subtotal</p>
              <p>${subTotalDisplay}</p>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <p>Shipping</p>
              <p>${shipping.toFixed(2)}</p>
            </div>
            <Separator className="my-1"/>
            <div className="flex items-center justify-between font-medium">
              <p>Total</p>
              <p>${totalCostDisplay}</p>
            </div>
          </div>
          <Button
            size="lg"
            className="mt-4 w-full"
            onClick={() => form.handleSubmit()}
            disabled={!form.canSubmit.value}
          >
            Complete Checkout
          </Button>
        </div>
      </div>
    </productsField.FieldProvider>
  )
}

function ShippingAddressForm() {
  const shippingAddressForm = useFieldGroup(form, ["name", "email", "address", "city", "state", "zip"])

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        void shippingAddressForm.handleSubmit()
      }}
      className="flex flex-col gap-2"
    >
        <shippingAddressForm.FieldProvider
          name="name"
          validator={v => !v && "This field is required!"}
        >
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
              <ErrorText/>
            </div>
          )}
        </shippingAddressForm.FieldProvider>
        <shippingAddressForm.FieldProvider
          name="email"
          validator={v => !v && "This field is required!"}
        >
          {(field) => (
            <div>
              <Label htmlFor={field.name}>Email</Label>
              <InputSignal
                id={field.name}
                value={field.data}
                onBlur={field.handleBlur}
                placeholder="Email"
                type="email"
                disabled={field.disabled}
              />
              <ErrorText/>
            </div>
          )}
        </shippingAddressForm.FieldProvider>
        <shippingAddressForm.FieldProvider
          name="address"
          validator={v => !v && "This field is required!"}
        >
          {(field) => (
            <div>
              <Label htmlFor={field.name}>Address</Label>
              <InputSignal
                id={field.name}
                value={field.data}
                onBlur={field.handleBlur}
                placeholder="Address"
                disabled={field.disabled}
              />
              <ErrorText/>
            </div>
          )}
        </shippingAddressForm.FieldProvider>
        <shippingAddressForm.FieldProvider
          name="city"
          validator={v => !v && "This field is required!"}
        >
          {(field) => (
            <div>
              <Label htmlFor={field.name}>City</Label>
              <InputSignal
                id={field.name}
                value={field.data}
                onBlur={field.handleBlur}
                placeholder="City"
                disabled={field.disabled}
              />
              <ErrorText/>
            </div>
          )}
        </shippingAddressForm.FieldProvider>
        <div className="flex flex-row gap-1">
          <shippingAddressForm.FieldProvider
            name="state"
            validator={v => !v && "This field is required!"}
          >
            {(field) => (
              <div className="flex-1">
                <Label htmlFor={field.name}>State</Label>
                <InputSignal
                  id={field.name}
                  value={field.data}
                  onBlur={field.handleBlur}
                  placeholder="State"
                  disabled={field.disabled}
                />
                <ErrorText/>
              </div>
            )}
          </shippingAddressForm.FieldProvider>
          <shippingAddressForm.FieldProvider name="zip" validator={v => !v && "This field is required!"}>
            {(field) => (
              <div className="flex-1">
                <Label htmlFor={field.name}>Zip</Label>
                <InputSignal
                  id={field.name}
                  value={field.data}
                  onBlur={field.handleBlur}
                  placeholder="Zip"
                  disabled={field.disabled}
                />
                <ErrorText/>
              </div>
            )}
          </shippingAddressForm.FieldProvider>
        </div>
          <button type="submit" className="hidden">submit address</button>
    </form>
  )
}
