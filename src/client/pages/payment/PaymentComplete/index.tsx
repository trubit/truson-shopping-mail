import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

// Handles Stripe's redirect after 3D Secure / redirect-based payment methods.
// Stripe appends: ?payment_intent=pi_...&redirect_status=succeeded|failed
export default function PaymentComplete() {
  const [params]  = useSearchParams()
  const navigate  = useNavigate()
  const orderId       = params.get('orderId') ?? ''
  const redirectStatus = params.get('redirect_status')
  const paymentIntent  = params.get('payment_intent')

  useEffect(() => {
    if (redirectStatus === 'succeeded') {
      navigate(`/payment/success?orderId=${orderId}&payment_intent=${paymentIntent ?? ''}`, { replace: true })
    } else {
      navigate(`/payment/failed?orderId=${orderId}&payment_intent=${paymentIntent ?? ''}`, { replace: true })
    }
  }, [redirectStatus, orderId, paymentIntent, navigate])

  return (
    <div className="payment-complete">
      <div className="payment-complete__spinner" />
      <p>Finalising your payment…</p>
    </div>
  )
}
