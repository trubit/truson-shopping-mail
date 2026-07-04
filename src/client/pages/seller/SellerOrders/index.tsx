import { useState }    from 'react'
import Row              from 'react-bootstrap/Row'
import Col              from 'react-bootstrap/Col'
import Modal            from 'react-bootstrap/Modal'
import Button           from 'react-bootstrap/Button'
import Form             from 'react-bootstrap/Form'
import Alert            from 'react-bootstrap/Alert'
import Badge            from 'react-bootstrap/Badge'
import { FiPackage, FiTruck } from 'react-icons/fi'
import { useSellerOrders, useUpdateOrderStatus } from '../../../hooks/useOrders.js'
import { OrderStatusBadge, PaymentStatusBadge }  from '../../../components/order/OrderStatus/index.js'
import { formatCurrency, formatDate }            from '../../../../shared/helpers/index.js'
import { ORDER_STATUS }                          from '../../../../shared/constants/index.js'
import type { IOrder, OrderStatus }              from '../../../../shared/types/index.js'

const SELLER_ALLOWED_STATUSES: OrderStatus[] = [
  ORDER_STATUS.PROCESSING, ORDER_STATUS.SHIPPED, ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.DELIVERED,
] as OrderStatus[]

interface StatusModalProps {
  order:  IOrder
  show:   boolean
  onHide: () => void
}

function StatusUpdateModal({ order, show, onHide }: StatusModalProps) {
  const [newStatus,      setNewStatus]      = useState<OrderStatus>(order.orderStatus as OrderStatus)
  const [trackingNumber, setTrackingNumber] = useState(order.tracking?.trackingNumber ?? '')
  const [carrier,        setCarrier]        = useState(order.tracking?.carrier ?? '')
  const [note,           setNote]           = useState('')

  const { mutate: updateStatus, isPending, error } = useUpdateOrderStatus()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateStatus(
      {
        orderId: order._id,
        orderStatus: newStatus,
        tracking: {
          trackingNumber: trackingNumber || undefined,
          carrier:        carrier        || undefined,
          note:           note           || undefined,
        },
      },
      { onSuccess: onHide },
    )
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Update Order #{order.orderNumber}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{(error as Error).message}</Alert>}
        <Form id="seller-status-form" onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="status-select">
            <Form.Label>New Status</Form.Label>
            <Form.Select value={newStatus} onChange={(e) => setNewStatus(e.target.value as OrderStatus)}>
              {SELLER_ALLOWED_STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3" controlId="carrier-input">
            <Form.Label>Carrier <span className="text-muted">(optional)</span></Form.Label>
            <Form.Control
              placeholder="e.g. UPS, FedEx, USPS"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="tracking-input">
            <Form.Label>Tracking Number <span className="text-muted">(optional)</span></Form.Label>
            <Form.Control
              placeholder="e.g. 1Z999AA1012345678"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
          </Form.Group>

          <Form.Group controlId="note-input">
            <Form.Label>Note <span className="text-muted">(optional)</span></Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="e.g. Package picked up from warehouse"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide} disabled={isPending}>Cancel</Button>
        <Button variant="primary" type="submit" form="seller-status-form" disabled={isPending}>
          {isPending ? 'Saving…' : 'Update Status'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default function SellerOrders() {
  const [page,         setPage]         = useState(1)
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [editingOrder, setEditingOrder] = useState<IOrder | null>(null)

  const { data, isLoading, isError } = useSellerOrders({ status: statusFilter, page, limit: 20 })
  const orders     = data?.orders      ?? []
  const totalPages = data?.pagination?.totalPages ?? 1

  return (
    <div className="container section seller-orders">
      <div className="seller-orders__header">
        <div>
          <h1 className="seller-orders__title">Order Management</h1>
          <p className="seller-orders__subtitle">Manage and fulfil orders for your products</p>
        </div>
      </div>

      {/* Filters */}
      <Row className="mb-4 g-2 align-items-center">
        <Col xs="auto">
          <Form.Select
            size="sm"
            value={statusFilter ?? ''}
            onChange={(e) => { setStatusFilter(e.target.value || undefined); setPage(1) }}
            style={{ minWidth: 180 }}
          >
            <option value="">All statuses</option>
            {Object.values(ORDER_STATUS).map((s) => (
              <option key={s} value={s}>{s.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}</option>
            ))}
          </Form.Select>
        </Col>
        <Col xs="auto" className="ms-auto">
          <Badge bg="secondary">
            {data?.pagination?.total ?? orders.length} order{(data?.pagination?.total ?? orders.length) !== 1 ? 's' : ''}
          </Badge>
        </Col>
      </Row>

      {isLoading && (
        <div className="d-flex flex-column gap-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 90 }} />)}
        </div>
      )}

      {isError && <Alert variant="danger">Failed to load orders.</Alert>}

      {!isLoading && !isError && orders.length === 0 && (
        <div className="seller-orders__empty">
          <FiPackage size={48} />
          <p>No orders found for your products yet.</p>
        </div>
      )}

      {!isLoading && orders.length > 0 && (
        <div className="seller-orders__table-wrap">
          <table className="seller-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>
                    <span className="seller-orders__order-num">#{order.orderNumber}</span>
                  </td>
                  <td style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>
                    {formatDate(order.createdAt)}
                  </td>
                  <td style={{ fontSize: 'var(--text-sm)' }}>
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </td>
                  <td style={{ fontWeight: 700 }}>{formatCurrency(order.grandTotal)}</td>
                  <td><OrderStatusBadge status={order.orderStatus} showIcon size="sm" /></td>
                  <td><PaymentStatusBadge status={order.paymentStatus} size="sm" /></td>
                  <td>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => setEditingOrder(order)}
                        title="Update status"
                      >
                        <FiTruck size={13} /> Update
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <nav className="pagination mt-3">
          <button className="pagination__btn" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`pagination__btn${p === page ? ' pagination__btn--active' : ''}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button className="pagination__btn" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>›</button>
        </nav>
      )}

      {editingOrder && (
        <StatusUpdateModal
          order={editingOrder}
          show={true}
          onHide={() => setEditingOrder(null)}
        />
      )}
    </div>
  )
}
