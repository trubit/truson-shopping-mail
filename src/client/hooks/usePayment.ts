import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { orderService }   from '../services/orderService.js'
import { paymentService } from '../services/paymentService.js'
import { usePaymentStore } from '../store/paymentStore.js'
import { useCheckoutStore } from '../store/checkoutStore.js'
import type { IRefundRequest } from '../../shared/types/index.js'

import { ORDER_KEY } from './useOrders.js'
export { useMyOrders, useOrder, ORDER_KEY } from './useOrders.js'

export const PAYMENT_KEY = (id: string) => ['payment', 'status', id] as const

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
      if (status === 'completed' || status === 'failed' || status === 'refunded') return false
      return 3000
    },
    staleTime: 0,
  })

// Available payment providers
export const usePaymentProviders = () =>
  useQuery({
    queryKey: ['payment', 'providers'],
    queryFn:  () => paymentService.getProviders(),
    staleTime: 5 * 60 * 1000,
  })

// Initialize Paystack transaction
export const usePaystackInitialize = () => {
  const setStep = usePaymentStore((s) => s.setStep)
  const setError = usePaymentStore((s) => s.setError)

  return useMutation({
    mutationFn: ({ orderId, email }: { orderId: string; email: string }) =>
      paymentService.paystackInitialize(orderId, email),
    onMutate:  () => { setStep('processing') },
    onError:   (err: Error) => { setError(err.message); setStep('failed') },
  })
}

// Verify Paystack transaction after popup closes
export const usePaystackVerify = () => {
  const navigate = useNavigate()
  const setStep  = usePaymentStore((s) => s.setStep)
  const setError = usePaymentStore((s) => s.setError)
  const qc       = useQueryClient()

  return useMutation({
    mutationFn: (reference: string) => paymentService.paystackVerify(reference),
    onMutate:   () => { setStep('processing') },
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ORDER_KEY })
      const orderId = usePaymentStore.getState().orderId
      navigate(orderId ? `/payment/success?orderId=${orderId}` : '/payment/success')
    },
    onError: (err: Error) => { setError(err.message); setStep('failed') },
  })
}

// Request a refund
export const useRefundPayment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: IRefundRequest) => paymentService.refundPayment(input),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ORDER_KEY }) },
  })
}
