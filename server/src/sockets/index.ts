import type { Server as HttpServer } from 'http'
import { Server as SocketServer }   from 'socket.io'
import { env }                      from '../config/env.js'
import { logger }                   from '../utils/logger.js'

let io: SocketServer | null = null

export const initSockets = (httpServer: HttpServer): SocketServer => {
  io = new SocketServer(httpServer, {
    cors: {
      origin:      env.CLIENT_URL,
      methods:     ['GET', 'POST'],
      credentials: true,
    },
  })

  io.on('connection', (socket) => {
    logger.debug(`Socket connected: ${socket.id}`)

    // Client sends its userId to join a private room for targeted events
    socket.on('join:user', (userId: string) => {
      if (typeof userId === 'string' && userId.length === 24) {
        socket.join(`user:${userId}`)
        logger.debug(`Socket ${socket.id} joined room user:${userId}`)
      }
    })

    socket.on('leave:user', (userId: string) => {
      socket.leave(`user:${userId}`)
    })

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`)
    })
  })

  return io
}

/** Push a real-time notification event to a specific user. */
export const emitToUser = (userId: string, event: string, data: unknown): void => {
  if (!io) return
  io.to(`user:${userId}`).emit(event, data)
}
