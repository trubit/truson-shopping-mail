import { useState } from 'react'
import { useCart } from '../../hooks/useCart.js'
import CartList from '../../components/cart/CartList/index.js'
import CartSummary from '../../components/cart/CartSummary/index.js'
import EmptyCart from '../../components/cart/EmptyCart/index.js'
import RecommendedProducts from '../../components/cart/RecommendedProducts/index.js'
import '../../styles/cart.css'

// Coupon state — Phase 6 will wire to API
interface CouponState {
  code:     string | undefined
  discount: number
  error:    string | undefined
  loading:  boolean
}

export default function CartPage() {
  const {
    items,
    totals,
    isLoading,
    isMutating,
    removeFromCart,
    updateQuantity,
    clearCart,
  } = useCart()

  const [coupon, setCoupon] = useState<CouponState>({
    code: undefined, discount: 0, error: undefined, loading: false,
  })

  const handleCouponApply = (code: string) => {
    setCoupon({ code: undefined, discount: 0, error: 'Invalid or expired coupon code', loading: false })
    // Phase 6: POST /api/v1/cart/coupon { code }
    void code
  }

  const handleCouponRemove = () => {
    setCoupon({ code: undefined, discount: 0, error: undefined, loading: false })
  }

  if (isLoading) {
    return (
      <div className="cart-page container section">
        <div className="cart-page__skeleton">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton cart-item-skeleton" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <div className="container section">
        {/* Page header */}
        <div className="cart-page__header">
          <h1 className="cart-page__title">Shopping Cart</h1>
          {items.length > 0 && (
            <span className="cart-page__count">{totals.totalItems} item{totals.totalItems !== 1 ? 's' : ''}</span>
          )}
        </div>

        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="cart-page__layout">
            {/* Left: cart items */}
            <div className="cart-page__main">
              <CartList
                items={items}
                onRemove={removeFromCart}
                onUpdateQty={updateQuantity}
                isMutating={isMutating}
              />
            </div>

            {/* Right: summary */}
            <div className="cart-page__aside">
              <CartSummary
                totals={totals}
                onCouponApply={handleCouponApply}
                onCouponRemove={handleCouponRemove}
                appliedCoupon={coupon.code}
                couponLoading={coupon.loading}
                couponError={coupon.error}
                onClearCart={clearCart}
                isCheckoutEnabled={items.length > 0}
              />
            </div>
          </div>
        )}

        {/* Recommended products */}
        <RecommendedProducts />
      </div>
    </div>
  )
}
