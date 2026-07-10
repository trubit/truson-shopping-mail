import { useEffect } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements }   from '@stripe/react-stripe-js'
import { FiArrowLeft } from 'react-icons/fi'
import PaymentForm       from '../../../components/payment/PaymentForm/index.js'
import OrderSummaryPanel from '../../../components/payment/OrderSummaryPanel/index.js'
import PaymentStatus     from '../../../components/payment/PaymentStatus/index.js'
import PaystackPayment   from '../../../components/payment/PaystackPayment/index.js'
import { usePaymentStore } from '../../../store/paymentStore.js'
import { useOrder }        from '../../../hooks/usePayment.js'
import { usePaymentProviders } from '../../../hooks/usePayment.js'

const STRIPE_PK     = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string
const stripePromise = STRIPE_PK ? loadStripe(STRIPE_PK) : null

export default function PaymentPage() {
  const { orderId }  = useParams<{ orderId: string }>()
  const navigate     = useNavigate()
  const {
    clientSecret, amount, currency, step, errorMessage,
    setOrder, provider, setProvider,
  } = usePaymentStore()

  const { data: order }     = useOrder(orderId ?? '')
  const { data: providers } = usePaymentProviders()

  useEffect(() => {
    if (order) setOrder(order)
  }, [order, setOrder])

  if (!clientSecret) return <Navigate to="/checkout" replace />
  if (!orderId)      return <Navigate to="/checkout" replace />

  const paystackEnabled = providers?.paystack?.enabled ?? false

  const stripeOptions = {
    clientSecret,
    appearance: {
      theme:     'stripe' as const,
      variables: {
        colorPrimary:    '#6366f1',
        colorBackground: '#ffffff',
        colorText:       '#1a1a2e',
        borderRadius:    '10px',
        fontFamily:      '"Inter", system-ui, sans-serif',
      },
    },
  }

  return (
    <div className="payment-page">
      <div className="container payment-page__inner">
        <div className="payment-page__header">
          <button className="btn btn-ghost payment-page__back" onClick={() => navigate(-1)}>
            <FiArrowLeft size={16} /> Back
          </button>
          <h1 className="payment-page__title">Secure Payment</h1>
        </div>

        <div className="payment-page__layout">
          <main className="payment-page__main">

            {/* ── Provider selector (only when Paystack is configured) ─────── */}
            {paystackEnabled && step !== 'processing' && (
              <div className="payment-provider-tabs">
                <button
                  className={`payment-provider-tab ${provider === 'stripe' ? 'payment-provider-tab--active' : ''}`}
                  onClick={() => setProvider('stripe')}
                >
                  <span className="payment-provider-tab__icon">💳</span>
                  <span>
                    <strong>Card / Digital Wallet</strong>
                    <small>Stripe — USD, EUR, GBP &amp; more</small>
                  </span>
                </button>
                <button
                  className={`payment-provider-tab ${provider === 'paystack' ? 'payment-provider-tab--active' : ''}`}
                  onClick={() => setProvider('paystack')}
                >
                  <span className="payment-provider-tab__icon">🏦</span>
                  <span>
                    <strong>Bank Transfer / USSD</strong>
                    <small>Paystack — NGN, GHS, KES, ZAR &amp; more</small>
                  </span>
                </button>
              </div>
            )}

            {/* ── Error banner (shared) ─────────────────────────────────────── */}
            {step === 'failed' && errorMessage && provider === 'stripe' && (
              <div className="payment-page__error-banner">
                <PaymentStatus status="failed" message={errorMessage} />
                <button
                  className="btn btn-outline"
                  onClick={() => usePaymentStore.getState().setStep('form')}
                >
                  Try Again
                </button>
              </div>
            )}

            {/* ── Stripe Elements ───────────────────────────────────────────── */}
            {provider === 'stripe' && (
              <>
                {step === 'processing' && (
                  <div className="payment-page__processing">
                    <div className="payment-page__spinner" />
                    <p>Processing your payment, please wait…</p>
                  </div>
                )}

                {!stripePromise && (
                  <div className="payment-page__error-banner">
                    <p>Card payment is not configured. Please use bank transfer or contact support.</p>
                  </div>
                )}

                {stripePromise && (
                  <div style={{ display: step === 'processing' ? 'none' : undefined }}>
                    <Elements stripe={stripePromise} options={stripeOptions}>
                      <PaymentForm
                        orderId={orderId}
                        amount={amount ?? 0}
                        currency={currency}
                      />
                    </Elements>
                  </div>
                )}
              </>
            )}

            {/* ── Paystack ──────────────────────────────────────────────────── */}
            {provider === 'paystack' && (
              <PaystackPayment orderId={orderId} amount={amount ?? 0} />
            )}
          </main>

          <OrderSummaryPanel
            order={order}
            amount={amount ?? 0}
            currency={currency}
            orderNumber={usePaymentStore.getState().orderNumber ?? undefined}
          />
        </div>
      </div>
    </div>
  )
}
