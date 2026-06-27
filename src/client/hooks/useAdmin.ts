import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService } from '../services/adminService.js'
import type { OrderStatus } from '../../shared/types/order.types.js'
import type { UserRole } from '../../shared/types/auth.types.js'

const KEYS = {
  stats:    ['admin', 'stats']    as const,
  users:    (p: Record<string, string>) => ['admin', 'users',    p] as const,
  products: (p: Record<string, string>) => ['admin', 'products', p] as const,
  orders:   (p: Record<string, string>) => ['admin', 'orders',   p] as const,
}

export const useAdminStats = () =>
  useQuery({
    queryKey: KEYS.stats,
    queryFn:  adminService.getStats,
    staleTime: 60_000,
  })

export const useAdminUsers = (params: Record<string, string> = {}) =>
  useQuery({
    queryKey: KEYS.users(params),
    queryFn:  () => adminService.getUsers(params),
    staleTime: 30_000,
  })

export const useToggleUserActive = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminService.toggleUserActive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

export const useChangeUserRole = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) => adminService.changeUserRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

export const useAdminProducts = (params: Record<string, string> = {}) =>
  useQuery({
    queryKey: KEYS.products(params),
    queryFn:  () => adminService.getProducts(params),
    staleTime: 30_000,
  })

export const useApproveProduct = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminService.approveProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export const useBlockProduct = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminService.blockProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export const useAdminOrders = (params: Record<string, string> = {}) =>
  useQuery({
    queryKey: KEYS.orders(params),
    queryFn:  () => adminService.getOrders(params),
    staleTime: 30_000,
  })

export const useUpdateOrderStatus = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, orderStatus }: { id: string; orderStatus: OrderStatus }) =>
      adminService.updateOrderStatus(id, orderStatus),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}
