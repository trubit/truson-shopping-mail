import api from './api.js'
import type { ICheckoutBootstrap, ICheckoutSession } from '../../shared/types/checkout.types.js'
import type {
  UpdateCheckoutInput,
  SelectShippingInput,
  ApplyCouponInput,
} from '../../shared/validators/checkout.validators.js'

const unwrap = <T>(res: { data: { data?: T } }): T => res.data.data as T

export const checkoutService = {
  getCheckout: (): Promise<ICheckoutBootstrap> =>
    api.get('/checkout').then(unwrap<ICheckoutBootstrap>),

  updateCheckout: (input: UpdateCheckoutInput): Promise<ICheckoutSession> =>
    api.put('/checkout/update', input).then(unwrap<ICheckoutSession>),

  selectShipping: (input: SelectShippingInput): Promise<ICheckoutSession> =>
    api.post('/checkout/select-shipping', input).then(unwrap<ICheckoutSession>),

  applyCoupon: (input: ApplyCouponInput): Promise<ICheckoutSession> =>
    api.post('/checkout/apply-coupon', input).then(unwrap<ICheckoutSession>),

  removeCoupon: (): Promise<ICheckoutSession> =>
    api.delete('/checkout/coupon').then(unwrap<ICheckoutSession>),
}
