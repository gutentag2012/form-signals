type PriceNet = {
  priceNet: number
  taxRate: number
  count: number
}
type PriceGross = {
  priceGross: number
  taxRate: number
  count: number
}
type Price = PriceNet | PriceGross

export interface Product {
  name: string
  description: string
  validRange: [Date | undefined, Date | undefined]
  prices: {
    [currency: string]: Array<Price>
  }
  variants: Array<{
    name: string
    options: Array<string>
  }>
}
