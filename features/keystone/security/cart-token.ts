import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

export function createGuestCartToken() {
  return randomBytes(32).toString('base64url')
}

export function hashGuestCartToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function verifyGuestCartToken(token: string, expectedHash: string) {
  const actual = Buffer.from(hashGuestCartToken(token), 'hex')
  const expected = Buffer.from(expectedHash, 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
