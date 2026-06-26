import { Redis } from 'ioredis'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

export const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  lazyConnect: true,
  enableOfflineQueue: false,
  retryStrategy: (times: number) => {
    if (times > 3) {
      logger.warn('Redis unavailable — operating without cache')
      return null
    }
    return Math.min(times * 200, 1000)
  },
})

redis.on('connect', () => logger.info('Redis connected'))
redis.on('error', (err: Error) => logger.warn('Redis error', { message: err.message }))

export const connectRedis = async (): Promise<void> => {
  try {
    await redis.connect()
  } catch {
    logger.warn('Redis not available — cache layer disabled')
  }
}
