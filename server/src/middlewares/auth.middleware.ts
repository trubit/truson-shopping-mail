import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { AppError } from './error.middleware.js'
import type { TokenPayload, UserRole } from '../../../src/shared/types/auth.types.js'

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization
    const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    const tokenFromCookie = req.cookies?.access_token as string | undefined

    const token = tokenFromHeader ?? tokenFromCookie
    if (!token) throw new AppError('Authentication required', 401)

    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload
    req.user = payload
    next()
  } catch (err) {
    if (err instanceof AppError) return next(err)
    next(new AppError('Invalid or expired token', 401))
  }
}

export const authorize = (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new AppError('Authentication required', 401))
    if (!roles.includes(req.user.role)) return next(new AppError('Access denied', 403))
    next()
  }
