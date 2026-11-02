// Only unpaid manual pickup tenders may be voided locally. Provider tenders
// and captured funds require reconciliation/refund before cancellation.
const SETTLED_PAYMENT_STATUSES = new Set(['refunded', 'failed', 'cancelled'])
const OPEN_FULFILLMENT_STATUSES = new Set(['pending', 'preparing', 'ready', 'out_for_delivery'])
type CancellationPayment = string | null | undefined | { status?: string | null; provider?: { createPaymentFunction?: string | null } | null }
export function isUnpaidPickupPayment(payment: CancellationPayment) {
  return typeof payment === 'object' && payment !== null && payment.status === 'pending' && payment.provider?.createPaymentFunction === 'manual'
}
export function canCancelFulfillment(fulfillmentStatus: string | null | undefined, payments: CancellationPayment[]) {
  if (!fulfillmentStatus || !OPEN_FULFILLMENT_STATUSES.has(fulfillmentStatus)) return false
  return payments.every((payment) => isUnpaidPickupPayment(payment) || SETTLED_PAYMENT_STATUSES.has(String(typeof payment === 'object' ? payment?.status || '' : payment || '')))
}
const FORWARD_TRANSITIONS: Record<string, string[]> = {
  pending: ['preparing'], preparing: ['ready'], ready: ['handed_off'],
}
export function availableFulfillmentTransitions(fulfillmentStatus: string | null | undefined, payments: CancellationPayment[]) {
  const forward = FORWARD_TRANSITIONS[fulfillmentStatus || ''] || []
  return canCancelFulfillment(fulfillmentStatus, payments) ? [...forward, 'cancelled'] : forward
}
