import { Link } from 'react-router-dom'
import { APP_NAME } from '../../../shared/constants/index.js'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer
      style={{
        background: 'var(--color-neutral-900)',
        color: 'var(--color-neutral-400)',
        padding: 'var(--space-12) 0 var(--space-6)',
        marginTop: 'auto',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-8)',
            marginBottom: 'var(--space-8)',
          }}
        >
          <div>
            <h3 style={{ color: 'var(--color-white)', fontSize: 'var(--text-lg)', marginBottom: 'var(--space-3)' }}>
              {APP_NAME}
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-relaxed)' }}>
              Your trusted marketplace for quality products from verified sellers.
            </p>
          </div>

          <div>
            <h4 style={{ color: 'var(--color-white)', marginBottom: 'var(--space-3)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
              Shop
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {['Products', 'Categories', 'Deals', 'New Arrivals'].map((l) => (
                <li key={l}>
                  <Link to="/products" style={{ color: 'var(--color-neutral-400)', fontSize: 'var(--text-sm)' }}>
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{ color: 'var(--color-white)', marginBottom: 'var(--space-3)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
              Account
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {[{ label: 'Login', to: '/login' }, { label: 'Register', to: '/register' }, { label: 'Orders', to: '/orders' }, { label: 'Profile', to: '/profile' }].map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} style={{ color: 'var(--color-neutral-400)', fontSize: 'var(--text-sm)' }}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          className="divider"
          style={{ borderColor: 'var(--color-neutral-700)', background: 'var(--color-neutral-700)' }}
        />

        <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', marginTop: 'var(--space-4)' }}>
          &copy; {year} {APP_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
