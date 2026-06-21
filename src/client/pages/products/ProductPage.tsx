import { useParams } from 'react-router-dom'

export default function ProductPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <div className="container section">
      <h2>Product Detail</h2>
      <p style={{ color: 'var(--color-neutral-500)' }}>Product ID: {id} — coming in Phase 2</p>
    </div>
  )
}
