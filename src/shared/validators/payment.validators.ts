import { z } from 'zod'

export const createOrderSchema = z.object({
  checkoutSessionId: z.string().min(1, 'Checkout session ID is required'),
  notes:             z.string().max(500).optional(),
})

export const refundSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  reason:  z.string().max(500).optional(),
})

export const paymentStatusSchema = z.object({
  paymentIntentId: z.string().min(1),
})

export type CreateOrderInput    = z.infer<typeof createOrderSchema>
export type RefundInput         = z.infer<typeof refundSchema>
export type PaymentStatusInput  = z.infer<typeof paymentStatusSchema>
