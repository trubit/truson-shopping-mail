import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import mongoose from 'mongoose'
import { redis } from './database/redis.js'
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

// ─── Webhooks (raw body BEFORE express.json) ──────────────────────────────────
app.post(
  '/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  paymentController.handleWebhook,
)

app.post(
  '/webhooks/paystack',
  express.raw({ type: 'application/json' }),
  paymentController.paystackWebhook,
)

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet())
app.use(
  cors({
    origin:       env.CLIENT_URL,
    credentials:  true,
    methods:      ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)
app.use(globalLimiter)

// ─── Compression ──────────────────────────────────────────────────────────────
// Compresses JSON responses with gzip — typically 70-80% smaller on the wire.
// Must come before routes but after raw-body webhook routes.
app.use(compression())

// ─── Parsing ──────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true, limit: '2mb' }))
app.use(cookieParser())

// ─── Logging ──────────────────────────────────────────────────────────────────
// Use combined format in production (stdout captured by container runtime);
// dev format in development for readable output.
app.use(morgan(env.isDev() ? 'dev' : 'combined'))

// ─── Health Check ─────────────────────────────────────────────────────────────
// Checks real DB + Redis state so load balancers route away from broken nodes.
app.get('/health', async (_req, res) => {
  const dbState  = mongoose.connection.readyState  // 1 = connected
  const dbOk     = dbState === 1

  let redisOk = false
  try {
    const pong = await redis.ping()
    redisOk    = pong === 'PONG'
  } catch {
    redisOk = false
  }

  const status = dbOk ? 200 : 503
  res.status(status).json({
    success: dbOk,
    message: dbOk ? 'Cartiva API is running' : 'Service degraded',
    env:     env.NODE_ENV,
    checks: {
      mongodb: dbOk    ? 'ok' : 'unavailable',
      redis:   redisOk ? 'ok' : 'unavailable',
    },
  })
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
