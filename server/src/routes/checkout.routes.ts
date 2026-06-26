import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { authenticate } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'
import {
  updateCheckoutSchema,
  selectShippingSchema,
  applyCouponSchema,
} from '../../../src/shared/validators/checkout.validators.js'
import * as checkoutController from '../modules/checkout/checkout.controller.js'

const router = Router()

// Stricter rate limit for checkout mutations
const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      30,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many checkout requests — please slow down' },
})

router.use(authenticate)

router.get   ('/',                checkoutController.getCheckout)
router.put   ('/update',  checkoutLimiter, validate(updateCheckoutSchema),  checkoutController.updateCheckout)
router.post  ('/select-shipping', checkoutLimiter, validate(selectShippingSchema), checkoutController.selectShipping)
router.post  ('/apply-coupon',    checkoutLimiter, validate(applyCouponSchema),    checkoutController.applyCoupon)
router.delete('/coupon',          checkoutLimiter, checkoutController.removeCoupon)

export default router
