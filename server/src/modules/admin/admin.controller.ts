import type { Request, Response, NextFunction } from 'express'
import * as adminService from './admin.service.js'
import { sendSuccess } from '../../utils/response.js'
import { AppError } from '../../middlewares/error.middleware.js'
import type { UserRole } from '../../../../src/shared/types/auth.types.js'

const paginationMeta = (result: { page: number; limit: number; total: number; totalPages: number }) => ({
  page:       result.page,
  limit:      result.limit,
  total:      result.total,
  totalPages: result.totalPages,
  hasNext:    result.page < result.totalPages,
  hasPrev:    result.page > 1,
})

export const getStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await adminService.getStats()
    sendSuccess(res, stats, 'Dashboard stats')
  } catch (err) { next(err) }
}

export const listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, role, status, page = '1', limit = '20' } = req.query as Record<string, string>
    const result = await adminService.listUsers({
      search, role, status,
      page:  parseInt(page,  10),
      limit: parseInt(limit, 10),
    })
    sendSuccess(res, result.users, 'Users', 200, paginationMeta(result))
  } catch (err) { next(err) }
}

export const toggleUserActive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await adminService.toggleUserActive(req.params['id'] as string)
    sendSuccess(res, user, user.isActive ? 'User activated' : 'User deactivated')
  } catch (err) { next(err) }
}

export const changeUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { role } = req.body as { role: UserRole }
    if (!['user', 'seller', 'admin'].includes(role)) {
      return next(new AppError('Invalid role', 400))
    }
    const user = await adminService.changeUserRole(req.params['id'] as string, role)
    sendSuccess(res, user, 'Role updated')
  } catch (err) { next(err) }
}

export const listAllProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, search, page = '1', limit = '20' } = req.query as Record<string, string>
    const result = await adminService.listAllProducts({
      status, search,
      page:  parseInt(page,  10),
      limit: parseInt(limit, 10),
    })
    sendSuccess(res, result.products, 'Products', 200, paginationMeta(result))
  } catch (err) { next(err) }
}

export const listAllOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, paymentStatus, search, page = '1', limit = '20' } = req.query as Record<string, string>
    const result = await adminService.listAllOrders({
      status, paymentStatus, search,
      page:  parseInt(page,  10),
      limit: parseInt(limit, 10),
    })
    sendSuccess(res, result.orders, 'Orders', 200, paginationMeta(result))
  } catch (err) { next(err) }
}

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { orderStatus } = req.body as { orderStatus: string }
    const order = await adminService.updateOrderStatus(req.params['id'] as string, orderStatus)
    sendSuccess(res, order, 'Order status updated')
  } catch (err) { next(err) }
}
