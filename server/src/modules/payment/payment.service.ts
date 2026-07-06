import Stripe from 'stripe'
import { getStripe, STRIPE_CURRENCY } from '../../config/stripe.js'
import { Payment }  from './payment.model.js'
import { Order }    from '../order/order.model.js'
import { Product }  from '../product/product.model.js'
import { AppError } from '../../middlewares/error.middleware.js'
import { emitToUser } from '../../sockets/index.js'
import { createNotification } from '../notification/notification.model.js'
import { env }      from '../../config/env.js'
import { logger }   from '../../utils/logger.js'
import type { RefundInput } from '../../../../src/shared/validators/payment.validators.js'

export const getPaymentStatus = async (paymentIntentId: string, userId: string) => {
  const order = await Order.findOne({ paymentIntentId, userId })
  if (!order) throw new AppError('Order not found', 404)

  const payment = await Payment.findOne({ paymentIntentId })

  return {
    orderId:         order._id,
    orderNumber:     order.orderNumber,
    paymentIntentId,
    paymentStatus:   payment?.status ?? 'pending',
    orderStatus:     order.orderStatus,
    amount:          order.grandTotal,
    currency:        STRIPE_CURRENCY,
  }
}

export const handleWebhook = async (rawBody: Buffer, signature: string): Promise<void> => {
  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    throw new AppError(`Webhook signature verification failed: ${msg}`, 400)
  }

  logger.info('Stripe webhook received', { type: event.type, id: event.id })

  switch (event.type) {
    case 'payment_intent.succeeded': {
      await onPaymentSucceeded(event.data.object as Stripe.PaymentIntent)
      break
    }
    case 'payment_intent.payment_failed': {
      await onPaymentFailed(event.data.object as Stripe.PaymentIntent)
      break
    }
    case 'payment_intent.processing': {
      await onPaymentProcessing(event.data.object as Stripe.PaymentIntent)
      break
    }
    case 'charge.refunded': {
      await onChargeRefunded(event.data.object as Stripe.Charge)
      break
    }
    default:
      logger.info('Unhandled Stripe event', { type: event.type })
  }
}

const onPaymentSucceeded = async (intent: Stripe.PaymentIntent) => {
  const transactionId = intent.latest_charge as string | null

  await Payment.findOneAndUpdate(
    { paymentIntentId: intent.id },
    {
      status:          'completed',
      transactionId:   transactionId ?? undefined,
      stripeEventData: intent,
    },
  )

  const order = await Order.findOneAndUpdate(
    { paymentIntentId: intent.id },
    {
      $set:  { paymentStatus: 'paid', orderStatus: 'confirmed' },
      $push: {
        'tracking.events': {
          status:      'confirmed',
          description: 'Payment confirmed — order is being processed',
          timestamp:   new Date(),
        },
      },
    },
    { returnDocument: 'after' },
  )

  // Push real-time order confirmation to user
  if (order) {
    const userId = order.userId.toString()
    const notif  = await createNotification({
      userId,
      type:    'order',
      title:   'Payment confirmed',
      message: `Your payment for order #${order.orderNumber} was confirmed. Your order is now being processed.`,
      link:    `/orders/${order._id}`,
    }).catch(() => null)
    if (notif) emitToUser(userId, 'notification:new', notif)
    emitToUser(userId, 'order:updated', { orderId: order._id, orderStatus: 'confirmed', paymentStatus: 'paid' })
  }

  // Reduce stock atomically for each item — never let quantity go below 0
  if (order && order.items.length > 0) {
    const bulkOps = order.items.map((item) => ({
      updateOne: {
        filter: {
          _id:           item.productId,
          stockQuantity: { $gte: item.quantity },
        },
        update: { $inc: { stockQuantity: -item.quantity } },
      },
    }))
    try {
      await Product.bulkWrite(bulkOps, { ordered: false })
    } catch (err) {
      logger.warn('Inventory reduction partially failed', { orderId: order._id, err })
    }
  }

  logger.info('Payment succeeded', { intentId: intent.id })
}

const onPaymentFailed = async (intent: Stripe.PaymentIntent) => {
  await Payment.findOneAndUpdate(
    { paymentIntentId: intent.id },
    { status: 'failed', stripeEventData: intent },
  )

  const failedOrder = await Order.findOneAndUpdate(
    { paymentIntentId: intent.id },
    { paymentStatus: 'failed', orderStatus: 'cancelled' },
    { returnDocument: 'after' },
  )

  if (failedOrder) {
    const userId = failedOrder.userId.toString()
    const notif  = await createNotification({
      userId,
      type:    'order',
      title:   'Payment failed',
      message: `Payment for order #${failedOrder.orderNumber} was unsuccessful. Please try again or use a different payment method.`,
      link:    `/orders/${failedOrder._id}`,
    }).catch(() => null)
    if (notif) emitToUser(userId, 'notification:new', notif)
    emitToUser(userId, 'order:updated', { orderId: failedOrder._id, orderStatus: 'cancelled', paymentStatus: 'failed' })
  }

  logger.warn('Payment failed', { intentId: intent.id })
}

const onPaymentProcessing = async (intent: Stripe.PaymentIntent) => {
  await Payment.findOneAndUpdate(
    { paymentIntentId: intent.id },
    { status: 'processing', stripeEventData: intent },
  )

  logger.info('Payment processing', { intentId: intent.id })
}

const onChargeRefunded = async (charge: Stripe.Charge) => {
  const intentId = typeof charge.payment_intent === 'string'
    ? charge.payment_intent
    : charge.payment_intent?.id

  if (!intentId) return

  await Payment.findOneAndUpdate(
    { paymentIntentId: intentId },
    { status: 'refunded', stripeEventData: charge },
  )

  const refundedOrder = await Order.findOneAndUpdate(
    { paymentIntentId: intentId },
    { paymentStatus: 'refunded', orderStatus: 'refunded' },
    { returnDocument: 'after' },
  )

  if (refundedOrder) {
    const userId = refundedOrder.userId.toString()
    const notif  = await createNotification({
      userId,
      type:    'order',
      title:   'Refund processed',
      message: `Your refund for order #${refundedOrder.orderNumber} has been processed and will appear in your account shortly.`,
      link:    `/orders/${refundedOrder._id}`,
    }).catch(() => null)
    if (notif) emitToUser(userId, 'notification:new', notif)
    emitToUser(userId, 'order:updated', { orderId: refundedOrder._id, orderStatus: 'refunded', paymentStatus: 'refunded' })
  }

  logger.info('Charge refunded', { intentId })
}

/**
 * Called by the frontend immediately after stripe.confirmPayment() succeeds.
 * Re-verifies the PaymentIntent with Stripe (never trust the client alone), then
 * updates the order to paid/confirmed. Idempotent — safe to run if the webhook
 * already fired first.
 */
export const confirmPayment = async (paymentIntentId: string, userId: string) => {
  const intent = await getStripe().paymentIntents.retrieve(paymentIntentId)

  if (intent.status !== 'succeeded') {
    throw new AppError(`Payment not yet succeeded — status: ${intent.status}`, 400)
  }

  const order = await Order.findOne({ paymentIntentId, userId })
  if (!order) throw new AppError('Order not found for this payment', 404)

  // Idempotent: webhook may have already updated the order
  if (order.paymentStatus === 'paid') {
    return order
  }

  const transactionId = typeof intent.latest_charge === 'string' ? intent.latest_charge : undefined

  await Payment.findOneAndUpdate(
    { paymentIntentId },
    { status: 'completed', transactionId, stripeEventData: intent },
  )

  const updated = await Order.findOneAndUpdate(
    { paymentIntentId, userId },
    {
      $set: { paymentStatus: 'paid', orderStatus: 'confirmed' },
      $push: {
        'tracking.events': {
          status:      'confirmed',
          description: 'Payment confirmed — order is being processed',
          timestamp:   new Date(),
        },
      },
    },
    { returnDocument: 'after' },
  )

  if (updated) {
    const uid  = updated.userId.toString()
    const notif = await createNotification({
      userId:  uid,
      type:    'order',
      title:   'Order confirmed',
      message: `Your payment for order #${updated.orderNumber} was successful. We are now processing your order.`,
      link:    `/orders/${updated._id}`,
    }).catch(() => null)
    if (notif) emitToUser(uid, 'notification:new', notif)
    emitToUser(uid, 'order:updated', {
      orderId:       updated._id,
      orderStatus:   'confirmed',
      paymentStatus: 'paid',
    })
  }

  if (updated && updated.items.length > 0) {
    const bulkOps = updated.items.map((item) => ({
      updateOne: {
        filter: { _id: item.productId, stockQuantity: { $gte: item.quantity } },
        update: { $inc: { stockQuantity: -item.quantity } },
      },
    }))
    await Product.bulkWrite(bulkOps, { ordered: false }).catch((err) =>
      logger.warn('Stock reduction partially failed on confirm', { orderId: updated._id, err }),
    )
  }

  logger.info('Payment confirmed via client endpoint', { paymentIntentId, orderId: updated?._id })
  return updated
}

export const refundPayment = async (input: RefundInput, userId: string) => {
  const order = await Order.findOne({ _id: input.orderId, userId })
  if (!order) throw new AppError('Order not found', 404)

  if (order.paymentStatus !== 'paid') {
    throw new AppError('Only paid orders can be refunded', 400)
  }

  if (!order.paymentIntentId) {
    throw new AppError('No payment intent linked to this order', 400)
  }

  const amountCents = Math.round(order.grandTotal * 100)

  const refund = await getStripe().refunds.create({
    payment_intent: order.paymentIntentId,
    amount:         amountCents,
    reason:         'requested_by_customer',
    metadata: {
      orderId:   order._id.toString(),
      userId:    userId.toString(),
      reason:    input.reason ?? '',
    },
  })

  // Status updates handled by webhook (charge.refunded), but also update optimistically
  await Payment.findOneAndUpdate(
    { paymentIntentId: order.paymentIntentId },
    { status: 'refunded' },
  )

  await Order.findOneAndUpdate(
    { _id: order._id },
    { paymentStatus: 'refunded', orderStatus: 'refunded' },
  )

  return {
    refundId: refund.id,
    orderId:  order._id.toString(),
    amount:   refund.amount / 100,
    status:   refund.status,
    currency: refund.currency,
  }
}
