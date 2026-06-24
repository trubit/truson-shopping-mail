import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiArrowRight, FiShoppingBag, FiTruck, FiRefreshCw, FiShield } from 'react-icons/fi'
import { useFeaturedProducts } from '../../hooks/useProducts.js'
import ProductCarousel from '../../components/product/ProductCarousel/index.js'
import ProductSearch from '../../components/product/ProductSearch/index.js'
import QuickViewModal from '../../components/product/QuickViewModal/index.js'
import { PRODUCT_CATEGORIES } from '../../../shared/constants/index.js'
import { APP_NAME } from '../../../shared/constants/index.js'
import type { IProduct } from '../../../shared/types/product.types.js'

const CATEGORY_ICONS: Record<string, string> = {
  'Electronics': '💻', 'Clothing & Fashion': '👗', 'Home & Garden': '🏡',
  'Sports & Outdoors': '⚽', 'Books & Media': '📚', 'Health & Beauty': '💄',
  'Toys & Games': '🎮', 'Automotive': '🚗', 'Food & Grocery': '🛒', 'Jewelry & Accessories': '💍',
}

const PERKS = [
  { icon: <FiShieldSafe />, title: 'Verified Sellers', desc: 'Every seller is verified for safety' },
  { icon: <FiTruck />, title: 'Fast Delivery', desc: 'Get orders delivered quickly' },
  { icon: <FiRefreshCw />, title: 'Easy Returns', desc: '30-day hassle-free returns' },
  { icon: <FiShield />, title: 'Secure Payments', desc: 'End-to-end encrypted checkout' },
]

function FiShieldSafe() { return <FiShield /> }

export default function HomePage() {
  const { data: featured = [], isLoading } = useFeaturedProducts(16)
  const [quickViewProduct, setQuickViewProduct] = useState<IProduct | null>(null)

  return (
    <>
      {/* ── Hero ─────────────────────────────────── */}
      <section className="hero-banner">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-7">
              <motion.span
                className="hero-banner__tagline"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                Trusted · Fast · Secure
              </motion.span>

              <motion.h1
                className="hero-banner__title"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Shop Smarter at<br />
                <span className="hero-banner__accent">{APP_NAME}</span>
              </motion.h1>

              <motion.p
                className="hero-banner__subtitle"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Discover thousands of products from verified sellers. Great deals, fast delivery, easy returns.
              </motion.p>

              {/* Search */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                style={{ maxWidth: 520, marginBottom: '1.5rem' }}
              >
                <ProductSearch placeholder="Search for products, brands, categories…" />
              </motion.div>

              <motion.div
                className="hero-banner__actions"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
              >
                <Link to="/products" className="hero-btn-primary">
                  <FiShoppingBag size={18} />
                  Shop Now
                </Link>
                <Link to="/register" className="hero-btn-secondary">
                  Become a Seller <FiArrowRight size={16} />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Category Chips ───────────────────────── */}
      <section style={{ background: 'var(--color-white)', borderBottom: '1px solid var(--color-neutral-200)', padding: '1rem 0' }}>
        <div className="container">
          <div className="category-chips">
            {PRODUCT_CATEGORIES.map((cat) => (
              <Link
                key={cat}
                to={`/category/${encodeURIComponent(cat)}`}
                className="category-chip"
              >
                {CATEGORY_ICONS[cat]} {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products Carousel ───────────── */}
      {(isLoading || featured.length > 0) && (
        <section className="section">
          <div className="container">
            <div className="section-hd">
              <div>
                <div className="section-hd__label">Top Picks</div>
                <h2 className="section-hd__title">Featured Products</h2>
              </div>
              <Link to="/products?isFeatured=true" className="section-hd__link">
                View all <FiArrowRight size={14} />
              </Link>
            </div>

            {isLoading ? (
              <div className="products-skeleton" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1.25rem' }}>
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="skeleton-card">
                    <div className="skeleton-img" />
                    <div className="skeleton-line" style={{ width: '50%' }} />
                    <div className="skeleton-line skeleton-line--med" />
                  </div>
                ))}
              </div>
            ) : (
              <ProductCarousel
                products={featured}
                onQuickView={setQuickViewProduct}
              />
            )}
          </div>
        </section>
      )}

      {/* ── Category Grid ────────────────────────── */}
      <section className="section" style={{ background: 'var(--color-neutral-50)' }}>
        <div className="container">
          <div className="section-hd">
            <div>
              <div className="section-hd__label">Browse</div>
              <h2 className="section-hd__title">Shop by Category</h2>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '1rem',
            }}
          >
            {PRODUCT_CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                <Link
                  to={`/category/${encodeURIComponent(cat)}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    className="card hover-lift"
                    style={{
                      textAlign: 'center',
                      padding: '1.5rem 0.75rem',
                      cursor: 'pointer',
                      border: '1px solid var(--color-neutral-200)',
                    }}
                  >
                    <div style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>
                      {CATEGORY_ICONS[cat]}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-brand-text)' }}>
                      {cat}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Perks ────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {PERKS.map(({ icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  padding: '1.25rem',
                  background: 'var(--color-white)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--color-neutral-200)',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 'var(--radius-lg)',
                    background: 'rgba(255,153,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-brand-accent)',
                    flexShrink: 0,
                    fontSize: '1.25rem',
                  }}
                >
                  {icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quick View Modal ─────────────────────── */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </>
  )
}
