import { z } from 'zod'
import { PRODUCT_CATEGORIES } from '../constants/index.js'

export const createProductSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().min(10).max(5000),
  price: z.number().positive('Price must be positive'),
  comparePrice: z.number().positive().optional(),
  category: z.enum(PRODUCT_CATEGORIES as [string, ...string[]]),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  stock: z.number().int().min(0),
  sku: z.string().min(1),
  tags: z.array(z.string()).optional().default([]),
  isFeatured: z.boolean().optional().default(false),
})

export const updateProductSchema = createProductSchema.partial()

export const productFiltersSchema = z.object({
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  inStock: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional(),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type ProductFiltersInput = z.infer<typeof productFiltersSchema>
