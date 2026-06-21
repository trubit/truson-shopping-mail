import type { IProduct } from './product.types.js'

export interface ICartItem {
  product: IProduct | string
  quantity: number
  price: number
}

export interface ICart {
  _id: string
  user: string
  items: ICartItem[]
  totalPrice: number
  totalItems: number
  updatedAt: string
}
