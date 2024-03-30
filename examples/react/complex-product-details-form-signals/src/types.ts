export interface Product {
  name: string
  description: string
  validRange: [Date | undefined, Date | undefined]
  prices: {
    [currency: string]: Array<{
      price: number
      taxRate: number
      count: number
    }>
  }
  variants: Array<{
    name: string
    options: Array<string>
  }>
}
