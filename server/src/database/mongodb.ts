import mongoose from 'mongoose'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

export const connectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize:            100,   // up from default 5 — handles concurrent load
      minPoolSize:            10,    // keep warm connections ready
      socketTimeoutMS:        45_000,
      connectTimeoutMS:       10_000,
      serverSelectionTimeoutMS: 10_000,
      heartbeatFrequencyMS:   10_000,
      maxIdleTimeMS:          60_000,
    })
    logger.info(`MongoDB connected: ${mongoose.connection.host}`)
  } catch (err) {
    logger.error('MongoDB connection failed', { error: err })
    process.exit(1)
  }

  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'))
  mongoose.connection.on('reconnected',  () => logger.info('MongoDB reconnected'))
  mongoose.connection.on('error',        (err) => logger.error('MongoDB error', { error: err }))
}
