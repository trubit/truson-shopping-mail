import api from './api.js'
import type { IUser } from '../../shared/types/user.types.js'
import type { IProduct } from '../../shared/types/product.types.js'
import type { IOrder, OrderStatus } from '../../shared/types/order.types.js'
import type { UserRole } from '../../shared/types/auth.types.js'

export interface AdminStats {
  users:    { total: number; buyers: number; sellers: number; admins: number }
  products: { total: number; pending: number; active: number; blocked: number }
  orders:   { total: number; pending: number; confirmed: number; processing: number; shipped: number; delivered: number; cancelled: number; refunded: number }
  revenue:  { total: number }
  revenueByDay: { _id: string; revenue: number; orders: number }[]
  recentOrders: IOrder[]
}

interface PagedResponse<T> {
  data: T[]
  pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean }
}

const unwrap = <T>(res: { data: { data: T; pagination?: PagedResponse<T>['pagination'] } }) => res.data

export const adminService = {
  getStats: (): Promise<{ data: AdminStats }> =>
    api.get('/admin/stats').then(r => r.data),

  getUsers: (params?: Record<string, string>): Promise<PagedResponse<IUser>> =>
    api.get('/admin/users', { params }).then(r => ({ data: r.data.data, pagination: r.data.pagination })),

  toggleUserActive: (id: string): Promise<IUser> =>
    api.patch(`/admin/users/${id}/toggle-active`).then(r => r.data.data),

  changeUserRole: (id: string, role: UserRole): Promise<IUser> =>
    api.patch(`/admin/users/${id}/role`, { role }).then(r => r.data.data),

  getProducts: (params?: Record<string, string>): Promise<PagedResponse<IProduct>> =>
    api.get('/admin/products', { params }).then(r => ({ data: r.data.data, pagination: r.data.pagination })),

  approveProduct: (id: string): Promise<IProduct> =>
    api.put(`/admin/products/${id}/approve`).then(r => r.data.data),

  blockProduct: (id: string): Promise<IProduct> =>
    api.put(`/admin/products/${id}/block`).then(r => r.data.data),

  getOrders: (params?: Record<string, string>): Promise<PagedResponse<IOrder>> =>
    api.get('/admin/orders', { params }).then(r => ({ data: r.data.data, pagination: r.data.pagination })),

  updateOrderStatus: (id: string, orderStatus: OrderStatus): Promise<IOrder> =>
    api.patch(`/admin/orders/${id}/status`, { orderStatus }).then(r => r.data.data),
}
