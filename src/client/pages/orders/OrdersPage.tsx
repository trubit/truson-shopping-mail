import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiPackage, FiChevronDown, FiChevronUp, FiShoppingBag,
  FiMapPin, FiTruck, FiCalendar, FiHash,
} from 'react-icons/fi'
import { useMyOrders } from '../../hooks/usePayment.js'
import { formatCurrency, formatDate } from '../../../shared/helpers/index.js'
import type { IOrder, OrderStatus, OrderPaymentStatus } from '../../../shared/types/index.js'

const ORDER_STATUS_STYLE: Record<OrderStatus, string> = {
  pending:    'badge-warning',
  confirmed:  'badge-primary',
  processing: 'badge-primary',
  shipped:    'badge-primary',
  delivered:  'badge-success',
  cancelled:  'badge-danger',
  refunded:   'badge-neutral',
}

const PAYMENT_STATUS_STYLE: Record<OrderPaymentStatus, string> = {
  pending:  'badge-warning',
  paid:     'badge-success',
  failed:   'badge-danger',
  refunded: 'badge-neutral',
}

function OrderCard({ order }: { order: IOrder }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="order-card">
      {/* Header row */}
      <div className="order-card__header">
        <div className="order-card__meta">
          <div className="order-card__meta-item">
            <FiHash size={13} />
            <strong>{order.orderNumber}</strong>
          </div>
          <div className="order-card__meta-item">
            <FiCalendar size={13} />
            <span>{formatDate(order.createdAt)}</span>
          </div>
          <div className="order-card__meta-item">
            <FiPackage size={13} />
            <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="order-card__badges">
          <span className={`badge ${ORDER_STATUS_STYLE[order.orderStatus]}`}>
            {order.orderStatus}
          </span>
          <span className={`badge ${PAYMENT_STATUS_STYLE[order.paymentStatus]}`}>
            {order.paymentStatus}
          </span>
        </div>

        <div className="order-card__total">
          {formatCurrency(order.grandTotal)}
        </div>

        <button
          className="order-card__toggle"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
        </button>
      </div>

      {/* Thumbnail row (always visible) */}
      <div className="order-card__thumbs">
        {order.items.slice(0, 5).map((item, i) => (
          <div key={i} className="order-card__thumb-wrap">
            {item.image
              ? <img src={item.image} alt={item.title} className="order-card__thumb" />
              : <span className="order-card__thumb order-card__thumb--placeholder">🛍️</span>
            }
            {item.quantity > 1 && (
              <span className="order-card__thumb-qty">×{item.quantity}</span>
            )}
          </div>
        ))}
        {order.items.length > 5 && (
          <div className="order-card__thumb-more">+{order.items.length - 5}</div>
        )}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="order-card__detail">
          {/* Items */}
          <ul className="order-card__items">
            {order.items.map((item, i) => (
              <li key={i} className="order-card__item">
                <div className="order-card__item-img-wrap">
                  {item.image
                    ? <img src={item.image} alt={item.title} className="order-card__item-img" />
                    : <span className="order-card__item-img order-card__item-img--placeholder">🛍️</span>
                  }
                </div>
                <div className="order-card__item-info">
                  <span className="order-card__item-title">{item.title}</span>
                  <span className="order-card__item-sku">SKU: {item.sku}</span>
                </div>
                <div className="order-card__item-qty">×{item.quantity}</div>
                <div className="order-card__item-total">{formatCurrency(item.lineTotal)}</div>
              </li>
            ))}
          </ul>

          {/* Pricing + Shipping side by side */}
          <div className="order-card__bottom">
            <div className="order-card__shipping">
              <p className="order-card__section-label">
                <FiMapPin size={13} /> Shipping to
              </p>
              <p>{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.street}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
              <p>{order.shippingAddress.country}</p>
              <p className="order-card__shipping-method">
                <FiTruck size={13} /> {order.shippingMethod}
              </p>
            </div>

            <div className="order-card__pricing">
              <div className="order-card__price-row">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="order-card__price-row order-card__price-row--discount">
                  <span>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</span>
                  <span>–{formatCurrency(order.discountAmount)}</span>
                </div>
              )}
              <div className="order-card__price-row">
                <span>Shipping</span>
                <span>{order.shippingFee === 0 ? 'FREE' : formatCurrency(order.shippingFee)}</span>
              </div>
              <div className="order-card__price-row">
                <span>Tax</span>
                <span>{formatCurrency(order.taxAmount)}</span>
              </div>
              <div className="order-card__price-row order-card__price-row--total">
                <span>Total</span>
                <strong>{formatCurrency(order.grandTotal)}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function OrdersPage() {
  const { data: orders, isLoading, isError } = useMyOrders()

  return (
    <div className="container section">
      <div className="orders-page__header">
        <div>
          <h1 className="orders-page__title">My Orders</h1>
          <p className="orders-page__subtitle">Track and manage all your purchases</p>
        </div>
      </div>

      {isLoading && (
        <div className="orders-page__loading">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton orders-page__skeleton" />
          ))}
        </div>
      )}

      {isError && (
        <div className="orders-page__error">
          Failed to load orders. Please try again.
        </div>
      )}

      {!isLoading && !isError && (!orders || orders.length === 0) && (
        <div className="orders-page__empty">
          <div className="orders-page__empty-icon">
            <FiShoppingBag size={56} />
          </div>
          <h2 className="orders-page__empty-title">No orders yet</h2>
          <p className="orders-page__empty-text">
            You haven't placed any orders yet. Start shopping!
          </p>
          <Link to="/products" className="btn btn-primary btn-lg">
            Browse Products
          </Link>
        </div>
      )}

      {!isLoading && orders && orders.length > 0 && (
        <div className="orders-page__list">
          {orders.map((order) => (
            <OrderCard key={order._id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}
