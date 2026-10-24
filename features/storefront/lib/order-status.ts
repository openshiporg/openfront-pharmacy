import type { DotTone } from '../components/rx-ui'

/** Status dot colour for an order or fulfillment state, shared by tracking and the account pages. */
export function orderTone(status: string): DotTone {
  if (['handed_off', 'completed', 'delivered', 'ready', 'ready_for_pickup', 'out_for_delivery'].includes(status)) return 'ok'
  if (['cancelled', 'exception', 'payment_failed'].includes(status)) return 'danger'
  if (['review_required', 'on_hold', 'pending'].includes(status)) return 'warn'
  return 'info'
}

const ORDER_LABELS: Record<string, string> = {
  processing: 'Preparing',
  preparing: 'Preparing',
  ready: 'Ready for pickup',
  ready_for_pickup: 'Ready for pickup',
  out_for_delivery: 'Out for delivery',
  handed_off: 'Completed',
  completed: 'Completed',
  payment_failed: 'Payment failed',
}

/** One name per order state, whether it comes from the order or its fulfillment. */
export function orderStatusLabel(status: string) {
  return ORDER_LABELS[status] || status.replaceAll('_', ' ')
}
