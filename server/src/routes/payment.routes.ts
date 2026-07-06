import { Router } from 'express'
import * as paymentController from '../modules/payment/payment.controller.js'
import { authenticate }       from '../middlewares/auth.middleware.js'
import { validate }           from '../middlewares/validate.middleware.js'
import { refundSchema }       from '../../../src/shared/validators/payment.validators.js'
import rateLimit              from 'express-rate-limit'

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  message:  { success: false, message: 'Too many payment requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders:   false,
})

const router = Router()

// Webhook — NO authenticate, uses raw body (mounted in app.ts before json middleware)
// NOTE: This route is registered separately in app.ts with express.raw()

// Protected payment routes
router.use(authenticate)
router.use(paymentLimiter)

router.get('/status/:paymentIntentId', paymentController.getPaymentStatus)
router.post('/confirm',               paymentController.confirmPayment)
router.post('/refund', validate(refundSchema), paymentController.refundPayment)

export default router
