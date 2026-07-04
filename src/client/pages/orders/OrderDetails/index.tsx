import { useState }      from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Row              from 'react-bootstrap/Row'
import Col              from 'react-bootstrap/Col'
import Button           from 'react-bootstrap/Button'
import Alert            from 'react-bootstrap/Alert'
import { FiArrowLeft, FiMapPin, FiRefreshCw, FiXCircle } from 'react-icons/fi'
import { useOrder, useCancelOrder }         from '../../../hooks/useOrders.js'
import { OrderStatusBadge, PaymentStatusBadge } from '../../../components/order/OrderStatus/index.js'
import OrderTimeline    from '../../../components/order/OrderTimeline/index.js'
import TrackingInfo     from '../../../components/order/TrackingInfo/index.js'
import OrderSummary     from '../../../components/order/OrderSummary/index.js'
import ReturnRequestForm from '../../../components/order/ReturnRequestForm/index.js'
import { formatCurrency, formatDate }       from '../../../../shared/helpers/index.js'
import { CANCELLABLE_STATUSES, RETURNABLE_STATUSES, RETURN_WINDOW_DAYS } from '../../../../shared/constants/index.js'

function isWithinReturnWindow(createdAt: string) {
  return (Date.now() - new Date(createdAt).getTime()) / 86_400_000 <= RETURN_WINDOW_DAYS
}

export default function OrderDetails() {
  const { id }    = useParams<{ id: string }>()
  const navigate  = useNavigate()
  const [showReturn, setShowReturn] = useState(false)

  const { data: order, isLoading, isError } = useOrder(id ?? '')
  const { mutate: cancelOrder, isPending: cancelling, error: cancelError } = useCancelOrder()

  if (isLoading) {
    return (
      <div className="container section">
        <div className="order-details__skeleton">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton mb-3" style={{ height: 120 }} />)}
        </div>
      </div>
    )
  }

  if (isError || !order) {
    return (
      <div className="container section">
        <Alert variant="danger">Order not found or failed to load.</Alert>
        <Link to="/orders" className="btn btn-outline-secondary mt-2">
          <FiArrowLeft size={14} className="me-1" /> Back to Orders
        </Link>
      </div>
    )
  }

  const canCancel = (CANCELLABLE_STATUSES as readonly string[]).includes(order.orderStatus)
  const canReturn =
    (RETURNABLE_STATUSES as readonly string[]).includes(order.orderStatus) &&
    isWithinReturnWindow(order.createdAt) &&
    !order.returnRequest

  const handleCancel = () => {
    if (!window.confirm('Cancel this order?')) return
    cancelOrder({ orderId: order._id }, { onSuccess: () => navigate('/orders') })
  }

  return (
    <div className="container section order-details">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="order-details__header">
        <div className="order-details__back">
          <Button variant="link" className="p-0" onClick={() => navigate(-1)}>
            <FiArrowLeft size={14} className="me-1" />Back
          </Button>
        </div>
        <div className="order-details__title-block">
          <h1 className="order-details__title">Order #{order.orderNumber}</h1>
          <span className="order-details__date">{formatDate(order.createdAt, { dateStyle: 'long' })}</span>
        </div>
        <div className="order-details__header-badges">
          <OrderStatusBadge status={order.orderStatus} showIcon />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
        <div className="order-details__header-actions">
          {canCancel && (
            <Button variant="outline-danger" size="sm" onClick={handleCancel} disabled={cancelling}>
              <FiXCircle size={13} className="me-1" /> {cancelling ? 'Cancelling…' : 'Cancel Order'}
            </Button>
          )}
          {canReturn && (
            <Button variant="outline-warning" size="sm" onClick={() => setShowReturn(true)}>
              <FiRefreshCw size={13} className="me-1" /> Request Return
            </Button>
          )}
          <Link
            to={`/orders/${order._id}/track`}
            className="btn btn-outline-primary btn-sm"
          >
            <FiMapPin size={13} className="me-1" /> Track
          </Link>
        </div>
      </div>

      {cancelError && (
        <Alert variant="danger" className="mb-3">
          {(cancelError as any)?.response?.data?.message ?? (cancelError as Error)?.message ?? 'Failed to cancel order'}
        </Alert>
      )}

      <Row className="g-4">
        {/* ── Left column ──────────────────────────────── */}
        <Col lg={8}>
          {/* Timeline */}
          <div className="order-details__section">
            <OrderTimeline
              events={order.tracking?.events ?? []}
              orderStatus={order.orderStatus}
            />
          </div>

          {/* Items */}
          <div className="order-details__section">
            <h3 className="order-details__section-title">Items ({order.items.length})</h3>
            <ul className="order-details__items">
              {order.items.map((item, i) => (
                <li key={i} className="order-details__item">
                  {item.image && (
                    <img src={item.image} alt={item.title} className="order-details__item-img" />
                  )}
                  <div className="order-details__item-info">
                    <Link to={`/products/${item.productId}`} className="order-details__item-title">
                      {item.title}
                    </Link>
                    <div className="order-details__item-meta">
                      <span>SKU: {item.sku}</span>
                      {item.selectedSize  && <span>Size: {item.selectedSize}</span>}
                      {item.selectedColor && <span>Color: {item.selectedColor}</span>}
                    </div>
                  </div>
                  <div className="order-details__item-qty">×{item.quantity}</div>
                  <div className="order-details__item-total">{formatCurrency(item.lineTotal)}</div>
                </li>
              ))}
            </ul>
          </div>

          {/* Shipping address */}
          <div className="order-details__section order-details__address-box">
            <h3 className="order-details__section-title">
              <FiMapPin size={14} className="me-1" /> Shipping Address
            </h3>
            <p>{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.street}</p>
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
            <p>{order.shippingAddress.country}</p>
            <p className="order-details__address-phone">{order.shippingAddress.phone}</p>
          </div>

          {/* Return request status (if any) */}
          {order.returnRequest && (
            <div className="order-details__section">
              <h3 className="order-details__section-title">Return Request</h3>
              <div className="order-details__return-info">
                <div className="order-details__return-row">
                  <span>Status</span>
                  <span className={`badge badge-${order.returnRequest.status === 'approved' ? 'success' : order.returnRequest.status === 'rejected' ? 'danger' : 'warning'}`}>
                    {order.returnRequest.status}
                  </span>
                </div>
                <div className="order-details__return-row">
                  <span>Reason</span>
                  <span>{order.returnRequest.reason.replace(/_/g, ' ')}</span>
                </div>
                {order.returnRequest.description && (
                  <div className="order-details__return-row">
                    <span>Details</span>
                    <span>{order.returnRequest.description}</span>
                  </div>
                )}
                <div className="order-details__return-row">
                  <span>Requested</span>
                  <span>{formatDate(order.returnRequest.requestedAt)}</span>
                </div>
                {order.returnRequest.refundAmount && (
                  <div className="order-details__return-row">
                    <span>Refund Amount</span>
                    <strong>{formatCurrency(order.returnRequest.refundAmount)}</strong>
                  </div>
                )}
              </div>
            </div>
          )}
        </Col>

        {/* ── Right column ─────────────────────────────── */}
        <Col lg={4}>
          <div className="order-details__sidebar">
            {/* Tracking info */}
            {order.tracking && (
              <div className="order-details__section">
                <TrackingInfo tracking={order.tracking} shippingMethod={order.shippingMethod} />
              </div>
            )}

            {/* Price summary */}
            <div className="order-details__section">
              <OrderSummary order={order} />
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="order-details__section">
                <h3 className="order-details__section-title">Order Notes</h3>
                <p className="order-details__notes">{order.notes}</p>
              </div>
            )}
          </div>
        </Col>
      </Row>

      <ReturnRequestForm
        orderId={order._id}
        show={showReturn}
        onHide={() => setShowReturn(false)}
      />
    </div>
  )
}
