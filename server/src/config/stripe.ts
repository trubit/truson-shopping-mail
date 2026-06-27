import Stripe from 'stripe'
import { env } from './env.js'

export const STRIPE_CURRENCY = (process.env.STRIPE_CURRENCY ?? 'usd').toLowerCase()

let _stripe: Stripe | null = null

// Lazy getter — only instantiates when a payment endpoint is actually called.
// Server boots normally even when STRIPE_SECRET_KEY is not yet configured.
export const getStripe = (): Stripe => {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set. Add it to your .env file.')
  }
  if (!_stripe) {
    _stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-06-24.dahlia',
      typescript: true,
    })
  }
  return _stripe
}
