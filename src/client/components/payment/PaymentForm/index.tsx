import { useState } from 'react'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { FiLock } from 'react-icons/fi'
import SecureCheckout from '../SecureCheckout/index.js'
import PaymentMethods from '../PaymentMethods/index.js'
import { usePaymentStore } from '../../../store/paymentStore.js'

interface PaymentFormProps {
  orderId:  string
  amount:   number
  currency: string
}

export default function PaymentForm({ orderId, amount, currency }: PaymentFormProps) {
  const stripe    = useStripe()
  const elements  = useElements()
  const setStep   = usePaymentStore((s) => s.setStep)
  const setError  = usePaymentStore((s) => s.setError)
  const [loading, setLoading] = useState(false)
  const [stripeReady, setStripeReady] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError(null)
    // Do NOT call setStep('processing') here — it unmounts <Elements> which
    // invalidates the `elements` reference before confirmPayment can use it.

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/complete?orderId=${orderId}`,
      },
      redirect: 'if_required',
    })

    if (error) {
      setError(error.message ?? 'Payment failed. Please try again.')
      setStep('failed')
      setLoading(false)
      return
    }

    if (paymentIntent?.status === 'succeeded') {
      setStep('success')
      window.location.href = `/payment/success?orderId=${orderId}&payment_intent=${paymentIntent.id}`
      return
    }

    if (paymentIntent?.status === 'processing') {
      // Async payment method (e.g. bank transfer) — confirmPayment has
      // already returned, so it is safe to unmount Elements now.
      setStep('processing')
      setLoading(false)
      return
    }

    setError('Unexpected payment state. Please check your order status.')
    setStep('failed')
    setLoading(false)
  }

  return (
    <form className="payment-form" onSubmit={handleSubmit} noValidate>
      <PaymentMethods amount={amount} currency={currency} />

      <div className="payment-form__element-wrap">
        <PaymentElement
          onReady={() => setStripeReady(true)}
          options={{
            layout:  'tabs',
            fields: {
              billingDetails: {
                address: { country: 'auto' },
              },
            },
          }}
        />
      </div>

      <button
        type="submit"
        className="btn payment-form__submit"
        disabled={!stripe || !elements || !stripeReady || loading}
      >
        <FiLock size={16} />
        {loading ? 'Processing payment…' : `Pay ${new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(amount)}`}
      </button>

      <SecureCheckout />
    </form>
  )
}
