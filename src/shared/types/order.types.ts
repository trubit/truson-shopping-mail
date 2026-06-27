import type { IAddress } from './user.types.js'
import type { IServerCartItem } from './cart.types.js'

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export type OrderPaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

import type { ShippingMethod } from './checkout.types.js'
export type { ShippingMethod }

export interface IOrderItem {
  productId:  string
  title:      string
  image?:     string
  sku:        string
  quantity:   number
  itemPrice:  number
  lineTotal:  number
}

export interface IOrder {
  _id:                string
  orderNumber:        string
  userId:             string
  checkoutSessionId?: string
  items:              IOrderItem[]
  shippingAddress:    IAddress & { fullName: string; phone: string }
  billingAddress?:    IAddress & { fullName: string; phone: string }
  sameAsShipping:     boolean
  shippingMethod:     ShippingMethod
  subtotal:           number
  discountAmount:     number
  shippingFee:        number
  taxAmount:          number
  grandTotal:         number
  couponCode?:        string
  paymentStatus:      OrderPaymentStatus
  orderStatus:        OrderStatus
  paymentIntentId?:   string
  notes?:             string
  createdAt:          string
  updatedAt:          string
}

// Kept for backward compat — points at IServerCartItem
export type ICartItem = IServerCartItem
