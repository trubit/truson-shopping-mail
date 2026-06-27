import { User } from '../user/user.model.js'
import { Product } from '../product/product.model.js'
import { Order } from '../order/order.model.js'
import type { UserRole } from '../../../../src/shared/types/auth.types.js'
import { AppError } from '../../middlewares/error.middleware.js'

export const getStats = async () => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [
    totalUsers, usersByRole,
    totalProducts, productsByStatus,
    totalOrders, ordersByStatus,
    revenueResult,
    recentOrders,
    revenueByDay,
  ] = await Promise.all([
    User.countDocuments(),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    Product.countDocuments(),
    Product.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.countDocuments(),
    Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } },
    ]),
    Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'firstName lastName email'),
    Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$grandTotal' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ])

  const byRole    = Object.fromEntries(usersByRole.map((r: { _id: string; count: number }) => [r._id, r.count]))
  const byStatus  = Object.fromEntries(productsByStatus.map((r: { _id: string; count: number }) => [r._id, r.count]))
  const byOrder   = Object.fromEntries(ordersByStatus.map((r: { _id: string; count: number }) => [r._id, r.count]))

  return {
    users: {
      total:   totalUsers,
      buyers:  byRole['user']   ?? 0,
      sellers: byRole['seller'] ?? 0,
      admins:  byRole['admin']  ?? 0,
    },
    products: {
      total:   totalProducts,
      pending: byStatus['pending'] ?? 0,
      active:  byStatus['active']  ?? 0,
      blocked: byStatus['blocked'] ?? 0,
    },
    orders: {
      total:      totalOrders,
      pending:    byOrder['pending']    ?? 0,
      confirmed:  byOrder['confirmed']  ?? 0,
      processing: byOrder['processing'] ?? 0,
      shipped:    byOrder['shipped']    ?? 0,
      delivered:  byOrder['delivered']  ?? 0,
      cancelled:  byOrder['cancelled']  ?? 0,
      refunded:   byOrder['refunded']   ?? 0,
    },
    revenue: {
      total: revenueResult[0]?.total ?? 0,
    },
    revenueByDay,
    recentOrders,
  }
}

export const listUsers = async (opts: {
  search?: string
  role?: string
  status?: string
  page: number
  limit: number
}) => {
  const { search, role, status, page, limit } = opts
  const filter: Record<string, unknown> = {}

  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName:  { $regex: search, $options: 'i' } },
      { email:     { $regex: search, $options: 'i' } },
      { username:  { $regex: search, $options: 'i' } },
    ]
  }
  if (role)             filter.role = role
  if (status === 'active')   filter.isActive = true
  if (status === 'inactive') filter.isActive = false

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ])

  return { users, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export const toggleUserActive = async (userId: string) => {
  const user = await User.findById(userId)
  if (!user) throw new AppError('User not found', 404)
  user.isActive = !user.isActive
  await user.save({ validateBeforeSave: false })
  return user
}

export const changeUserRole = async (userId: string, role: UserRole) => {
  const user = await User.findByIdAndUpdate(userId, { role }, { returnDocument: 'after', runValidators: true })
  if (!user) throw new AppError('User not found', 404)
  return user
}

export const listAllProducts = async (opts: {
  status?: string
  search?: string
  page: number
  limit: number
}) => {
  const { status, search, page, limit } = opts
  const filter: Record<string, unknown> = {}

  if (status) filter.status = status
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
      { sku:   { $regex: search, $options: 'i' } },
    ]
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sellerId', 'firstName lastName email username'),
    Product.countDocuments(filter),
  ])

  return { products, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export const listAllOrders = async (opts: {
  status?: string
  paymentStatus?: string
  search?: string
  page: number
  limit: number
}) => {
  const { status, paymentStatus, search, page, limit } = opts
  const filter: Record<string, unknown> = {}

  if (status)        filter.orderStatus   = status
  if (paymentStatus) filter.paymentStatus = paymentStatus
  if (search)        filter.orderNumber   = { $regex: search, $options: 'i' }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('userId', 'firstName lastName email'),
    Order.countDocuments(filter),
  ])

  return { orders, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export const updateOrderStatus = async (orderId: string, orderStatus: string) => {
  const valid = ['pending','confirmed','processing','shipped','delivered','cancelled','refunded']
  if (!valid.includes(orderStatus)) throw new AppError('Invalid order status', 400)

  const order = await Order.findByIdAndUpdate(
    orderId,
    { orderStatus },
    { returnDocument: 'after', runValidators: true },
  ).populate('userId', 'firstName lastName email')

  if (!order) throw new AppError('Order not found', 404)
  return order
}
