import { cookies } from 'next/headers'

const SESSION_COOKIE = 'keystonejs-session'
const CART_COOKIE = 'pharmacy_cart'
const LOCATION_COOKIE = 'pharmacy_location'

const secure = process.env.NODE_ENV === 'production'

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  return token ? { Cookie: `${SESSION_COOKIE}=${token}` } : {}
}

export async function setAuthToken(token: string) {
  (await cookies()).set(SESSION_COOKIE, token, { maxAge: 60 * 60 * 24 * 30, httpOnly: true, sameSite: 'lax', secure, path: '/' })
}

export async function removeAuthToken() {
  (await cookies()).set(SESSION_COOKIE, '', { maxAge: -1, path: '/' })
}

export type StoredCart = { cartId: string; guestToken: string | null }

export async function getStoredCart(): Promise<StoredCart | null> {
  const value = (await cookies()).get(CART_COOKIE)?.value
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    return typeof parsed?.cartId === 'string' ? { cartId: parsed.cartId, guestToken: typeof parsed.guestToken === 'string' ? parsed.guestToken : null } : null
  } catch {
    return null
  }
}

export async function setStoredCart(cart: StoredCart) {
  (await cookies()).set(CART_COOKIE, JSON.stringify(cart), { maxAge: 60 * 60 * 24 * 7, httpOnly: true, sameSite: 'lax', secure, path: '/' })
}

export async function removeStoredCart() {
  (await cookies()).set(CART_COOKIE, '', { maxAge: -1, path: '/' })
}

export async function getStoredLocationId() {
  return (await cookies()).get(LOCATION_COOKIE)?.value || null
}

export async function setStoredLocationId(locationId: string) {
  (await cookies()).set(LOCATION_COOKIE, locationId, { maxAge: 60 * 60 * 24 * 365, httpOnly: true, sameSite: 'lax', secure, path: '/' })
}
