import { FiTruck, FiExternalLink, FiCalendar, FiHash } from 'react-icons/fi'
import { formatDate } from '../../../../shared/helpers/index.js'
import type { IOrderTracking } from '../../../../shared/types/index.js'

interface TrackingInfoProps {
  tracking:      IOrderTracking
  shippingMethod?: string
}

const METHOD_LABEL: Record<string, string> = {
  standard: 'Standard Shipping (5–7 days)',
  express:  'Express Shipping (2–3 days)',
  sameDay:  'Same-Day Delivery',
}

export default function TrackingInfo({ tracking, shippingMethod }: TrackingInfoProps) {
  const hasTracking = tracking.trackingNumber || tracking.carrier

  return (
    <div className="tracking-info">
      <h3 className="tracking-info__title">
        <FiTruck size={16} /> Shipping & Tracking
      </h3>

      {shippingMethod && (
        <div className="tracking-info__row">
          <span className="tracking-info__label">Method</span>
          <span className="tracking-info__value">
            {METHOD_LABEL[shippingMethod] ?? shippingMethod}
          </span>
        </div>
      )}

      {hasTracking ? (
        <>
          {tracking.carrier && (
            <div className="tracking-info__row">
              <span className="tracking-info__label"><FiTruck size={12} /> Carrier</span>
              <span className="tracking-info__value">{tracking.carrier}</span>
            </div>
          )}

          {tracking.trackingNumber && (
            <div className="tracking-info__row">
              <span className="tracking-info__label"><FiHash size={12} /> Tracking #</span>
              <span className="tracking-info__value tracking-info__number">
                {tracking.trackingUrl ? (
                  <a href={tracking.trackingUrl} target="_blank" rel="noopener noreferrer" className="tracking-info__link">
                    {tracking.trackingNumber}
                    <FiExternalLink size={11} />
                  </a>
                ) : (
                  tracking.trackingNumber
                )}
              </span>
            </div>
          )}

          {tracking.estimatedDeliveryDate && (
            <div className="tracking-info__row">
              <span className="tracking-info__label"><FiCalendar size={12} /> Est. Delivery</span>
              <span className="tracking-info__value tracking-info__eta">
                {formatDate(tracking.estimatedDeliveryDate)}
              </span>
            </div>
          )}
        </>
      ) : (
        <p className="tracking-info__pending">
          Tracking information will appear once your order has been shipped.
        </p>
      )}
    </div>
  )
}
