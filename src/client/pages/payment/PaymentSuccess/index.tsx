import { useSearchParams, Link } from 'react-router-dom'
import { FiCheckCircle, FiPackage, FiArrowRight, FiShoppingBag } from 'react-icons/fi'
import { useOrder } from '../../../hooks/usePayment.js'
import { formatCurrency, formatDate } from '../../../../shared/helpers/index.js'

export default function PaymentSuccess() {
  const [params] = useSearchParams()
  const orderId  = params.get('orderId') ?? ''
  const { data: order, isLoading } = useOrder(orderId)

  return (
    <div className="payment-result payment-result--success">
      <div className="container payment-result__inner">
        <div className="payment-result__card">
          {/* Icon */}
          <div className="payment-result__icon-wrap payment-result__icon-wrap--success">
            <FiCheckCircle size={56} />
          </div>

          <h1 className="payment-result__title">Payment Successful!</h1>
          <p className="payment-result__subtitle">
            Your order has been confirmed. We'll send you a confirmation email shortly.
          </p>

          {/* Order summary */}
          {isLoading && <div className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-xl)' }} />}

          {order && (
            <div className="payment-result__order-card">
              <div className="payment-result__order-row">
                <span>Order Number</span>
                <strong className="payment-result__order-number">#{order.orderNumber}</strong>
              </div>
              <div className="payment-result__order-row">
                <span>Date</span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
              <div className="payment-result__order-row">
                <span>Total Paid</span>
                <strong>{formatCurrency(order.grandTotal)}</strong>
              </div>
              <div className="payment-result__order-row">
                <span>Shipping To</span>
                <span>{order.shippingAddress.city}, {order.shippingAddress.country}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="payment-result__actions">
            <Link to="/orders" className="btn btn-primary btn-lg">
              <FiPackage size={16} />
              Track My Order
            </Link>
            <Link to="/products" className="btn btn-outline">
              <FiShoppingBag size={16} />
              Continue Shopping
            </Link>
          </div>

          {/* Delivery estimate */}
          <p className="payment-result__note">
            <FiArrowRight size={12} />
            Your order will be dispatched within 1–2 business days.
          </p>
        </div>
      </div>
    </div>
  )
}
