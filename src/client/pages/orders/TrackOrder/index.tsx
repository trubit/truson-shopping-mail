import { useParams, Link } from 'react-router-dom'
import Alert               from 'react-bootstrap/Alert'
import Button              from 'react-bootstrap/Button'
import { FiArrowLeft }     from 'react-icons/fi'
import { useTrackOrder, useOrder } from '../../../hooks/useOrders.js'
import OrderTimeline       from '../../../components/order/OrderTimeline/index.js'
import TrackingInfo        from '../../../components/order/TrackingInfo/index.js'
import { OrderStatusBadge } from '../../../components/order/OrderStatus/index.js'
import { formatDate }      from '../../../../shared/helpers/index.js'

export default function TrackOrder() {
  const { id } = useParams<{ id: string }>()

  // trackData = { orderNumber, orderStatus, shippingMethod, tracking: IOrderTracking, createdAt, updatedAt }
  const { data: trackData, isLoading: trackLoading, isError: trackError } = useTrackOrder(id ?? '')
  const { data: order,     isLoading: orderLoading }                      = useOrder(id ?? '')

  const isLoading = trackLoading || orderLoading

  if (isLoading) {
    return (
      <div className="container section">
        {[1, 2].map((i) => <div key={i} className="skeleton mb-3" style={{ height: 140 }} />)}
      </div>
    )
  }

  if (trackError || !trackData) {
    return (
      <div className="container section">
        <Alert variant="danger">Could not load tracking information.</Alert>
        <Link to="/orders" className="btn btn-outline-secondary btn-sm mt-2">
          <FiArrowLeft size={14} className="me-1" /> Back to Orders
        </Link>
      </div>
    )
  }

  // The tracking sub-object (carrier, trackingNumber, events, etc.)
  const trackingInfo = trackData.tracking ?? { events: [] }

  return (
    <div className="container section track-order">
      <div className="track-order__header">
        <Link to={`/orders/${id}`} className="btn btn-link p-0 track-order__back">
          <FiArrowLeft size={14} className="me-1" /> Order Details
        </Link>

        <div className="track-order__title-block">
          <h1 className="track-order__title">
            Track Order {order?.orderNumber ? `#${order.orderNumber}` : ''}
          </h1>
          {order && (
            <div className="track-order__meta">
              <OrderStatusBadge status={order.orderStatus} showIcon />
              <span className="track-order__date">
                Placed {formatDate(order.createdAt)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="track-order__content">
        {/* Carrier & tracking number panel */}
        <div className="track-order__card">
          <TrackingInfo tracking={trackingInfo} shippingMethod={trackData.shippingMethod} />
        </div>

        {/* Timeline — uses real events from tracking sub-object */}
        {order && (
          <div className="track-order__card">
            <OrderTimeline
              events={trackingInfo.events ?? []}
              orderStatus={order.orderStatus}
            />
          </div>
        )}
      </div>
    </div>
  )
}
