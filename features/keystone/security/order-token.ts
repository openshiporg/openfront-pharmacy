import { createHmac, timingSafeEqual } from 'node:crypto'

function sessionSecret() {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) throw new Error('A strong session secret is required for guest checkout')
  return secret
}

export function createGuestOrderToken(cartId: string, idempotencyKey: string) {
  return createHmac('sha256', sessionSecret()).update(`pharmacy-order:${cartId}:${idempotencyKey}`).digest('base64url')
}

export function verifyGuestOrderToken(cartId: string, idempotencyKey: string, token: string) {
  try {
    const actual = Buffer.from(token)
    const expected = Buffer.from(createGuestOrderToken(cartId, idempotencyKey))
    return actual.length === expected.length && timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}
