import { useState }   from 'react'
import { Link }        from 'react-router-dom'
import Form            from 'react-bootstrap/Form'
import { FiShoppingBag } from 'react-icons/fi'
import { useMyOrders } from '../../hooks/useOrders.js'
import OrderCard       from '../../components/order/OrderCard/index.js'
import { ORDER_STATUS } from '../../../shared/constants/index.js'

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [page,         setPage]         = useState(1)

  const { data, isLoading, isError } = useMyOrders({ status: statusFilter, page, limit: 10 })

  const orders     = data?.orders      ?? []
  const totalPages = data?.pagination?.totalPages ?? 1

  return (
    <div className="container section">
      <div className="orders-page__header">
        <div>
          <h1 className="orders-page__title">My Orders</h1>
          <p className="orders-page__subtitle">Track and manage all your purchases</p>
        </div>
        <Form.Select
          size="sm"
          value={statusFilter ?? ''}
          onChange={(e) => { setStatusFilter(e.target.value || undefined); setPage(1) }}
          style={{ width: 'auto', minWidth: 160 }}
        >
          <option value="">All statuses</option>
          {Object.values(ORDER_STATUS).map((s) => (
            <option key={s} value={s}>
              {s.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}
            </option>
          ))}
        </Form.Select>
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

      {!isLoading && !isError && orders.length === 0 && (
        <div className="orders-page__empty">
          <div className="orders-page__empty-icon">
            <FiShoppingBag size={56} />
          </div>
          <h2 className="orders-page__empty-title">No orders yet</h2>
          <p className="orders-page__empty-text">
            {statusFilter
              ? `No orders with status "${statusFilter}".`
              : "You haven't placed any orders yet. Start shopping!"}
          </p>
          <Link to="/products" className="btn btn-primary btn-lg">
            Browse Products
          </Link>
        </div>
      )}

      {!isLoading && orders.length > 0 && (
        <>
          <div className="orders-page__list">
            {orders.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="pagination mt-4">
              <button
                className="pagination__btn"
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`pagination__btn${p === page ? ' pagination__btn--active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="pagination__btn"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
              >
                ›
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  )
}
