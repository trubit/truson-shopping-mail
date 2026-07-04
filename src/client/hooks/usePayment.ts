import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { orderService }   from '../services/orderService.js'
import { paymentService } from '../services/paymentService.js'
import { usePaymentStore } from '../store/paymentStore.js'
import { useCheckoutStore } from '../store/checkoutStore.js'
import type { IRefundRequest } from '../../shared/types/index.js'

// Re-export from useOrders for backward compat
export { useMyOrders, useOrder } from './useOrders.js'

export const ORDER_KEY    = ['orders'] as const
export const PAYMENT_KEY  = (id: string) => ['payment', 'status', id] as const

// Create order + initialize Stripe PaymentIntent
export const useCreateOrder = () => {
  const setPaymentIntent = usePaymentStore((s) => s.setPaymentIntent)
  const checkoutReset    = useCheckoutStore((s) => s.reset)
  const navigate         = useNavigate()

  return useMutation({
    mutationFn: ({ checkoutSessionId, notes }: { checkoutSessionId: string; notes?: string }) =>
      orderService.createOrder(checkoutSessionId, notes),
    onSuccess: (data) => {
      setPaymentIntent(data)
      checkoutReset()
      navigate(`/payment/${data.orderId}`)
    },
  })
}

// Poll payment status
export const usePaymentStatus = (paymentIntentId: string | null) =>
  useQuery({
    queryKey: PAYMENT_KEY(paymentIntentId ?? ''),
    queryFn:  () => paymentService.getPaymentStatus(paymentIntentId!),
    enabled:  Boolean(paymentIntentId),
    refetchInterval: (query) => {
      const status = query.state.data?.paymentStatus
      if (status === 'completed' || status === 'failed') return false
      return 3000
    },
    staleTime: 0,
  })

// Request a refund
export const useRefundPayment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: IRefundRequest) => paymentService.refundPayment(input),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ORDER_KEY }) },
  })
}
