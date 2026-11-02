// An order can be cancelled only once no payment still holds the customer's money:
// staff refund first (the refund action), then cancel. Pending pay-at-pickup and
// in-flight refunds keep the order open.
const SETTLED_PAYMENT_STATUSES = new Set(['refunded', 'failed'])
const OPEN_FULFILLMENT_STATUSES = new Set(['pending', 'preparing', 'ready', 'out_for_delivery'])

export function canCancelFulfillment(fulfillmentStatus: string | null | undefined, paymentStatuses: Array<string | null | undefined>) {
  if (!fulfillmentStatus || !OPEN_FULFILLMENT_STATUSES.has(fulfillmentStatus)) return false
  return paymentStatuses.every((status) => SETTLED_PAYMENT_STATUSES.has(String(status || '')))
}

const FORWARD_TRANSITIONS: Record<string, string[]> = {
  pending: ['preparing'],
  preparing: ['ready'],
  ready: ['handed_off'],
}

export function availableFulfillmentTransitions(fulfillmentStatus: string | null | undefined, paymentStatuses: Array<string | null | undefined>) {
  const forward = FORWARD_TRANSITIONS[fulfillmentStatus || ''] || []
  return canCancelFulfillment(fulfillmentStatus, paymentStatuses) ? [...forward, 'cancelled'] : forward
}
