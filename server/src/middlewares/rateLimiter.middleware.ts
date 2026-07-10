import rateLimit from 'express-rate-limit'
import { RedisStore, type RedisReply } from 'rate-limit-redis'
import { redis } from '../database/redis.js'
import { env } from '../config/env.js'

// In production each limiter gets its own RedisStore so counts are shared across
// all cluster workers. Each store needs a unique prefix (express-rate-limit
// enforces uniqueness via ERR_ERL_STORE_REUSE).
// sendCommand fails-open (returns null) so requests are never blocked by a
// temporary Redis outage — limits resume automatically when Redis reconnects.
//
// In development Redis is optional, so we skip the store and fall back to the
// default in-memory counter (per-process, fine for local testing).
const makeStore = (prefix: string) => {
  if (env.NODE_ENV !== 'production') return undefined
  try {
    return new RedisStore({
      prefix,
      sendCommand: (...args: string[]) =>
        (redis.call(...(args as [string, ...string[]])) as Promise<RedisReply>)
          .catch(() => null as unknown as RedisReply),
    })
  } catch {
    return undefined
  }
}

/** Applied to every route — generous limit, stops runaway clients */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      200,
  store:    makeStore('rl:global:'),
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests — please try again later' },
})

/** Login, register, password reset — strict to prevent brute-force */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  store:    makeStore('rl:auth:'),
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many authentication attempts' },
})

/** Product search / listing — each triggers a full-text MongoDB search */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      30,
  store:    makeStore('rl:search:'),
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many search requests — slow down' },
})

/** Image uploads — 40 MB per request, Cloudinary quota is finite */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max:      20,
  store:    makeStore('rl:upload:'),
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Upload limit reached — try again in an hour' },
})

/** Seller/admin dashboard & analytics — each triggers many aggregations */
export const dashboardLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      10,
  store:    makeStore('rl:dashboard:'),
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Dashboard request limit reached — please wait' },
})
