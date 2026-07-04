import mongoose from 'mongoose'
import { nanoid }   from 'nanoid'
import Stripe       from 'stripe'
import { Order }    from './order.model.js'
import { Checkout } from '../checkout/checkout.model.js'
import { Cart }     from '../cart/cart.model.js'
import { Coupon }   from '../coupon/coupon.model.js'
import { Product }  from '../product/product.model.js'
import { getStripe, STRIPE_CURRENCY } from '../../config/stripe.js'
import { Payment }  from '../payment/payment.model.js'
import { AppError } from '../../middlewares/error.middleware.js'
import { logger }   from '../../utils/logger.js'
import {
  ORDER_STATUS,
  PAYMENT_STATUS,
  CANCELLABLE_STATUSES,
  RETURNABLE_STATUSES,
  PAGINATION,
  ROLES,
} from '../../../../src/shared/constants/index.js'
import type { CreateOrderInput }       from '../../../../src/shared/validators/payment.validators.js'
import type {
  CancelOrderInput,
  UpdateOrderStatusInput,
  ReturnRequestInput,
  UpdateReturnStatusInput,
} from '../../../../src/shared/validators/order.validators.js'
import type { IOrderDocument }  from './order.model.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const generateOrderNumber = (): string => {
  const date   = new Date()
  const ymd    = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  const suffix = nanoid(6).toUpperCase()
  return `TSM-${ymd}-${suffix}`
}

const defaultTrackingNote = (status: string): string => {
  const map: Record<string, string> = {
    confirmed:       'Order confirmed and ready for processing',
    processing:      'Your order is being prepared and packed',
    shipped:         'Your order has been shipped',
    outForDelivery:  'Your order is out for delivery',
    delivered:       'Your order has been delivered',
    cancelled:       'Order has been cancelled',
    returned:        'Return request has been initiated',
    refunded:        'Order has been refunded',
  }
  return map[status] ?? 'Order status updated'
}

// ─── Create order ─────────────────────────────────────────────────────────────
export const createOrder = async (
  userId: string,
  input:  CreateOrderInput,
): Promise<{ order: IOrderDocument; clientSecret: string }> => {
  const session = await Checkout.findOne({
    _id:       input.checkoutSessionId,
    userId,
    status:    'pending',
    expiresAt: { $gt: new Date() },
  })

  if (!session) {
    throw new AppError('Checkout session not found or expired. Please restart checkout.', 404)
  }
  if (!session.shippingAddress) {
    throw new AppError('Shipping address is required before placing an order.', 400)
  }
  if (session.items.length === 0) {
    throw new AppError('Cannot create an order from an empty checkout session.', 400)
  }

  const amountInCents = Math.round(session.pricing.grandTotal * 100)
  if (amountInCents < 50) {
    throw new AppError('Order total is below the minimum payment amount ($0.50).', 400)
  }

  // Create Stripe PaymentIntent
  let intent: Stripe.PaymentIntent
  try {
    intent = await getStripe().paymentIntents.create({
      amount:   amountInCents,
      currency: STRIPE_CURRENCY,
      metadata: {
        userId:            userId.toString(),
        checkoutSessionId: session._id.toString(),
      },
      automatic_payment_methods: { enabled: true },
    })
  } catch (err) {
    const msg = err instanceof Stripe.errors.StripeError
      ? `Payment setup failed: ${err.message}`
      : 'Payment service is temporarily unavailable. Please try again.'
    throw new AppError(msg, 502)
  }

  const orderNumber = generateOrderNumber()

  const order = await Order.create({
    orderNumber,
    userId,
    checkoutSessionId: session._id,
    items: session.items.map((i) => ({
      productId: i.productId,
      title:     i.title,
      image:     i.image,
      sku:       i.sku,
      quantity:  i.quantity,
      itemPrice: i.itemPrice,
      lineTotal: i.lineTotal,
    })),
    shippingAddress: session.shippingAddress,
    billingAddress:  session.billingAddress ?? session.shippingAddress,
    sameAsShipping:  session.sameAsShipping,
    shippingMethod:  session.shippingMethod,
    subtotal:        session.pricing.subtotal,
    discountAmount:  session.pricing.discountAmount,
    shippingFee:     session.pricing.shippingFee,
    taxAmount:       session.pricing.taxAmount,
    grandTotal:      session.pricing.grandTotal,
    couponCode:      session.couponCode,
    paymentStatus:   PAYMENT_STATUS.PENDING,
    orderStatus:     ORDER_STATUS.PENDING,
    paymentIntentId: intent.id,
    notes:           input.notes,
    // Seed tracking with a "pending" event
    tracking: {
      events: [{
        status:      ORDER_STATUS.PENDING,
        description: 'Order placed — awaiting payment',
        timestamp:   new Date(),
      }],
    },
  })

  await getStripe().paymentIntents.update(intent.id, {
    metadata: {
      orderId:     order._id.toString(),
      orderNumber,
      userId:      userId.toString(),
    },
  })

  await Payment.create({
    userId,
    orderId:         order._id,
    paymentIntentId: intent.id,
    paymentMethod:   'card',
    currency:        STRIPE_CURRENCY.toUpperCase(),
    amount:          session.pricing.grandTotal,
    status:          PAYMENT_STATUS.PENDING,
  })

  if (session.couponCode) {
    await Coupon.updateOne({ code: session.couponCode }, { $inc: { usedCount: 1 } })
  }

  session.status = 'completed'
  await session.save()

  await Cart.updateOne(
    { userId: new mongoose.Types.ObjectId(userId) },
    { $set: { items: [], couponCode: undefined, discountAmount: 0, cartTotal: 0, shippingCost: 0, taxAmount: 0, grandTotal: 0 } },
  )

  return { order, clientSecret: intent.client_secret! }
}

// ─── Get by ID (user-scoped) ──────────────────────────────────────────────────
export const getOrderById = async (orderId: string, userId: string): Promise<IOrderDocument> => {
  const order = await Order.findOne({ _id: orderId, userId })
  if (!order) throw new AppError('Order not found', 404)
  return order
}

// ─── User's orders ────────────────────────────────────────────────────────────
export const getUserOrders = async (userId: string, opts?: {
  status?: string
  page?: number
  limit?: number
}): Promise<{ orders: IOrderDocument[]; total: number }> => {
  const filter: Record<string, unknown> = { userId }
  if (opts?.status) filter.orderStatus = opts.status

  const page  = Math.max(1, opts?.page  ?? PAGINATION.DEFAULT_PAGE)
  const limit = Math.min(PAGINATION.MAX_LIMIT, opts?.limit ?? PAGINATION.DEFAULT_LIMIT)

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Order.countDocuments(filter),
  ])
  return { orders: orders as IOrderDocument[], total }
}

// ─── Get by PaymentIntent (webhook use) ──────────────────────────────────────
export const getOrderByPaymentIntent = async (paymentIntentId: string): Promise<IOrderDocument | null> => {
  return Order.findOne({ paymentIntentId })
}

// ─── Cancel order ─────────────────────────────────────────────────────────────
export const cancelOrder = async (
  orderId: string,
  userId:  string,
  input:   CancelOrderInput,
): Promise<IOrderDocument> => {
  const order = await Order.findOne({ _id: orderId, userId })
  if (!order) throw new AppError('Order not found', 404)

  const isCancellable = (CANCELLABLE_STATUSES as readonly string[]).includes(order.orderStatus)
  if (!isCancellable) {
    throw new AppError(
      `This order cannot be cancelled. Orders in "${order.orderStatus}" status cannot be cancelled. ` +
      'If you have already received the item, please submit a return request instead.',
      400,
    )
  }

  const $set: Record<string, unknown> = {
    orderStatus: ORDER_STATUS.CANCELLED,
    ...(input.reason ? { notes: input.reason } : {}),
  }
  const $push = {
    'tracking.events': {
      status:      ORDER_STATUS.CANCELLED,
      description: input.reason ?? 'Order cancelled by customer',
      timestamp:   new Date(),
    },
  }

  // If already paid → initiate Stripe refund
  if (order.paymentStatus === PAYMENT_STATUS.PAID && order.paymentIntentId) {
    try {
      await getStripe().refunds.create({
        payment_intent: order.paymentIntentId,
        amount:         Math.round(order.grandTotal * 100),
        reason:         'requested_by_customer',
        metadata: {
          orderId,
          userId,
          reason: input.reason ?? 'Customer cancellation',
        },
      })
      $set['paymentStatus'] = PAYMENT_STATUS.REFUNDED
      logger.info('Refund initiated on order cancellation', { orderId })
    } catch (err) {
      logger.warn('Stripe refund failed on order cancellation — manual review required', { orderId, err })
    }
  }

  const updated = await Order.findByIdAndUpdate(
    orderId,
    { $set, $push },
    { returnDocument: 'after', runValidators: true },
  )
  if (!updated) throw new AppError('Order not found', 404)
  return updated
}

// ─── Update order status (seller / admin) ────────────────────────────────────
export const updateOrderStatus = async (
  orderId: string,
  userId:  string,
  role:    string,
  input:   UpdateOrderStatusInput,
): Promise<IOrderDocument> => {
  const order = await Order.findById(orderId)
  if (!order) throw new AppError('Order not found', 404)

  // Sellers may only update orders containing their own products
  if (role === ROLES.SELLER) {
    const sellerProductIds = await Product
      .find({ sellerId: userId })
      .distinct('_id')

    const sellerProductStrs = sellerProductIds.map((id) => id.toString())
    const hasSellerItems = order.items.some((item) =>
      sellerProductStrs.includes(item.productId.toString()),
    )
    if (!hasSellerItems) {
      throw new AppError('You are not authorised to update this order', 403)
    }

    const sellerAllowed = [
      ORDER_STATUS.PROCESSING,
      ORDER_STATUS.SHIPPED,
      ORDER_STATUS.OUT_FOR_DELIVERY,
      ORDER_STATUS.DELIVERED,
    ] as string[]
    if (!sellerAllowed.includes(input.orderStatus)) {
      throw new AppError(
        'Sellers can only advance orders to: processing, shipped, outForDelivery, or delivered',
        400,
      )
    }
  }

  const $set: Record<string, unknown> = { orderStatus: input.orderStatus }

  if (input.tracking) {
    const t = input.tracking
    if (t.trackingNumber)        $set['tracking.trackingNumber']        = t.trackingNumber
    if (t.carrier)               $set['tracking.carrier']               = t.carrier
    if (t.trackingUrl)           $set['tracking.trackingUrl']           = t.trackingUrl
    if (t.estimatedDeliveryDate) $set['tracking.estimatedDeliveryDate'] = new Date(t.estimatedDeliveryDate)
  }

  const event = {
    status:      input.orderStatus,
    location:    input.tracking?.location,
    description: input.tracking?.note ?? defaultTrackingNote(input.orderStatus),
    timestamp:   new Date(),
  }

  const updated = await Order.findByIdAndUpdate(
    orderId,
    { $set, $push: { 'tracking.events': event } },
    { returnDocument: 'after', runValidators: true },
  )
  if (!updated) throw new AppError('Order not found', 404)
  return updated
}

// ─── Request return ───────────────────────────────────────────────────────────
export const requestReturn = async (
  orderId: string,
  userId:  string,
  input:   ReturnRequestInput,
): Promise<IOrderDocument> => {
  const order = await Order.findOne({ _id: orderId, userId })
  if (!order) throw new AppError('Order not found', 404)

  const isReturnable = (RETURNABLE_STATUSES as readonly string[]).includes(order.orderStatus)
  if (!isReturnable) {
    throw new AppError('Returns can only be requested for delivered orders.', 400)
  }

  if (order.returnRequest) {
    throw new AppError('A return request already exists for this order.', 400)
  }

  const updated = await Order.findByIdAndUpdate(
    orderId,
    {
      $set: {
        returnRequest: {
          reason:      input.reason,
          description: input.description,
          status:      'pending',
          requestedAt: new Date(),
        },
      },
      $push: {
        'tracking.events': {
          status:      ORDER_STATUS.RETURNED,
          description: `Return requested: ${input.reason}`,
          timestamp:   new Date(),
        },
      },
    },
    { returnDocument: 'after', runValidators: true },
  )
  if (!updated) throw new AppError('Order not found', 404)
  return updated
}

// ─── Admin: update return request status ─────────────────────────────────────
export const updateReturnStatus = async (
  orderId: string,
  input:   UpdateReturnStatusInput,
): Promise<IOrderDocument> => {
  const order = await Order.findById(orderId)
  if (!order) throw new AppError('Order not found', 404)
  if (!order.returnRequest) throw new AppError('No return request found for this order', 404)

  const $set: Record<string, unknown> = {
    'returnRequest.status':    input.status,
    'returnRequest.resolvedAt': new Date(),
  }
  if (input.refundAmount !== undefined) $set['returnRequest.refundAmount'] = input.refundAmount

  if (input.status === 'completed') {
    $set.orderStatus   = ORDER_STATUS.RETURNED
    $set.paymentStatus = PAYMENT_STATUS.REFUNDED
  }

  const event = {
    status:      input.status === 'completed' ? ORDER_STATUS.RETURNED : order.orderStatus,
    description: input.note ?? `Return request ${input.status}`,
    timestamp:   new Date(),
  }

  const updated = await Order.findByIdAndUpdate(
    orderId,
    { $set, $push: { 'tracking.events': event } },
    { returnDocument: 'after', runValidators: true },
  )
  if (!updated) throw new AppError('Order not found', 404)
  return updated
}

// ─── Seller orders ────────────────────────────────────────────────────────────
export const getSellerOrders = async (
  sellerId: string,
  opts: { status?: string; page?: number; limit?: number },
): Promise<{ orders: IOrderDocument[]; total: number }> => {
  const productIds = await Product.find({ sellerId }).distinct('_id')

  if (productIds.length === 0) {
    return { orders: [], total: 0 }
  }

  const filter: Record<string, unknown> = {
    'items.productId': { $in: productIds },
  }
  if (opts.status) filter.orderStatus = opts.status

  const page  = Math.max(1, opts.page  ?? PAGINATION.DEFAULT_PAGE)
  const limit = Math.min(PAGINATION.MAX_LIMIT, opts.limit ?? PAGINATION.DEFAULT_LIMIT)

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('userId', 'firstName lastName email')
      .lean(),
    Order.countDocuments(filter),
  ])
  return { orders: orders as IOrderDocument[], total }
}
