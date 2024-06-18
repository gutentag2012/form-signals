import { FormLogic } from '@formsignals/form-core'
import {fieldLogicToFieldContext} from "@formsignals/form-react";

export interface CartFormValues {
  name: string
  email: string
  address: string
  city: string
  state: string
  zip: string

  products: Array<{
    id: string
    name: string
    price: number
    quantity: number
  }>
}

export const form = new FormLogic<CartFormValues>({
  defaultValues: {
    name: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    products: [],
  },
  onSubmit: async (values) => {
    alert(`Sending order to server with values ${JSON.stringify(values, null, 2)}`)
    form.reset()
  }
})
form.mount()

const productsFieldLogic = form.getOrCreateField("products", {
  validator: products => !products.length && "Please add at least one product",
})
productsFieldLogic.mount()
export const productsField = fieldLogicToFieldContext(productsFieldLogic)
