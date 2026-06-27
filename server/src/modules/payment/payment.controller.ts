import type { Request, Response, NextFunction } from 'express'
import * as paymentService from './payment.service.js'
import { sendSuccess, sendNoContent } from '../../utils/response.js'
import { AppError } from '../../middlewares/error.middleware.js'
import type { RefundInput } from '../../../../src/shared/validators/payment.validators.js'

export const getPaymentStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await paymentService.getPaymentStatus(
      req.params['paymentIntentId'] as string,
      req.user!.userId,
    )
    sendSuccess(res, data, 'Payment status fetched')
  } catch (err) { next(err) }
}

export const handleWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sig = req.headers['stripe-signature']
    if (!sig || typeof sig !== 'string') {
      next(new AppError('Missing Stripe signature', 400))
      return
    }
    await paymentService.handleWebhook(req.body as Buffer, sig)
    sendNoContent(res)
  } catch (err) { next(err) }
}

export const refundPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await paymentService.refundPayment(req.body as RefundInput, req.user!.userId)
    sendSuccess(res, result, 'Refund initiated successfully')
  } catch (err) { next(err) }
}
