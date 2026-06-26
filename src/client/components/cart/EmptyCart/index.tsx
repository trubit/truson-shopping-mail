import { Link } from 'react-router-dom'
import { FiShoppingBag } from 'react-icons/fi'

export default function EmptyCart() {
  return (
    <div className="empty-cart">
      <div className="empty-cart__icon">
        <FiShoppingBag size={64} strokeWidth={1.2} />
      </div>

      <h2 className="empty-cart__title">Your cart is empty</h2>
      <p className="empty-cart__subtitle">
        Looks like you haven&apos;t added anything yet. Start exploring our store!
      </p>

      <div className="empty-cart__actions">
        <Link to="/products" className="btn btn-primary btn-lg empty-cart__cta">
          Browse Products
        </Link>
        <Link to="/" className="btn btn-outline">
          Go to Homepage
        </Link>
      </div>
    </div>
  )
}
