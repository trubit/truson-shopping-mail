import axios, { type AxiosError } from 'axios'
import crypto from 'crypto'
import { env }               from '../../config/env.js'
import { Order }             from '../order/order.model.js'
import { Payment }           from './payment.model.js'
import { Product }           from '../product/product.model.js'
import { AppError }          from '../../middlewares/error.middleware.js'
import { emitToUser }        from '../../sockets/index.js'
import { createNotification } from '../notification/notification.model.js'
import { cacheSetAdd }       from '../../utils/cache.js'
import { logger }            from '../../utils/logger.js'

const PAYSTACK_BASE = 'https://api.paystack.co'

// Create once at module load — reuses HTTP keep-alive connections across calls.
// Lazy initialisation: the secret may not exist if Paystack is disabled.
let _client: ReturnType<typeof axios.create> | null = null

function client() {
  if (!env.PAYSTACK_SECRET_KEY) throw new AppError('Paystack is not configured on this server', 503)
  if (!_client) {
    _client = axios.create({
      baseURL: PAYSTACK_BASE,
      headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
      timeout: 15_000,
    })
  }
  return _client
}

// ─── Initialize ───────────────────────────────────────────────────────────────
export const initializeTransaction = async (orderId: string, userId: string, email: string) => {
  const order = await Order.findOne({ _id: orderId, userId })
  if (!order) throw new AppError('Order not found', 404)
  if (order.paymentStatus === 'paid') throw new AppError('Order is already paid', 400)

  const currency    = env.PAYSTACK_CURRENCY
  const amountMinor = Math.round(order.grandTotal * 100)
  const reference   = `TSM-${order.orderNumber}-${Date.now()}`

  type InitRes = { data: { access_code: string; authorization_url: string } }
  let initData: InitRes
  try {
    const res = await client().post<InitRes>('/transaction/initialize', {
      email,
      amount:       amountMinor,
      currency,
      reference,
      metadata:     { orderId: orderId.toString(), userId: userId.toString(), orderNumber: order.orderNumber },
      callback_url: `${env.FRONTEND_URL}/payment/paystack-callback?orderId=${orderId}`,
    })
    initData = res.data
  } catch (err) {
    const ae = err as AxiosError<{ message?: string }>
    const msg = ae.response?.data?.message ?? 'Failed to initialize Paystack transaction'
    throw new AppError(msg, ae.response?.status ?? 502)
  }

  await Order.findByIdAndUpdate(orderId, { paystackReference: reference })

  const existing = await Payment.findOne({ paymentIntentId: reference })
  if (!existing) {
    await Payment.create({
      userId,
      orderId,
      paymentIntentId: reference,
      paymentMethod:   'paystack',
      currency,
      amount:          order.grandTotal,
      status:          'pending',
    })
  }

  return {
    reference,
    accessCode:       initData.data.access_code,
    authorizationUrl: initData.data.authorization_url,
    publicKey:        env.PAYSTACK_PUBLIC_KEY,
    currency,
    amount:           amountMinor,
  }
}

// ─── Verify (called by frontend after popup closes) ───────────────────────────
export const verifyTransaction = async (reference: string, userId: string) => {
  let txData: Record<string, unknown>
  try {
    const { data } = await client().get<{ data: Record<string, unknown> }>(
      `/transaction/verify/${encodeURIComponent(reference)}`,
    )
    txData = data.data
  } catch (err) {
    const ae = err as AxiosError<{ message?: string }>
    const msg = ae.response?.data?.message ?? 'Failed to verify transaction with Paystack'
    throw new AppError(msg, ae.response?.status ?? 502)
  }
  const tx = txData

  if (tx.status !== 'success') {
    throw new AppError(`Payment not completed — Paystack status: ${String(tx.status)}`, 400)
  }

  const meta    = tx.metadata as Record<string, string> | undefined
  const orderId = meta?.orderId
  if (!orderId) throw new AppError('Paystack metadata missing orderId', 400)

  const order = await Order.findOne({ _id: orderId, userId, paystackReference: reference })
  if (!order) throw new AppError('Order not found for this payment reference', 404)
  if (order.paymentStatus === 'paid') return order

  const [, updated] = await Promise.all([
    Payment.findOneAndUpdate(
      { paymentIntentId: reference },
      { status: 'completed', transactionId: String(tx.id ?? '') },
    ),
    Order.findOneAndUpdate(
      { _id: orderId, userId, paymentStatus: { $ne: 'paid' } },
      {
        $set:  { paymentStatus: 'paid', orderStatus: 'confirmed' },
        $push: {
          'tracking.events': {
            status:      'confirmed',
            description: 'Payment confirmed via Paystack — order is being processed',
            timestamp:   new Date(),
          },
        },
      },
      { returnDocument: 'after' },
    ),
  ])

  if (!updated) return (await Order.findById(orderId)) ?? order

  const uid   = updated.userId.toString()
  const notif = await createNotification({
    userId:  uid,
    type:    'order',
    title:   'Payment confirmed',
    message: `Your Paystack payment for order #${updated.orderNumber} was successful.`,
    link:    `/orders/${updated._id}`,
  }).catch(() => null)
  if (notif) emitToUser(uid, 'notification:new', notif)
  emitToUser(uid, 'order:updated', { orderId: updated._id, orderStatus: 'confirmed', paymentStatus: 'paid' })

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
        logger.error('Inventory reduction incomplete on Paystack verify — possible oversell', {
          orderId: updated._id, expected: updated.items.length, modified: result.modifiedCount,
        })
      }
    } catch (err) {
      logger.error('Inventory reduction failed on Paystack verify — manual reconciliation required', {
        orderId: updated._id, err,
      })
    }
  }

  logger.info('Paystack payment verified', { reference, orderId })
  return updated
}

// ─── Webhook (server-to-server, Paystack calls this) ──────────────────────────
export const handleWebhook = async (rawBody: Buffer, signature: string) => {
  if (!env.PAYSTACK_SECRET_KEY) return

  const hash = crypto
    .createHmac('sha512', env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest('hex')

  if (hash !== signature) throw new AppError('Invalid Paystack webhook signature', 400)

  const event = JSON.parse(rawBody.toString()) as {
    event: string
    data:  Record<string, unknown>
  }

  if (event.event !== 'charge.success') {
    logger.info('Unhandled Paystack event', { event: event.event })
    return
  }

  const tx        = event.data
  const reference = tx.reference as string | undefined
  const meta      = tx.metadata as Record<string, string> | undefined
  const orderId   = meta?.orderId

  if (!orderId || !reference) {
    logger.warn('Paystack webhook missing reference/orderId', { reference, orderId })
    return
  }

  // Idempotency: Paystack delivers webhooks at-least-once; deduplicate by reference.
  // 48-hour TTL covers Paystack's maximum retry window.
  const alreadyProcessed = await cacheSetAdd('paystack:events', reference, 48 * 60 * 60)
  if (alreadyProcessed) {
    logger.info('Paystack webhook duplicate — skipping', { reference })
    return
  }

  const order = await Order.findOne({ _id: orderId, paystackReference: reference, paymentStatus: { $ne: 'paid' } })
  if (!order) {
    logger.info('Paystack webhook: order already paid or not found', { orderId, reference })
    return
  }

  await Promise.all([
    Payment.findOneAndUpdate(
      { paymentIntentId: reference },
      { status: 'completed', transactionId: String(tx.id ?? '') },
    ),
    Order.findOneAndUpdate(
      { _id: orderId, paymentStatus: { $ne: 'paid' } },
      {
        $set:  { paymentStatus: 'paid', orderStatus: 'confirmed' },
        $push: {
          'tracking.events': {
            status:      'confirmed',
            description: 'Payment confirmed via Paystack webhook',
            timestamp:   new Date(),
          },
        },
      },
    ),
  ])

  logger.info('Paystack webhook: order confirmed', { orderId, reference })
}

// ─── Available providers (for frontend capability check) ──────────────────────
export const getProviders = () => {
  const providers: Record<string, { enabled: boolean; methods: string[]; currencies: string[] }> = {
    stripe: {
      enabled:    true,
      methods:    ['card', 'apple_pay', 'google_pay', 'bank_transfer'],
      currencies: ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'JPY'],
    },
    paystack: {
      enabled:    Boolean(env.PAYSTACK_SECRET_KEY),
      methods:    ['card', 'bank_transfer', 'ussd', 'mobile_money', 'qr'],
      currencies: [env.PAYSTACK_CURRENCY || 'NGN'],
    },
  }
  return providers
}
