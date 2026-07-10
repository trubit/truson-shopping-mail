import Stripe from 'stripe'
import { getStripe, STRIPE_CURRENCY } from '../../config/stripe.js'
import { Payment }  from './payment.model.js'
import { Order }    from '../order/order.model.js'
import { Product }  from '../product/product.model.js'
import { AppError } from '../../middlewares/error.middleware.js'
import { emitToUser } from '../../sockets/index.js'
import { createNotification } from '../notification/notification.model.js'
import { cacheSetAdd } from '../../utils/cache.js'
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

  // Idempotency: Stripe delivers events at-least-once; deduplicate using event ID.
  // Store the event ID in Redis for 48 h (longer than Stripe's max retry window).
  const alreadyProcessed = await cacheSetAdd('stripe:events', event.id, 48 * 60 * 60)
  if (alreadyProcessed) {
    logger.info('Stripe webhook duplicate — skipping', { id: event.id })
    return
  }

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

  // Guard: if client /payment/confirm already ran first (set paymentStatus='paid'),
  // skip the update entirely — prevents double stock deduction and duplicate tracking events.
  const order = await Order.findOneAndUpdate(
    { paymentIntentId: intent.id, paymentStatus: { $ne: 'paid' } },
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
      const result = await Product.bulkWrite(bulkOps, { ordered: false })
      if (result.modifiedCount < order.items.length) {
        // Some items may have been out-of-stock at payment time — log for ops review.
        logger.error('Inventory reduction incomplete — possible oversell', {
          orderId:       order._id,
          expected:      order.items.length,
          modified:      result.modifiedCount,
          paymentIntent: order.paymentIntentId,
        })
      }
    } catch (err) {
      logger.error('Inventory reduction failed — manual reconciliation required', {
        orderId:       order._id,
        paymentIntent: order.paymentIntentId,
        err,
      })
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

  // Run Payment record update and Order update in parallel — no data dependency between them.
  // Order filter includes paymentStatus guard so webhook racing this call cannot double-apply.
  const [, updated] = await Promise.all([
    Payment.findOneAndUpdate(
      { paymentIntentId },
      { status: 'completed', transactionId, stripeEventData: intent },
    ),
    Order.findOneAndUpdate(
      { paymentIntentId, userId, paymentStatus: { $ne: 'paid' } },
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
    ),
  ])

  // If updated is null the webhook already confirmed this order between our guard check
  // and the update — return the current order state (already paid, nothing to do).
  if (!updated) {
    const current = await Order.findOne({ paymentIntentId, userId })
    return current ?? order
  }

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

  if (updated.items.length > 0) {
    const bulkOps = updated.items.map((item) => ({
      updateOne: {
        filter: { _id: item.productId, stockQuantity: { $gte: item.quantity } },
        update: { $inc: { stockQuantity: -item.quantity } },
      },
    }))
    try {
      const result = await Product.bulkWrite(bulkOps, { ordered: false })
      if (result.modifiedCount < updated.items.length) {
        logger.error('Inventory reduction incomplete on confirm — possible oversell', {
          orderId: updated._id, expected: updated.items.length, modified: result.modifiedCount,
        })
      }
    } catch (err) {
      logger.error('Inventory reduction failed on confirm — manual reconciliation required', {
        orderId: updated._id, err,
      })
    }
  }

  logger.info('Payment confirmed via client endpoint', { paymentIntentId, orderId: updated._id })
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

  // idempotencyKey (second arg) prevents duplicate refunds on network retry
  // or concurrent charge.refunded webhook delivery.
  const refund = await getStripe().refunds.create(
    {
      payment_intent: order.paymentIntentId,
      amount:         amountCents,
      reason:         'requested_by_customer',
      metadata: {
        orderId: order._id.toString(),
        userId:  userId.toString(),
        reason:  input.reason ?? '',
      },
    },
    { idempotencyKey: `refund-${order._id.toString()}` },
  )

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
