import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiCheckCircle } from 'react-icons/fi'
import OrderReview from '../../../components/checkout/OrderReview/index.js'
import { useCheckoutStore } from '../../../store/checkoutStore.js'

export default function OrderSummaryStep() {
  const navigate    = useNavigate()
  const { session, reset, prevStep } = useCheckoutStore()
  const [placed, setPlaced] = useState(false)
  const [placing, setPlacing] = useState(false)

  if (!session?.shippingAddress) {
    return (
      <div className="checkout-step">
        <p className="checkout-step__error">Missing shipping details. Please go back.</p>
        <button className="btn btn-outline" onClick={prevStep}>← Back</button>
      </div>
    )
  }

  const handlePlaceOrder = async () => {
    setPlacing(true)
    // Phase 7: POST /api/orders/create from checkout session
    // For now: show success and reset
    await new Promise((res) => setTimeout(res, 1200))
    setPlaced(true)
    setPlacing(false)
    reset()
  }

  if (placed) {
    return (
      <div className="checkout-success">
        <FiCheckCircle size={64} className="checkout-success__icon" />
        <h2 className="checkout-success__title">Order Placed!</h2>
        <p className="checkout-success__message">
          Thank you for your order. Payment integration is coming in the next phase.
          Your checkout details have been saved.
        </p>
        <div className="checkout-success__actions">
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/orders')}>
            View My Orders
          </button>
          <button className="btn btn-outline" onClick={() => navigate('/products')}>
            Continue Shopping
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-step">
      <h2 className="checkout-step__title">Review Your Order</h2>
      <p className="checkout-step__subtitle">
        Please confirm all details before placing your order.
      </p>

      <OrderReview onPlaceOrder={handlePlaceOrder} isSubmitting={placing} />

      <button className="btn btn-ghost checkout-step__back-link" onClick={prevStep}>
        ← Back to Shipping
      </button>
    </div>
  )
}
