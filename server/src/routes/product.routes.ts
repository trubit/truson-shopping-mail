import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'
import { uploadProductImages } from '../middlewares/upload.middleware.js'
import { createProductSchema, updateProductSchema, productFiltersSchema, reviewSchema } from '../../../src/shared/validators/product.validators.js'
import {
  listProducts, featuredProducts, getProduct, search, byCategory,
  myProducts, create, update, remove, approve, block, uploadImages,
} from '../modules/product/product.controller.js'
import { addReview, listReviews, removeReview } from '../modules/review/review.controller.js'

const router = Router()

// ─── Public ────────────────────────────────────────────────────────────────────
router.get('/',                    validate(productFiltersSchema, 'query'), listProducts)
router.get('/featured',            featuredProducts)
router.get('/search',              validate(productFiltersSchema, 'query'), search)
router.get('/category/:category',  validate(productFiltersSchema, 'query'), byCategory)
router.get('/:id',                 getProduct)
router.get('/:id/reviews',         listReviews)

// ─── Authenticated reviews ─────────────────────────────────────────────────────
router.post('/:id/review',         authenticate, validate(reviewSchema), addReview)
router.delete('/:id/reviews/:reviewId', authenticate, removeReview)

// ─── Seller ────────────────────────────────────────────────────────────────────
router.post('/upload-images',      authenticate, authorize('seller', 'admin'), uploadProductImages, uploadImages)
router.get('/seller/my-products',  authenticate, authorize('seller', 'admin'), myProducts)
router.post('/create',             authenticate, authorize('seller', 'admin'), validate(createProductSchema), create)
router.put('/update/:id',          authenticate, authorize('seller', 'admin'), validate(updateProductSchema), update)
router.delete('/delete/:id',       authenticate, authorize('seller', 'admin'), remove)

// ─── Admin ─────────────────────────────────────────────────────────────────────
router.put('/approve/:id',         authenticate, authorize('admin'), approve)
router.put('/block/:id',           authenticate, authorize('admin'), block)

export default router
