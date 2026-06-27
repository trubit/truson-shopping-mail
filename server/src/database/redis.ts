import { Redis } from 'ioredis'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

export const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
  retryStrategy: (times: number) => {
    if (times >= 1) return null  // give up immediately after first failure
    return 200
  },
})

redis.on('connect', () => logger.info('Redis connected'))
redis.on('error', () => {})  // suppress per-error noise; handled in connectRedis

export const connectRedis = async (): Promise<void> => {
  try {
    await redis.connect()
  } catch {
    logger.warn('Redis not available — cache layer disabled')
  }
}
