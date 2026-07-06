import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import { env } from './config/env.js'
import { globalLimiter } from './middlewares/rateLimiter.middleware.js'
import { notFound, errorHandler } from './middlewares/error.middleware.js'
import { API_PREFIX } from '../../src/shared/constants/index.js'

import authRoutes         from './routes/auth.routes.js'
import profileRoutes      from './routes/profile.routes.js'
import productRoutes      from './routes/product.routes.js'
import cartRoutes         from './routes/cart.routes.js'
import checkoutRoutes     from './routes/checkout.routes.js'
import orderRoutes        from './routes/order.routes.js'
import paymentRoutes      from './routes/payment.routes.js'
import dashboardRoutes    from './routes/dashboard.routes.js'
import adminRoutes        from './routes/admin.routes.js'
import sellerRoutes       from './routes/seller.routes.js'
import * as paymentController from './modules/payment/payment.controller.js'

const app = express()

// ─── Stripe Webhook (raw body BEFORE express.json) ────────────────────────────
// Stripe requires the raw request body for signature verification
app.post(
  '/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  paymentController.handleWebhook,
)

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet())
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)
app.use(globalLimiter)

// ─── Parsing ──────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true, limit: '2mb' }))
app.use(cookieParser())

// ─── Logging ──────────────────────────────────────────────────────────────────
if (env.isDev()) app.use(morgan('dev'))

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'TrusonShopp Mall API is running', env: env.NODE_ENV })
})

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use(`${API_PREFIX}/auth`,          authRoutes)
app.use(`${API_PREFIX}/profile`,       profileRoutes)
app.use(`${API_PREFIX}/products`,      productRoutes)
app.use(`${API_PREFIX}/cart`,          cartRoutes)
app.use(`${API_PREFIX}/checkout`,      checkoutRoutes)
app.use(`${API_PREFIX}/orders`,        orderRoutes)
app.use(`${API_PREFIX}/payment`,       paymentRoutes)
app.use(`${API_PREFIX}/dashboard`,     dashboardRoutes)
app.use(`${API_PREFIX}/seller`,        sellerRoutes)
app.use(`${API_PREFIX}/admin`,         adminRoutes)

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

export default app
