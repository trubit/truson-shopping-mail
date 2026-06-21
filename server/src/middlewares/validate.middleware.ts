import type { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'
import { AppError } from './error.middleware.js'

type ValidateTarget = 'body' | 'query' | 'params'

export const validate =
  (schema: ZodSchema, target: ValidateTarget = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req[target] = schema.parse(req[target])
      next()
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = Object.fromEntries(
          err.errors.map((e) => [e.path.join('.'), e.message]),
        )
        return next(new AppError('Validation failed', 422, errors))
      }
      next(err)
    }
  }
