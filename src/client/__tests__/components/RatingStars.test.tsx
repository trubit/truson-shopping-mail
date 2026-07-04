import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RatingStars from '../../components/product/RatingStars/index.js'

describe('RatingStars', () => {
  it('renders 5 stars by default', () => {
    render(<RatingStars value={3} />)
    expect(document.querySelectorAll('.rating-stars__star')).toHaveLength(5)
  })

  it('fills the correct number of stars for a whole rating', () => {
    render(<RatingStars value={4} />)
    expect(document.querySelectorAll('.rating-stars__star--filled')).toHaveLength(4)
  })

  it('marks a half star for fractional ratings', () => {
    render(<RatingStars value={2.5} />)
    expect(document.querySelectorAll('.rating-stars__star--half')).toHaveLength(1)
    expect(document.querySelectorAll('.rating-stars__star--filled')).toHaveLength(2)
  })

  it('shows no filled stars for rating of 0', () => {
    render(<RatingStars value={0} />)
    expect(document.querySelectorAll('.rating-stars__star--filled')).toHaveLength(0)
    expect(document.querySelectorAll('.rating-stars__star--half')).toHaveLength(0)
  })

  it('fills all stars for max rating', () => {
    render(<RatingStars value={5} />)
    expect(document.querySelectorAll('.rating-stars__star--filled')).toHaveLength(5)
    expect(document.querySelectorAll('.rating-stars__star--half')).toHaveLength(0)
  })

  it('renders custom max stars', () => {
    render(<RatingStars value={2} max={3} />)
    expect(document.querySelectorAll('.rating-stars__star')).toHaveLength(3)
  })

  it('shows value text when showValue is true', () => {
    render(<RatingStars value={4.2} showValue />)
    expect(screen.getByText('4.2')).toBeInTheDocument()
  })

  it('does not show value text by default', () => {
    render(<RatingStars value={4.2} />)
    expect(screen.queryByText('4.2')).not.toBeInTheDocument()
  })

  it('applies the correct size CSS class', () => {
    const { container } = render(<RatingStars value={3} size="lg" />)
    expect(container.firstChild).toHaveClass('rating-stars--lg')
  })

  it('applies sm size class by default', () => {
    const { container } = render(<RatingStars value={3} />)
    expect(container.firstChild).toHaveClass('rating-stars--sm')
  })

  it('applies a custom className', () => {
    const { container } = render(<RatingStars value={3} className="my-custom-class" />)
    expect(container.firstChild).toHaveClass('my-custom-class')
  })
})
