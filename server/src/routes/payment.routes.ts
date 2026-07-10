import { Router }      from 'express'
import * as paymentController from '../modules/payment/payment.controller.js'
import { authenticate }       from '../middlewares/auth.middleware.js'
import { validate }           from '../middlewares/validate.middleware.js'
import { refundSchema, confirmPaymentSchema } from '../../../src/shared/validators/payment.validators.js'
import rateLimit              from 'express-rate-limit'

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  message:  { success: false, message: 'Too many payment requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders:   false,
})

const router = Router()

// ─── Public ───────────────────────────────────────────────────────────────────
// Paystack webhook — raw body, no auth (signature verified in service)
// NOTE: registered in app.ts with express.raw() before json middleware

// Available payment providers (no auth required so checkout page can check)
router.get('/providers', paymentController.getProviders)

// ─── Protected ────────────────────────────────────────────────────────────────
router.use(authenticate)
router.use(paymentLimiter)

// Stripe
router.get('/status/:paymentIntentId', paymentController.getPaymentStatus)
router.post('/confirm', validate(confirmPaymentSchema), paymentController.confirmPayment)
router.post('/refund',  validate(refundSchema),         paymentController.refundPayment)

// Paystack
router.post('/paystack/initialize', paymentController.paystackInitialize)
router.post('/paystack/verify',     paymentController.paystackVerify)

export default router
