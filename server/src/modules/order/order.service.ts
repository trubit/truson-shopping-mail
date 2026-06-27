import mongoose from 'mongoose'
import { nanoid } from 'nanoid'
import Stripe from 'stripe'
import { Order }    from './order.model.js'
import { Checkout } from '../checkout/checkout.model.js'
import { Cart }     from '../cart/cart.model.js'
import { Coupon }   from '../coupon/coupon.model.js'
import { getStripe, STRIPE_CURRENCY } from '../../config/stripe.js'
import { Payment }  from '../payment/payment.model.js'
import { AppError } from '../../middlewares/error.middleware.js'
import type { CreateOrderInput } from '../../../../src/shared/validators/payment.validators.js'
import type { IOrderDocument }  from './order.model.js'

const generateOrderNumber = (): string => {
  const date   = new Date()
  const ymd    = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  const suffix = nanoid(6).toUpperCase()
  return `TSM-${ymd}-${suffix}`
}

export const createOrder = async (
  userId: string,
  input:  CreateOrderInput,
): Promise<{ order: IOrderDocument; clientSecret: string }> => {
  const session = await Checkout.findOne({
    _id:    input.checkoutSessionId,
    userId,
    status: 'pending',
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
    userId:            userId,
    checkoutSessionId: session._id,
    items:             session.items.map((i) => ({
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
    paymentStatus:   'pending',
    orderStatus:     'pending',
    paymentIntentId: intent.id,
    notes:           input.notes,
  })

  // Link the PaymentIntent to our order
  await getStripe().paymentIntents.update(intent.id, {
    metadata: {
      orderId:     order._id.toString(),
      orderNumber: orderNumber,
      userId:      userId.toString(),
    },
  })

  // Create Payment record
  await Payment.create({
    userId,
    orderId:         order._id,
    paymentIntentId: intent.id,
    paymentMethod:   'card',
    currency:        STRIPE_CURRENCY.toUpperCase(),
    amount:          session.pricing.grandTotal,
    status:          'pending',
  })

  // Increment coupon usedCount if one was applied
  if (session.couponCode) {
    await Coupon.updateOne({ code: session.couponCode }, { $inc: { usedCount: 1 } })
  }

  // Mark checkout session as completed
  session.status = 'completed'
  await session.save()

  // Clear the user's cart
  await Cart.updateOne(
    { userId: new mongoose.Types.ObjectId(userId) },
    { $set: { items: [], couponCode: undefined, discountAmount: 0, cartTotal: 0, shippingCost: 0, taxAmount: 0, grandTotal: 0 } },
  )

  return { order, clientSecret: intent.client_secret! }
}

export const getOrderById = async (orderId: string, userId: string): Promise<IOrderDocument> => {
  const order = await Order.findOne({ _id: orderId, userId })
  if (!order) throw new AppError('Order not found', 404)
  return order
}

export const getUserOrders = async (userId: string): Promise<IOrderDocument[]> => {
  return Order.find({ userId }).sort({ createdAt: -1 }).lean()
}

export const getOrderByPaymentIntent = async (paymentIntentId: string): Promise<IOrderDocument | null> => {
  return Order.findOne({ paymentIntentId })
}
