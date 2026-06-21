import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import { env } from './config/env.js'
import { globalLimiter } from './middlewares/rateLimiter.middleware.js'
import { notFound, errorHandler } from './middlewares/error.middleware.js'
import { API_PREFIX } from '../../src/shared/constants/index.js'

// Route imports (stubs — will be wired in later phases)
// import authRoutes from './routes/auth.routes.js'

const app = express()

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
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

// ─── Logging ──────────────────────────────────────────────────────────────────
if (env.isDev()) app.use(morgan('dev'))

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'TrusonShopp Mall API is running', env: env.NODE_ENV })
})

// ─── API Routes ───────────────────────────────────────────────────────────────
// app.use(`${API_PREFIX}/auth`, authRoutes)

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

export default app
