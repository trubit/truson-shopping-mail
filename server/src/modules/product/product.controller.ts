import type { Request, Response, NextFunction } from 'express'
import {
  getProducts, getProductById, searchProducts, getProductsByCategory,
  createProduct, updateProduct, deleteProduct, approveProduct, blockProduct,
  getSellerProducts, getFeaturedProducts,
} from './product.service.js'
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/response.js'
import type { ProductFiltersInput } from '../../../../src/shared/validators/product.validators.js'

// ─── Public ────────────────────────────────────────────────────────────────────
export const listProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filters = req.query as unknown as ProductFiltersInput
    const result  = await getProducts(filters)
    sendSuccess(res, result.products, 'Products fetched', 200, result.pagination)
  } catch (err) { next(err) }
}

export const featuredProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit    = parseInt(req.query.limit as string ?? '12', 10)
    const products = await getFeaturedProducts(limit)
    sendSuccess(res, products, 'Featured products')
  } catch (err) { next(err) }
}

export const getProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await getProductById(req.params.id)
    sendSuccess(res, product, 'Product fetched')
  } catch (err) { next(err) }
}

export const search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const q       = (req.query.q as string) ?? ''
    const filters = req.query as unknown as ProductFiltersInput
    const result  = await searchProducts(q, filters)
    sendSuccess(res, result.products, 'Search results', 200, result.pagination)
  } catch (err) { next(err) }
}

export const byCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const category = decodeURIComponent(req.params.category)
    const filters  = req.query as unknown as ProductFiltersInput
    const result   = await getProductsByCategory(category, filters)
    sendSuccess(res, result.products, `Category: ${category}`, 200, result.pagination)
  } catch (err) { next(err) }
}

// ─── Seller ────────────────────────────────────────────────────────────────────
export const myProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filters = req.query as unknown as ProductFiltersInput
    const result  = await getSellerProducts(req.user!.userId, filters)
    sendSuccess(res, result.products, 'Your products', 200, result.pagination)
  } catch (err) { next(err) }
}

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await createProduct(req.body, req.user!.userId)
    sendCreated(res, product, 'Product created — pending approval')
  } catch (err) { next(err) }
}

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const isAdmin = req.user!.role === 'admin'
    const product = await updateProduct(req.params.id, req.body, req.user!.userId, isAdmin)
    sendSuccess(res, product, 'Product updated')
  } catch (err) { next(err) }
}

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const isAdmin = req.user!.role === 'admin'
    await deleteProduct(req.params.id, req.user!.userId, isAdmin)
    sendNoContent(res)
  } catch (err) { next(err) }
}

// ─── Admin ─────────────────────────────────────────────────────────────────────
export const approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await approveProduct(req.params.id)
    sendSuccess(res, product, 'Product approved')
  } catch (err) { next(err) }
}

export const block = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await blockProduct(req.params.id)
    sendSuccess(res, product, 'Product blocked')
  } catch (err) { next(err) }
}
