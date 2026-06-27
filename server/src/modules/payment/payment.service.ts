import Stripe from 'stripe'
import { getStripe, STRIPE_CURRENCY } from '../../config/stripe.js'
import { Payment } from './payment.model.js'
import { Order }   from '../order/order.model.js'
import { AppError } from '../../middlewares/error.middleware.js'
import { env }     from '../../config/env.js'
import { logger }  from '../../utils/logger.js'
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

  await Order.findOneAndUpdate(
    { paymentIntentId: intent.id },
    {
      paymentStatus: 'paid',
      orderStatus:   'confirmed',
    },
  )

  logger.info('Payment succeeded', { intentId: intent.id })
}

const onPaymentFailed = async (intent: Stripe.PaymentIntent) => {
  await Payment.findOneAndUpdate(
    { paymentIntentId: intent.id },
    { status: 'failed', stripeEventData: intent },
  )

  await Order.findOneAndUpdate(
    { paymentIntentId: intent.id },
    { paymentStatus: 'failed', orderStatus: 'cancelled' },
  )

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

  await Order.findOneAndUpdate(
    { paymentIntentId: intentId },
    { paymentStatus: 'refunded', orderStatus: 'refunded' },
  )

  logger.info('Charge refunded', { intentId })
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
