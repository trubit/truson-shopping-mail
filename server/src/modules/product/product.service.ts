import mongoose from 'mongoose'
import { Product, type IProductDocument } from './product.model.js'
import { AppError } from '../../middlewares/error.middleware.js'
import type { CreateProductInput, UpdateProductInput, ProductFiltersInput } from '../../../../src/shared/validators/product.validators.js'
import type { PaginationMeta } from '../../../../src/shared/types/api.types.js'

// ─── Build Mongo filter from query params ─────────────────────────────────────
const buildFilter = (filters: ProductFiltersInput, extra: Record<string, unknown> = {}) => {
  const q: Record<string, unknown> = { ...extra }

  if (filters.category)              q.category = filters.category
  if (filters.brand)                 q.brand = new RegExp(filters.brand, 'i')
  if (filters.search)                q.$text = { $search: filters.search }
  if (filters.inStock === true)      q.stockQuantity = { $gt: 0 }
  if (filters.isFeatured === true)   q.isFeatured = true
  if (filters.sellerId)              q.sellerId = new mongoose.Types.ObjectId(filters.sellerId)

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    q.price = {}
    if (filters.minPrice !== undefined) (q.price as Record<string, number>).$gte = filters.minPrice
    if (filters.maxPrice !== undefined) (q.price as Record<string, number>).$lte = filters.maxPrice
  }

  if (filters.rating !== undefined) q.ratingsAverage = { $gte: filters.rating }

  return q
}

// ─── Build sort ───────────────────────────────────────────────────────────────
const buildSort = (sort?: string): Record<string, 1 | -1> => {
  switch (sort) {
    case 'price_asc':  return { price: 1 }
    case 'price_desc': return { price: -1 }
    case 'rating':     return { ratingsAverage: -1 }
    case 'popular':    return { views: -1 }
    case 'newest':
    default:           return { createdAt: -1 }
  }
}

// ─── Paginate helper ──────────────────────────────────────────────────────────
const paginate = (page: number, limit: number, total: number): PaginationMeta => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
  hasNext: page * limit < total,
  hasPrev: page > 1,
})

// ─── Public: Get products with filters ────────────────────────────────────────
export const getProducts = async (filters: ProductFiltersInput) => {
  const page  = filters.page  ?? 1
  const limit = filters.limit ?? 20
  const skip  = (page - 1) * limit

  const filter = buildFilter(filters, { status: 'active', isActive: true })
  const sort   = buildSort(filters.sort)

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('sellerId', 'firstName lastName username profileImage')
      .lean({ virtuals: true }),
    Product.countDocuments(filter),
  ])

  return { products, pagination: paginate(page, limit, total) }
}

// ─── Public: Get single product ───────────────────────────────────────────────
export const getProductById = async (id: string): Promise<IProductDocument> => {
  if (!mongoose.isValidObjectId(id)) throw new AppError('Invalid product ID', 400)

  const product = await Product.findOneAndUpdate(
    { _id: id, status: 'active', isActive: true },
    { $inc: { views: 1 } },
    { new: true },
  ).populate('sellerId', 'firstName lastName username profileImage')

  if (!product) throw new AppError('Product not found', 404)
  return product
}

// ─── Public: Search products ──────────────────────────────────────────────────
export const searchProducts = async (query: string, filters: ProductFiltersInput) => {
  return getProducts({ ...filters, search: query })
}

// ─── Public: Get by category ──────────────────────────────────────────────────
export const getProductsByCategory = async (category: string, filters: ProductFiltersInput) => {
  return getProducts({ ...filters, category })
}

// ─── Seller: Create product ───────────────────────────────────────────────────
export const createProduct = async (
  data: CreateProductInput,
  sellerId: string,
): Promise<IProductDocument> => {
  const existing = await Product.findOne({ sku: data.sku.toUpperCase(), status: { $ne: 'blocked' }, isActive: true })
  if (existing) throw new AppError('SKU already exists', 409)

  const product = await Product.create({
    title:         data.title,
    description:   data.description,
    price:         data.price,
    discountPrice: data.discountPrice,
    images:        data.images ?? [],
    category:      data.category,
    subCategory:   data.subCategory,
    brand:         data.brand,
    stockQuantity: data.stockQuantity,
    sku:           data.sku,
    tags:          data.tags ?? [],
    isFeatured:    data.isFeatured ?? false,
    sellerId:      new mongoose.Types.ObjectId(sellerId),
    status:        'pending',
    isActive:      true,
  })

  return product
}

// ─── Seller: Update product ───────────────────────────────────────────────────
export const updateProduct = async (
  id: string,
  data: UpdateProductInput,
  sellerId: string,
  isAdmin = false,
): Promise<IProductDocument> => {
  if (!mongoose.isValidObjectId(id)) throw new AppError('Invalid product ID', 400)

  const filter = isAdmin ? { _id: id } : { _id: id, sellerId: new mongoose.Types.ObjectId(sellerId) }
  const product = await Product.findOne(filter)
  if (!product) throw new AppError('Product not found or access denied', 404)

  if (data.sku && data.sku.toUpperCase() !== product.sku) {
    const skuExists = await Product.findOne({ sku: data.sku.toUpperCase(), _id: { $ne: id } })
    if (skuExists) throw new AppError('SKU already exists', 409)
  }

  Object.assign(product, {
    ...(data.title         !== undefined && { title:         data.title }),
    ...(data.description   !== undefined && { description:   data.description }),
    ...(data.price         !== undefined && { price:         data.price }),
    ...(data.discountPrice !== undefined && { discountPrice: data.discountPrice }),
    ...(data.images        !== undefined && { images:        data.images }),
    ...(data.category      !== undefined && { category:      data.category }),
    ...(data.subCategory   !== undefined && { subCategory:   data.subCategory }),
    ...(data.brand         !== undefined && { brand:         data.brand }),
    ...(data.stockQuantity !== undefined && { stockQuantity: data.stockQuantity }),
    ...(data.sku           !== undefined && { sku:           data.sku.toUpperCase() }),
    ...(data.tags          !== undefined && { tags:          data.tags }),
    ...(data.isFeatured    !== undefined && { isFeatured:    data.isFeatured }),
  })

  await product.save()
  return product
}

// ─── Seller: Delete product (soft delete) ─────────────────────────────────────
export const deleteProduct = async (id: string, sellerId: string, isAdmin = false): Promise<void> => {
  if (!mongoose.isValidObjectId(id)) throw new AppError('Invalid product ID', 400)

  const filter = isAdmin ? { _id: id } : { _id: id, sellerId: new mongoose.Types.ObjectId(sellerId) }
  const product = await Product.findOneAndUpdate(filter, { isActive: false, status: 'blocked' })
  if (!product) throw new AppError('Product not found or access denied', 404)
}

// ─── Admin: Approve product ───────────────────────────────────────────────────
export const approveProduct = async (id: string): Promise<IProductDocument> => {
  if (!mongoose.isValidObjectId(id)) throw new AppError('Invalid product ID', 400)

  const product = await Product.findByIdAndUpdate(
    id,
    { status: 'active', isActive: true },
    { new: true, returnDocument: 'after' },
  )
  if (!product) throw new AppError('Product not found', 404)
  return product
}

// ─── Admin: Block product ─────────────────────────────────────────────────────
export const blockProduct = async (id: string): Promise<IProductDocument> => {
  if (!mongoose.isValidObjectId(id)) throw new AppError('Invalid product ID', 400)

  const product = await Product.findByIdAndUpdate(
    id,
    { status: 'blocked', isActive: false },
    { new: true, returnDocument: 'after' },
  )
  if (!product) throw new AppError('Product not found', 404)
  return product
}

// ─── Seller: Get own products ─────────────────────────────────────────────────
export const getSellerProducts = async (sellerId: string, filters: ProductFiltersInput) => {
  const page  = filters.page  ?? 1
  const limit = filters.limit ?? 20
  const skip  = (page - 1) * limit
  const sort  = buildSort(filters.sort)

  const filter: Record<string, unknown> = {
    sellerId: new mongoose.Types.ObjectId(sellerId),
  }
  if (filters.category) filter.category = filters.category
  if (filters.search)   filter.$text    = { $search: filters.search }

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(limit).lean({ virtuals: true }),
    Product.countDocuments(filter),
  ])

  return { products, pagination: paginate(page, limit, total) }
}

// ─── Get featured products ────────────────────────────────────────────────────
export const getFeaturedProducts = async (limit = 12) => {
  return Product.find({ status: 'active', isActive: true, isFeatured: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sellerId', 'firstName lastName username')
    .lean({ virtuals: true })
}
