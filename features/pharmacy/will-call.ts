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
