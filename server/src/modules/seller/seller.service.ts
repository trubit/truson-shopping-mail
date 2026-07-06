import mongoose from 'mongoose'
import { SellerProfile } from './seller.model.js'
import { Product }       from '../product/product.model.js'
import { Order }         from '../order/order.model.js'
import { AppError }      from '../../middlewares/error.middleware.js'
import type { OnboardSellerInput, UpdateSellerProfileInput } from '../../../../src/shared/validators/seller.validators.js'

const PLATFORM_FEE = 0.05   // 5 % platform fee

// ─── Onboard ──────────────────────────────────────────────────────────────────
export const onboardSeller = async (userId: string, input: OnboardSellerInput) => {
  const existing = await SellerProfile.findOne({ userId })
  if (existing) throw new AppError('Seller profile already exists', 409)

  return SellerProfile.create({
    userId:           new mongoose.Types.ObjectId(userId),
    storeName:        input.storeName,
    storeDescription: input.storeDescription ?? '',
    storeAddress:     input.storeAddress ?? {},
  })
}

// ─── Get profile ──────────────────────────────────────────────────────────────
export const getSellerProfile = async (userId: string) => {
  const profile = await SellerProfile.findOne({ userId })
  if (!profile) throw new AppError('Seller profile not found. Please complete onboarding.', 404)
  return profile
}

// ─── Update profile ───────────────────────────────────────────────────────────
export const updateSellerProfile = async (userId: string, input: UpdateSellerProfileInput) => {
  const profile = await SellerProfile.findOne({ userId })
  if (!profile) throw new AppError('Seller profile not found', 404)

  if (input.storeName        !== undefined) profile.storeName        = input.storeName
  if (input.storeDescription !== undefined) profile.storeDescription = input.storeDescription
  if (input.storeLogo        !== undefined) profile.storeLogo        = input.storeLogo
  if (input.storeAddress) {
    Object.assign(profile.storeAddress, input.storeAddress)
    profile.markModified('storeAddress')
  }

  await profile.save()
  return profile
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const getSellerDashboard = async (sellerId: string) => {
  const sellerOid  = new mongoose.Types.ObjectId(sellerId)
  const productIds = await Product.find({ sellerId: sellerOid }).distinct('_id')

  const now            = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const last30Days     = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const orderMatch     = productIds.length > 0
    ? { 'items.productId': { $in: productIds } }
    : { _id: null }   // matches nothing when seller has no products yet

  const [
    productStatusBreakdown,
    totalOrders,
    revenueResult,
    thisMonthRevenue,
    pendingOrders,
    recentOrders,
    revenueByDay,
    orderStatusBreakdown,
    topProducts,
  ] = await Promise.all([
    Product.aggregate([
      { $match: { sellerId: sellerOid } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Order.countDocuments(orderMatch),
    Order.aggregate([
      { $match: { ...orderMatch, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } },
    ]),
    Order.aggregate([
      { $match: { ...orderMatch, paymentStatus: 'paid', createdAt: { $gte: thisMonthStart } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } },
    ]),
    Order.countDocuments({ ...orderMatch, orderStatus: 'pending' }),
    Order.find(orderMatch)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'firstName lastName email')
      .lean(),
    Order.aggregate([
      { $match: { ...orderMatch, paymentStatus: 'paid', createdAt: { $gte: last30Days } } },
      {
        $group: {
          _id:     { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$grandTotal' },
          orders:  { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: orderMatch },
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
    ]),
    productIds.length > 0
      ? Order.aggregate([
          { $match: { 'items.productId': { $in: productIds }, paymentStatus: 'paid' } },
          { $unwind: '$items' },
          { $match: { 'items.productId': { $in: productIds } } },
          {
            $group: {
              _id:          '$items.productId',
              title:        { $first: '$items.title' },
              image:        { $first: '$items.image' },
              totalSold:    { $sum: '$items.quantity' },
              totalRevenue: { $sum: '$items.lineTotal' },
            },
          },
          { $sort: { totalRevenue: -1 } },
          { $limit: 5 },
        ])
      : Promise.resolve([]),
  ])

  const byStatus = Object.fromEntries(
    (productStatusBreakdown as { _id: string; count: number }[]).map((r) => [r._id, r.count]),
  )

  return {
    stats: {
      totalRevenue:     revenueResult[0]?.total ?? 0,
      totalOrders,
      totalProducts:    (byStatus['active'] ?? 0) + (byStatus['pending'] ?? 0) + (byStatus['blocked'] ?? 0),
      activeProducts:   byStatus['active']  ?? 0,
      pendingOrders,
      thisMonthRevenue: thisMonthRevenue[0]?.total ?? 0,
    },
    products: {
      active:  byStatus['active']  ?? 0,
      pending: byStatus['pending'] ?? 0,
      blocked: byStatus['blocked'] ?? 0,
    },
    recentOrders,
    revenueByDay,
    orderStatusBreakdown,
    topProducts,
  }
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export const getSellerAnalytics = async (sellerId: string, days = 30) => {
  const sellerOid  = new mongoose.Types.ObjectId(sellerId)
  const productIds = await Product.find({ sellerId: sellerOid }).distinct('_id')
  const since      = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const orderMatch = productIds.length > 0
    ? { 'items.productId': { $in: productIds } }
    : { _id: null }

  const [revenueByDay, orderStatusBreakdown, topProducts, totals] = await Promise.all([
    Order.aggregate([
      { $match: { ...orderMatch, paymentStatus: 'paid', createdAt: { $gte: since } } },
      {
        $group: {
          _id:     { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$grandTotal' },
          orders:  { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: orderMatch },
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
    ]),
    productIds.length > 0
      ? Order.aggregate([
          { $match: { 'items.productId': { $in: productIds }, paymentStatus: 'paid' } },
          { $unwind: '$items' },
          { $match: { 'items.productId': { $in: productIds } } },
          {
            $group: {
              _id:          '$items.productId',
              title:        { $first: '$items.title' },
              image:        { $first: '$items.image' },
              totalSold:    { $sum: '$items.quantity' },
              totalRevenue: { $sum: '$items.lineTotal' },
            },
          },
          { $sort: { totalRevenue: -1 } },
          { $limit: 5 },
        ])
      : Promise.resolve([]),
    Order.aggregate([
      { $match: { ...orderMatch, paymentStatus: 'paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$grandTotal' }, totalOrders: { $sum: 1 } } },
    ]),
  ])

  const totalRevenue  = totals[0]?.totalRevenue ?? 0
  const totalOrders   = totals[0]?.totalOrders  ?? 0
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  return { revenueByDay, orderStatusBreakdown, topProducts, totalRevenue, totalOrders, avgOrderValue }
}

// ─── Earnings ─────────────────────────────────────────────────────────────────
export const getSellerEarnings = async (sellerId: string) => {
  const sellerOid  = new mongoose.Types.ObjectId(sellerId)
  const productIds = await Product.find({ sellerId: sellerOid }).distinct('_id')

  const now            = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
  const sixMonthsAgo   = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const orderMatch = productIds.length > 0
    ? { 'items.productId': { $in: productIds } }
    : { _id: null }

  const [totalResult, thisMonth, lastMonth, pending, revenueByMonth] = await Promise.all([
    Order.aggregate([
      { $match: { ...orderMatch, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } },
    ]),
    Order.aggregate([
      { $match: { ...orderMatch, paymentStatus: 'paid', createdAt: { $gte: thisMonthStart } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } },
    ]),
    Order.aggregate([
      { $match: { ...orderMatch, paymentStatus: 'paid', createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } },
    ]),
    Order.aggregate([
      { $match: { ...orderMatch, paymentStatus: 'pending' } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } },
    ]),
    Order.aggregate([
      { $match: { ...orderMatch, paymentStatus: 'paid', createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id:     { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$grandTotal' },
          orders:  { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ])

  const totalRevenue  = totalResult[0]?.total ?? 0
  const netRevenue    = totalRevenue * (1 - PLATFORM_FEE)

  return {
    totalRevenue,
    netRevenue,
    platformFeePercent: PLATFORM_FEE * 100,
    thisMonthRevenue:   thisMonth[0]?.total ?? 0,
    lastMonthRevenue:   lastMonth[0]?.total ?? 0,
    pendingBalance:     pending[0]?.total   ?? 0,
    availableBalance:   netRevenue,
    revenueByMonth,
  }
}
