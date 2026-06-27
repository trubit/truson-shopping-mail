import api from './api.js'
import type { IOrder, ICreateOrderResponse } from '../../shared/types/index.js'

const unwrap = <T>(res: { data: { data: T } }): T => res.data.data

export const orderService = {
  createOrder(checkoutSessionId: string, notes?: string): Promise<ICreateOrderResponse> {
    return api.post('/orders', { checkoutSessionId, notes }).then(unwrap<ICreateOrderResponse>)
  },

  getMyOrders(): Promise<IOrder[]> {
    return api.get('/orders').then(unwrap<IOrder[]>)
  },

  getOrder(orderId: string): Promise<IOrder> {
    return api.get(`/orders/${orderId}`).then(unwrap<IOrder>)
  },
}
