import type { Response } from 'express'
import type { ApiResponse, PaginationMeta } from '../../../src/shared/types/api.types.js'

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  pagination?: PaginationMeta,
): void => {
  res.status(statusCode).json({ success: true, message, data, pagination } satisfies ApiResponse<T>)
}

export const sendCreated = <T>(res: Response, data: T, message = 'Created successfully'): void =>
  sendSuccess(res, data, message, 201)

export const sendNoContent = (res: Response): void => {
  res.status(204).send()
}
