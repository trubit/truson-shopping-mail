import { create } from 'zustand'
import type { ICreateOrderResponse, IOrder } from '../../shared/types/index.js'
import { DEFAULT_CURRENCY } from '../../shared/constants/index.js'

export type PaymentStep     = 'form' | 'processing' | 'success' | 'failed'
export type PaymentProvider = 'stripe' | 'paystack'

interface PaymentState {
  orderId:      string | null
  orderNumber:  string | null
  clientSecret: string | null
  amount:       number | null
  currency:     string
  order:        IOrder | null
  step:         PaymentStep
  errorMessage: string | null
  provider:     PaymentProvider

  setPaymentIntent: (data: ICreateOrderResponse) => void
  setOrder:         (order: IOrder) => void
  setStep:          (step: PaymentStep) => void
  setError:         (msg: string | null) => void
  setProvider:      (p: PaymentProvider) => void
  reset:            () => void
}

const initial = {
  orderId:      null,
  orderNumber:  null,
  clientSecret: null,
  amount:       null,
  currency:     DEFAULT_CURRENCY.toLowerCase(),
  order:        null,
  step:         'form' as PaymentStep,
  errorMessage: null,
  provider:     'stripe' as PaymentProvider,
}

export const usePaymentStore = create<PaymentState>((set) => ({
  ...initial,

  setPaymentIntent: (data) =>
    set({
      orderId:      data.orderId,
      orderNumber:  data.orderNumber,
      clientSecret: data.clientSecret,
      amount:       data.amount,
      currency:     data.currency,
      step:         'form',
      errorMessage: null,
      provider:     'stripe',
    }),

  setOrder:    (order) => set({ order }),
  setStep:     (step)  => set({ step }),
  setError:    (msg)   => set({ errorMessage: msg }),
  setProvider: (p)     => set({ provider: p, step: 'form', errorMessage: null }),
  reset:       ()      => set(initial),
}))
