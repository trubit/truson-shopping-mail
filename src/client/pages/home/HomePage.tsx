import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { APP_NAME } from '../../../shared/constants/index.js'

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section
        style={{
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
          color: 'var(--color-white)',
          padding: 'var(--space-24) 0',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ color: 'var(--color-white)', marginBottom: 'var(--space-4)' }}
          >
            Welcome to {APP_NAME}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ fontSize: 'var(--text-xl)', opacity: 0.9, marginBottom: 'var(--space-8)' }}
          >
            Discover thousands of products from trusted sellers
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <Link
              to="/products"
              className="btn btn-lg"
              style={{ background: 'var(--color-white)', color: 'var(--color-primary)' }}
            >
              Shop Now
            </Link>
            <Link
              to="/register"
              className="btn btn-lg btn-outline"
              style={{ borderColor: 'var(--color-white)', color: 'var(--color-white)' }}
            >
              Become a Seller
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="section">
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center' }}>
            <h2 className="section-title">Why TrusonShopp?</h2>
            <p className="section-subtitle">Everything you need in one place</p>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 'var(--space-6)',
            }}
          >
            {[
              { icon: '🛡️', title: 'Verified Sellers', desc: 'All sellers are verified for your safety' },
              { icon: '🚀', title: 'Fast Delivery', desc: 'Get your orders delivered quickly' },
              { icon: '↩️', title: 'Easy Returns', desc: '30-day hassle-free return policy' },
              { icon: '💳', title: 'Secure Payments', desc: 'Your payment info is always safe' },
            ].map(({ icon, title, desc }) => (
              <motion.div
                key={title}
                className="card hover-lift"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <div className="card-body" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-4)' }}>{icon}</div>
                  <h4 style={{ marginBottom: 'var(--space-2)' }}>{title}</h4>
                  <p style={{ color: 'var(--color-neutral-500)', fontSize: 'var(--text-sm)' }}>{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
