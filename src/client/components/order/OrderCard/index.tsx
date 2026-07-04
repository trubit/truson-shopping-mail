import { useState }             from 'react'
import { Link }                 from 'react-router-dom'
import Card                     from 'react-bootstrap/Card'
import Badge                    from 'react-bootstrap/Badge'
import Button                   from 'react-bootstrap/Button'
import { FiPackage, FiMapPin, FiRefreshCw, FiXCircle, FiEye } from 'react-icons/fi'
import { formatCurrency, formatDate }                         from '../../../../shared/helpers/index.js'
import {
  CANCELLABLE_STATUSES,
  RETURNABLE_STATUSES,
  RETURN_WINDOW_DAYS,
} from '../../../../shared/constants/index.js'
import { OrderStatusBadge, PaymentStatusBadge } from '../OrderStatus/index.js'
import { useCancelOrder }                        from '../../../hooks/useOrders.js'
import ReturnRequestForm                         from '../ReturnRequestForm/index.js'
import type { IOrder }                           from '../../../../shared/types/index.js'

interface OrderCardProps {
  order: IOrder
}

function isWithinReturnWindow(createdAt: string): boolean {
  const diffMs   = Date.now() - new Date(createdAt).getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return diffDays <= RETURN_WINDOW_DAYS
}

export default function OrderCard({ order }: OrderCardProps) {
  const [showReturn, setShowReturn] = useState(false)
  const { mutate: cancelOrder, isPending: cancelling } = useCancelOrder()

  const canCancel = (CANCELLABLE_STATUSES as readonly string[]).includes(order.orderStatus)
  const canReturn =
    (RETURNABLE_STATUSES as readonly string[]).includes(order.orderStatus) &&
    isWithinReturnWindow(order.createdAt) &&
    !order.returnRequest

  const previewItem = order.items[0]
  const extraCount  = order.items.length - 1

  const handleCancel = () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return
    cancelOrder({ orderId: order._id })
  }

  return (
    <>
      <Card className="order-card mb-3">
        <Card.Header className="order-card__header">
          <div className="order-card__meta">
            <span className="order-card__number">#{order.orderNumber}</span>
            <span className="order-card__date">{formatDate(order.createdAt)}</span>
          </div>
          <div className="order-card__badges">
            <OrderStatusBadge status={order.orderStatus} showIcon />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
        </Card.Header>

        <Card.Body className="order-card__body">
          <div className="order-card__preview">
            {previewItem?.image && (
              <img
                src={previewItem.image}
                alt={previewItem.title}
                className="order-card__img"
                loading="lazy"
              />
            )}
            <div className="order-card__preview-info">
              <p className="order-card__item-title">{previewItem?.title}</p>
              {(previewItem?.selectedSize || previewItem?.selectedColor) && (
                <p className="order-card__item-variants">
                  {previewItem.selectedSize  && <span>Size: {previewItem.selectedSize}</span>}
                  {previewItem.selectedColor && <span>Color: {previewItem.selectedColor}</span>}
                </p>
              )}
              {extraCount > 0 && (
                <Badge bg="secondary" className="order-card__extra">
                  +{extraCount} more item{extraCount > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>

          <div className="order-card__footer">
            <span className="order-card__total">{formatCurrency(order.grandTotal)}</span>
            <div className="order-card__actions">
              <Link
                to={`/orders/${order._id}`}
                className="btn btn-outline-primary btn-sm"
              >
                <FiEye size={13} className="me-1" /> Details
              </Link>

              {order.orderStatus !== 'pending' && order.orderStatus !== 'confirmed' && (
                <Link
                  to={`/orders/${order._id}/track`}
                  className="btn btn-outline-secondary btn-sm"
                >
                  <FiMapPin size={13} className="me-1" /> Track
                </Link>
              )}

              {canReturn && (
                <Button
                  variant="outline-warning"
                  size="sm"
                  onClick={() => setShowReturn(true)}
                >
                  <FiRefreshCw size={13} className="me-1" /> Return
                </Button>
              )}

              {canCancel && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={handleCancel}
                  disabled={cancelling}
                >
                  <FiXCircle size={13} className="me-1" /> {cancelling ? 'Cancelling…' : 'Cancel'}
                </Button>
              )}

              {order.orderStatus === 'delivered' && (
                <Link
                  to={`/products/${order.items[0]?.productId}?review=1`}
                  className="btn btn-outline-success btn-sm"
                >
                  <FiPackage size={13} className="me-1" /> Review
                </Link>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>

      <ReturnRequestForm
        orderId={order._id}
        show={showReturn}
        onHide={() => setShowReturn(false)}
      />
    </>
  )
}
