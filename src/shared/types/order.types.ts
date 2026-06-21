import type { IAddress } from './user.types.js'
import type { ICartItem } from './cart.types.js'

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface IOrder {
  _id: string
  user: string
  items: ICartItem[]
  shippingAddress: IAddress
  paymentMethod: string
  paymentStatus: PaymentStatus
  orderStatus: OrderStatus
  subtotal: number
  shippingFee: number
  tax: number
  total: number
  trackingNumber?: string
  notes?: string
  createdAt: string
  updatedAt: string
}
