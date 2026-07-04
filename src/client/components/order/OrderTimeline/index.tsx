import { FiCheck, FiClock, FiMapPin } from 'react-icons/fi'
import { formatDate } from '../../../../shared/helpers/index.js'
import type { ITrackingEvent, OrderStatus } from '../../../../shared/types/index.js'
import { ORDER_STATUS_CONFIG } from '../OrderStatus/index.js'

interface OrderTimelineProps {
  events:      ITrackingEvent[]
  orderStatus: OrderStatus
}

// The ordered pipeline of statuses for the progress indicator
const STATUS_PIPELINE: OrderStatus[] = [
  'pending', 'confirmed', 'processing', 'shipped', 'outForDelivery', 'delivered',
]

const pipelineIndex = (s: string) => STATUS_PIPELINE.indexOf(s as OrderStatus)

export default function OrderTimeline({ events, orderStatus }: OrderTimelineProps) {
  const currentIdx  = pipelineIndex(orderStatus)
  const isCancelled = orderStatus === 'cancelled' || orderStatus === 'returned' || orderStatus === 'refunded'

  return (
    <div className="order-timeline">
      {/* ── Status progress bar (only for active orders) ─── */}
      {!isCancelled && (
        <div className="order-timeline__pipeline">
          {STATUS_PIPELINE.map((step, idx) => {
            const cfg   = ORDER_STATUS_CONFIG[step]
            const done  = idx <= currentIdx
            const active = idx === currentIdx
            return (
              <div
                key={step}
                className={[
                  'order-timeline__step',
                  done   ? 'order-timeline__step--done'   : '',
                  active ? 'order-timeline__step--active' : '',
                ].join(' ')}
              >
                <div className="order-timeline__step-icon">
                  {done ? <FiCheck size={14} /> : <span>{cfg.icon}</span>}
                </div>
                <span className="order-timeline__step-label">{cfg.label}</span>
                {idx < STATUS_PIPELINE.length - 1 && (
                  <div className={`order-timeline__connector${done && idx < currentIdx ? ' order-timeline__connector--done' : ''}`} />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Event history ─── */}
      {events.length > 0 && (
        <div className="order-timeline__events">
          <h4 className="order-timeline__events-title">
            <FiClock size={14} /> Shipment History
          </h4>
          <ul className="order-timeline__event-list">
            {[...events].reverse().map((ev, i) => {
              const cfg = ORDER_STATUS_CONFIG[ev.status as OrderStatus]
              return (
                <li key={i} className={`order-timeline__event${i === 0 ? ' order-timeline__event--latest' : ''}`}>
                  <div className="order-timeline__event-dot">
                    {i === 0 ? <FiCheck size={10} /> : null}
                  </div>
                  <div className="order-timeline__event-body">
                    <div className="order-timeline__event-status">
                      <span>{cfg?.icon ?? '•'}</span>
                      {cfg?.label ?? ev.status}
                    </div>
                    <p className="order-timeline__event-desc">{ev.description}</p>
                    {ev.location && (
                      <p className="order-timeline__event-location">
                        <FiMapPin size={11} /> {ev.location}
                      </p>
                    )}
                    <time className="order-timeline__event-time">
                      {formatDate(ev.timestamp, { dateStyle: 'medium', timeStyle: 'short' })}
                    </time>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
