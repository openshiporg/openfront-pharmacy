import type { DotTone } from '../components/rx-ui'

/** Status dot colour for an order or fulfillment state, shared by tracking and the account pages. */
export function orderTone(status: string): DotTone {
  if (['handed_off', 'completed', 'delivered', 'ready', 'ready_for_pickup', 'out_for_delivery'].includes(status)) return 'ok'
  if (['cancelled', 'exception', 'payment_failed'].includes(status)) return 'danger'
  if (['review_required', 'on_hold', 'pending'].includes(status)) return 'warn'
  return 'info'
}
