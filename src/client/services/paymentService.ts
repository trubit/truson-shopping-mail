import api from './api.js'
import type { IPaymentStatusResponse, IRefundRequest, IRefundResponse } from '../../shared/types/index.js'

const unwrap = <T>(res: { data: { data: T } }): T => res.data.data

export const paymentService = {
  getPaymentStatus(paymentIntentId: string): Promise<IPaymentStatusResponse> {
    return api.get(`/payment/status/${paymentIntentId}`).then(unwrap<IPaymentStatusResponse>)
  },

  refundPayment(input: IRefundRequest): Promise<IRefundResponse> {
    return api.post('/payment/refund', input).then(unwrap<IRefundResponse>)
  },
}
