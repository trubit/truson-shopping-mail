import type { Request, Response, NextFunction } from 'express'
import * as orderService from './order.service.js'
import { sendSuccess, sendCreated } from '../../utils/response.js'
import type { CreateOrderInput } from '../../../../src/shared/validators/payment.validators.js'

export const createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { order, clientSecret } = await orderService.createOrder(
      req.user!.userId,
      req.body as CreateOrderInput,
    )
    sendCreated(res, {
      orderId:      order._id,
      orderNumber:  order.orderNumber,
      clientSecret,
      amount:       order.grandTotal,
      currency:     'usd',
    }, 'Order created — proceed to payment')
  } catch (err) { next(err) }
}

export const getMyOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orders = await orderService.getUserOrders(req.user!.userId)
    sendSuccess(res, orders, 'Orders fetched')
  } catch (err) { next(err) }
}

export const getOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await orderService.getOrderById(
      req.params['id'] as string,
      req.user!.userId,
    )
    sendSuccess(res, order)
  } catch (err) { next(err) }
}
