import { createServer } from 'http'
import app from './app.js'
import { connectMongoDB } from './database/mongodb.js'
import { connectRedis } from './database/redis.js'
import { initSockets } from './sockets/index.js'
import { env } from './config/env.js'
import { logger } from './utils/logger.js'

const bootstrap = async (): Promise<void> => {
  await connectMongoDB()
  await connectRedis()

  const httpServer = createServer(app)
  initSockets(httpServer)

  httpServer.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`Port ${env.PORT} is already in use. Stop the other process and try again.`)
    } else {
      logger.error('Server error', { error: err.message })
    }
    process.exit(1)
  })

  httpServer.listen(env.PORT, () => {
    logger.info(`TrusonShopp Mall API running on http://localhost:${env.PORT}`)
    logger.info(`Environment: ${env.NODE_ENV}`)
  })
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
