import type { GuestPharmacyOrderProjection } from '@/features/pharmacy/contracts'

export const PUBLIC_ORDER_LOOKUP_MESSAGE = "We couldn't find that order. Check the details from your order confirmation and try again."

export type PublicOrderLookupResult =
  | { ok: true; order: GuestPharmacyOrderProjection }
  | { ok: false; message: typeof PUBLIC_ORDER_LOOKUP_MESSAGE }

export function normalizePublicOrderLookupInput(input: { orderId: string; guestOrderToken: string }) {
  const orderId = input.orderId.trim()
  const guestOrderToken = input.guestOrderToken.trim()
  if (!orderId || !guestOrderToken || orderId.length > 200 || guestOrderToken.length > 512) return null
  return { orderId, guestOrderToken }
}

/**
 * Deliberately ignores every property on the transport/GraphQL error. Public
 * order lookup must not reveal record existence, token mismatch, operations,
 * variables, paths, stack traces, or internal exception details.
 */
export function publicOrderLookupFailure(_cause?: unknown): PublicOrderLookupResult {
  return { ok: false, message: PUBLIC_ORDER_LOOKUP_MESSAGE }
}

export function publicOrderLookupMessage(_cause?: unknown) {
  return PUBLIC_ORDER_LOOKUP_MESSAGE
}
