import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiSearch, FiX } from 'react-icons/fi'

interface ProductSearchProps {
  defaultValue?: string
  placeholder?: string
  onSearch?: (q: string) => void
}

export default function ProductSearch({
  defaultValue = '',
  placeholder = 'Search products…',
  onSearch,
}: ProductSearchProps) {
  const [value, setValue] = useState(defaultValue)
  const inputRef = useNavigate ? useRef<HTMLInputElement>(null) : useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = value.trim()
    if (!q) return
    if (onSearch) {
      onSearch(q)
    } else {
      navigate(`/search?q=${encodeURIComponent(q)}`)
    }
  }

  const handleClear = () => {
    setValue('')
    inputRef.current?.focus()
    onSearch?.('')
  }

  return (
    <form className="product-search" onSubmit={handleSubmit} role="search">
      <input
        ref={inputRef}
        type="search"
        className="product-search__input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Search products"
        autoComplete="off"
      />

      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          style={{
            background: 'none',
            border: 'none',
            padding: '0 0.5rem',
            cursor: 'pointer',
            color: 'var(--color-neutral-400)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <FiX size={16} />
        </button>
      )}

      <button type="submit" className="product-search__btn" aria-label="Search">
        <FiSearch size={18} />
      </button>
    </form>
  )
}
