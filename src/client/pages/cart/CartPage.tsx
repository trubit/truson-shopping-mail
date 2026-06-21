import { useCartStore } from '../../store/cartStore.js'
import { formatCurrency } from '../../../shared/helpers/index.js'
import { Link } from 'react-router-dom'

export default function CartPage() {
  const { items, totalPrice, totalItems, removeItem, updateQuantity } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="container section" style={{ textAlign: 'center' }}>
        <h2>Your cart is empty</h2>
        <p style={{ color: 'var(--color-neutral-500)', marginBottom: 'var(--space-6)' }}>
          Add some products to get started
        </p>
        <Link to="/products" className="btn btn-primary btn-lg">Browse Products</Link>
      </div>
    )
  }

  return (
    <div className="container section">
      <h2 style={{ marginBottom: 'var(--space-6)' }}>Shopping Cart ({totalItems} items)</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-6)', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {items.map(({ product, quantity }) => (
            <div key={product._id} className="card">
              <div className="card-body flex-between">
                <div>
                  <h5>{product.name}</h5>
                  <p style={{ color: 'var(--color-neutral-500)', fontSize: 'var(--text-sm)' }}>
                    {formatCurrency(product.price)} each
                  </p>
                </div>
                <div className="flex" style={{ alignItems: 'center', gap: 'var(--space-3)' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => updateQuantity(product._id, quantity - 1)}>−</button>
                  <span style={{ minWidth: 24, textAlign: 'center' }}>{quantity}</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => updateQuantity(product._id, quantity + 1)}>+</button>
                  <button className="btn btn-danger btn-sm" onClick={() => removeItem(product._id)}>Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ position: 'sticky', top: 80 }}>
          <div className="card-body">
            <h4 style={{ marginBottom: 'var(--space-4)' }}>Order Summary</h4>
            <div className="flex-between" style={{ marginBottom: 'var(--space-2)' }}>
              <span>Subtotal</span>
              <strong>{formatCurrency(totalPrice)}</strong>
            </div>
            <div className="divider" />
            <button className="btn btn-primary btn-lg" style={{ width: '100%', marginBottom: 'var(--space-3)' }}>
              Checkout
            </button>
            <Link to="/products" className="btn btn-ghost" style={{ width: '100%', textAlign: 'center' }}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
