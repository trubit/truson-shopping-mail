import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useCategoryProducts } from '../../hooks/useProducts.js'
import { useProductStore } from '../../store/productStore.js'
import ProductGrid from '../../components/product/ProductGrid/index.js'
import ProductFilter from '../../components/product/ProductFilter/index.js'
import QuickViewModal from '../../components/product/QuickViewModal/index.js'
import { PRODUCT_CATEGORIES } from '../../../shared/constants/index.js'
import type { IProduct } from '../../../shared/types/product.types.js'

const CATEGORY_ICONS: Record<string, string> = {
  'Electronics': '💻', 'Clothing & Fashion': '👗', 'Home & Garden': '🏡',
  'Sports & Outdoors': '⚽', 'Books & Media': '📚', 'Health & Beauty': '💄',
  'Toys & Games': '🎮', 'Automotive': '🚗', 'Food & Grocery': '🛒', 'Jewelry & Accessories': '💍',
}

export default function CategoryPage() {
  const { category = '' }       = useParams<{ category: string }>()
  const cat                     = decodeURIComponent(category)
  const { filters, setFilters } = useProductStore()
  const { data, isLoading }     = useCategoryProducts(cat, filters)
  const [quickView, setQuickView] = useState<IProduct | null>(null)

  const products   = data?.data ?? []
  const pagination = data?.pagination

  const isValidCategory = PRODUCT_CATEGORIES.includes(cat as typeof PRODUCT_CATEGORIES[number])

  if (!isValidCategory) {
    return (
      <div className="container section" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
        <div style={{ fontSize: '3rem' }}>🔍</div>
        <h2>Category not found</h2>
        <Link to="/products" style={{ color: 'var(--color-brand-accent)' }}>Browse all products</Link>
      </div>
    )
  }

  const handlePage = (page: number) => {
    setFilters({ page })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div>
      {/* Category Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)',
          padding: '3rem 0',
          color: 'var(--color-white)',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>{CATEGORY_ICONS[cat]}</div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-white)' }}>
            {cat}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'var(--text-sm)' }}>
            <Link to="/" style={{ color: 'inherit' }}>Home</Link> /{' '}
            <Link to="/products" style={{ color: 'inherit' }}>Products</Link> /{' '}
            <span>{cat}</span>
          </p>
        </div>
      </div>

      {/* Other Categories chips */}
      <div style={{ background: 'var(--color-white)', borderBottom: '1px solid var(--color-neutral-200)', padding: '0.875rem 0', overflowX: 'auto' }}>
        <div className="container">
          <div className="category-chips">
            {PRODUCT_CATEGORIES.filter((c) => c !== cat).map((c) => (
              <Link key={c} to={`/category/${encodeURIComponent(c)}`} className="category-chip">
                {CATEGORY_ICONS[c]} {c}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="container section">
        <div className="products-layout">
          <div className="hide-mobile">
            <ProductFilter />
          </div>

          <div>
            <div className="products-main__header">
              <span className="products-main__count">
                {isLoading ? 'Loading…' : `${pagination?.total ?? 0} products in ${cat}`}
              </span>
              <div className="products-main__sort">
                <span style={{ color: 'var(--color-neutral-500)', fontSize: 'var(--text-sm)' }}>Sort:</span>
                <select value={filters.sort ?? 'newest'} onChange={(e) => setFilters({ sort: e.target.value as typeof filters.sort })}>
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price ↑</option>
                  <option value="price_desc">Price ↓</option>
                  <option value="rating">Top Rated</option>
                  <option value="popular">Popular</option>
                </select>
              </div>
            </div>

            <ProductGrid
              products={products}
              cols={3}
              isLoading={isLoading}
              isEmpty={!isLoading && products.length === 0}
              onQuickView={setQuickView}
            />

            {(pagination?.totalPages ?? 0) > 1 && (
              <nav className="pagination">
                <button className="pagination__btn" onClick={() => handlePage((filters.page ?? 1) - 1)} disabled={!pagination?.hasPrev}>‹</button>
                {Array.from({ length: pagination?.totalPages ?? 0 }, (_, i) => i + 1).map((p) => (
                  <button key={p} className={`pagination__btn${p === (filters.page ?? 1) ? ' pagination__btn--active' : ''}`} onClick={() => handlePage(p)}>{p}</button>
                ))}
                <button className="pagination__btn" onClick={() => handlePage((filters.page ?? 1) + 1)} disabled={!pagination?.hasNext}>›</button>
              </nav>
            )}
          </div>
        </div>
      </div>

      {quickView && <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />}
    </div>
  )
}
