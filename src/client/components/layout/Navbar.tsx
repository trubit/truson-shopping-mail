import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore.js'
import { useCartStore } from '../../store/cartStore.js'
import { APP_NAME } from '../../../shared/constants/index.js'

export default function Navbar() {
  const { isAuthenticated, user, clearAuth } = useAuthStore()
  const totalItems = useCartStore((s) => s.totalItems)
  const navigate = useNavigate()

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-sticky)',
        background: 'var(--color-white)',
        borderBottom: '1px solid var(--color-neutral-200)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <nav className="container flex-between" style={{ height: 64 }}>
        {/* Logo */}
        <Link
          to="/"
          style={{
            fontWeight: 'var(--font-extrabold)',
            fontSize: 'var(--text-xl)',
            color: 'var(--color-primary)',
          }}
        >
          {APP_NAME}
        </Link>

        {/* Desktop Nav */}
        <div className="desktop-only" style={{ gap: 'var(--space-6)', alignItems: 'center' }}>
          <Link to="/products" className="btn btn-ghost">Products</Link>
        </div>

        {/* Actions */}
        <div className="flex" style={{ alignItems: 'center', gap: 'var(--space-3)' }}>
          <Link to="/cart" className="btn btn-ghost" style={{ position: 'relative' }}>
            Cart
            {totalItems > 0 && (
              <span
                className="badge badge-primary"
                style={{ position: 'absolute', top: -6, right: -6 }}
              >
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <>
              <Link to="/profile" className="btn btn-ghost">{user?.name}</Link>
              <button className="btn btn-outline" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Login</Link>
              <Link to="/register" className="btn btn-primary">Sign Up</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
