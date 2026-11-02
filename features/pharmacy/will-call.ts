/** Whole days a filled will-call prescription has waited, counted from its live label; null when not in will-call. */
export function willCallDays(readyAt: string | null | undefined, now = Date.now()) {
  if (!readyAt) return null
  const at = new Date(readyAt).getTime()
  return Number.isFinite(at) ? Math.max(0, Math.floor((now - at) / 86_400_000)) : null
}

/** Whether a will-call fill has reached the store's return-to-stock review day. Staff still confirm every return. */
export function willCallDue(readyAt: string | null | undefined, returnDays: number, now = Date.now()) {
  const days = willCallDays(readyAt, now)
  return days !== null && days >= returnDays
}

export type WillCallFilter = '7' | 'due'
const DAY = 86_400_000

/**
 * Prescription `where` for the will-call queue filters: still waiting for pickup with a live label (not voided,
 * not sold) printed on or before the cutoff. "7" is a fixed week; "due" uses each store's own review day.
 */
export function willCallWhere(filter: WillCallFilter, stores: readonly { id: string; willCallReturnDays?: number | null }[], now = Date.now()) {
  const agedBefore = (days: number) => ({ status: { equals: 'ready_for_pickup' }, dispensingLabels: { some: { voidedAt: null, order: null, dispensedAt: { lte: new Date(now - days * DAY).toISOString() } } } })
  if (filter === '7') return agedBefore(7)
  return { OR: stores.map((store) => ({ organization: { id: { equals: store.id } }, ...agedBefore(store.willCallReturnDays ?? 10) })) }
}

/** The queue exception shown once a will-call fill reaches the store's review day; null before then. */
export function willCallException(readyAt: string | null | undefined, returnDays: number, now = Date.now()) {
  const days = willCallDays(readyAt, now)
  if (days === null || days < returnDays) return null
  return `In will-call ${days} ${days === 1 ? 'day' : 'days'}: review for return to stock`
}
