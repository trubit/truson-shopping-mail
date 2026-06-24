import type { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger.js'
import type { ApiResponse } from '../.././../src/shared/types/api.types.js'

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public errors?: Record<string, string>,
  ) {
    super(message)
    this.name = 'AppError'
    Error.captureStackTrace(this, this.constructor)
  }
}

export const notFound = (_req: Request, res: Response): void => {
  res.status(404).json({ success: false, message: 'Route not found' } satisfies ApiResponse)
}

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    } satisfies ApiResponse)
    return
  }

  if (err instanceof Error && err.name === 'ValidationError') {
    res.status(422).json({ success: false, message: err.message } satisfies ApiResponse)
    return
  }

  if (err instanceof Error && err.name === 'CastError') {
    res.status(400).json({ success: false, message: 'Invalid ID format' } satisfies ApiResponse)
    return
  }

  const message = err instanceof Error ? err.message : String(err)
  const stack = err instanceof Error ? err.stack : undefined
  logger.error('Unhandled error', { message, stack, path: req.path, method: req.method })

  res.status(500).json({ success: false, message: 'Internal server error' } satisfies ApiResponse)
}
