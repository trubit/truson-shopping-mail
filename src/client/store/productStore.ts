import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { IProduct, CartItem, ProductFilters } from '../../shared/types/product.types.js'

interface ProductStore {
  // ── Quick View ────────────────────────────────────────
  selectedProduct: IProduct | null
  setSelectedProduct: (product: IProduct | null) => void

  // ── Filter State ──────────────────────────────────────
  filters: ProductFilters
  setFilters: (filters: Partial<ProductFilters>) => void
  resetFilters: () => void

  // ── Cart ──────────────────────────────────────────────
  cartItems: CartItem[]
  addToCart: (product: IProduct, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  cartCount: () => number
  cartTotal: () => number
}

const defaultFilters: ProductFilters = {
  sort: 'newest',
  page: 1,
  limit: 20,
}

export const useProductStore = create<ProductStore>()(
  persist(
    (set, get) => ({
      // ── Quick View ────────────────────────────────────
      selectedProduct: null,
      setSelectedProduct: (product) => set({ selectedProduct: product }),

      // ── Filters ───────────────────────────────────────
      filters: defaultFilters,
      setFilters: (partial) =>
        set((state) => ({ filters: { ...state.filters, ...partial, page: 1 } })),
      resetFilters: () => set({ filters: defaultFilters }),

      // ── Cart ──────────────────────────────────────────
      cartItems: [],

      addToCart: (product, quantity = 1) =>
        set((state) => {
          const existing = state.cartItems.find((i) => i.product._id === product._id)
          if (existing) {
            return {
              cartItems: state.cartItems.map((i) =>
                i.product._id === product._id
                  ? { ...i, quantity: Math.min(i.quantity + quantity, product.stockQuantity) }
                  : i,
              ),
            }
          }
          return { cartItems: [...state.cartItems, { product, quantity }] }
        }),

      removeFromCart: (productId) =>
        set((state) => ({
          cartItems: state.cartItems.filter((i) => i.product._id !== productId),
        })),

      updateQuantity: (productId, quantity) =>
        set((state) => ({
          cartItems:
            quantity <= 0
              ? state.cartItems.filter((i) => i.product._id !== productId)
              : state.cartItems.map((i) =>
                  i.product._id === productId ? { ...i, quantity } : i,
                ),
        })),

      clearCart: () => set({ cartItems: [] }),

      cartCount: () => get().cartItems.reduce((sum, i) => sum + i.quantity, 0),

      cartTotal: () =>
        get().cartItems.reduce((sum, i) => {
          const price = i.product.discountPrice ?? i.product.price
          return sum + price * i.quantity
        }, 0),
    }),
    {
      name: 'trusonshopp-cart',
      partialize: (state) => ({ cartItems: state.cartItems }),
    },
  ),
)
