import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { AppError } from './error.middleware.js'

type ValidateTarget = 'body' | 'query' | 'params'

export const validate =
  (schema: z.ZodTypeAny, target: ValidateTarget = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target])
    if (result.success) {
      req[target] = result.data
      return next()
    }
    const issues = result.error.issues ?? result.error.errors ?? []
    const errors = Object.fromEntries(
      issues.map((e: { path: (string | number)[]; message: string }) => [e.path.join('.') || 'value', e.message]),
    )
    next(new AppError('Validation failed', 422, errors))
  }
