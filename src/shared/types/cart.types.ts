import type { IProduct } from './product.types.js'

// ─── Server-side populated cart item ──────────────────────────────────────────
export interface IServerCartItem {
  productId: IProduct | string
  quantity: number
  selectedVariant?: string
  selectedSize?: string
  selectedColor?: string
  itemPrice: number
}

// ─── Full server cart document ────────────────────────────────────────────────
export interface IServerCart {
  _id: string
  userId: string
  items: IServerCartItem[]
  couponCode?: string
  discountAmount: number
  cartTotal: number
  shippingCost: number
  taxAmount: number
  grandTotal: number
  createdAt: string
  updatedAt: string
}

// ─── Guest / local cart item (Zustand, pre-login) ─────────────────────────────
export interface IGuestCartItem {
  product: IProduct
  quantity: number
  selectedVariant?: string
  selectedSize?: string
  selectedColor?: string
}

// ─── Cart display item (unified view for components) ─────────────────────────
export interface ICartDisplayItem {
  productId: string
  product: IProduct
  quantity: number
  itemPrice: number
  lineTotal: number
  selectedVariant?: string
  selectedSize?: string
  selectedColor?: string
}

// ─── Cart totals ──────────────────────────────────────────────────────────────
export interface ICartTotals {
  subtotal: number
  discountAmount: number
  shippingCost: number
  taxAmount: number
  grandTotal: number
  totalItems: number
  isFreeShipping: boolean
  freeShippingThreshold: number
  remainingForFreeShipping: number
}

// ─── Sync payload for login cart merge ───────────────────────────────────────
export interface ICartSyncItem {
  productId: string
  quantity: number
}
