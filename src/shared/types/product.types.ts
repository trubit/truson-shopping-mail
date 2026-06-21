export interface IProduct {
  _id: string
  name: string
  description: string
  price: number
  comparePrice?: number
  category: string
  subcategory?: string
  brand?: string
  images: string[]
  stock: number
  sku: string
  seller: string
  rating: number
  reviewCount: number
  tags: string[]
  isActive: boolean
  isFeatured: boolean
  createdAt: string
  updatedAt: string
}

export interface IProductFilters {
  category?: string
  brand?: string
  minPrice?: number
  maxPrice?: number
  rating?: number
  inStock?: boolean
  isFeatured?: boolean
  tags?: string[]
}

export interface IReview {
  _id: string
  product: string
  user: string
  rating: number
  title: string
  body: string
  createdAt: string
}
