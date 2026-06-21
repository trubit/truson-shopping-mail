import type { Server as HttpServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

export const initSockets = (httpServer: HttpServer): SocketServer => {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  io.on('connection', (socket) => {
    logger.debug(`Socket connected: ${socket.id}`)

    socket.on('join:room', (roomId: string) => {
      socket.join(roomId)
    })

    socket.on('leave:room', (roomId: string) => {
      socket.leave(roomId)
    })

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`)
    })
  })

  return io
}
