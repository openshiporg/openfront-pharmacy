import { cookies } from 'next/headers'

const SESSION_COOKIE = 'keystonejs-session'
// Production is HTTPS: the cart and location cookies are SameSite=None; Secure;
// Partitioned (CHIPS), so the shop keeps its cart when it is framed (the
// Oathkeeper Browser, an embed). Safari keeps a framed cookie only when it is
// partitioned; a partitioned cookie is scoped to the top-level site, so a
// direct visit behaves as before. They use new names because a browser keeps a
// partitioned and an unpartitioned cookie of the same name side by side; the
// earlier Lax cookies are still read once and then cleared.
const CART_COOKIE = 'pharmacy_cart_p'
const LOCATION_COOKIE = 'pharmacy_location_p'
const LEGACY_CART_COOKIE = 'pharmacy_cart'
const LEGACY_LOCATION_COOKIE = 'pharmacy_location'

const secure = process.env.NODE_ENV === 'production'
const shopperCookie = secure
  ? { httpOnly: true, sameSite: 'none' as const, secure: true, partitioned: true, path: '/' }
  : { httpOnly: true, sameSite: 'lax' as const, secure: false, path: '/' }

async function clearLegacy(jar: Awaited<ReturnType<typeof cookies>>, name: string) {
  if (jar.get(name)) jar.set(name, '', { maxAge: -1, path: '/' })
}

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
  const jar = await cookies()
  const value = jar.get(CART_COOKIE)?.value || jar.get(LEGACY_CART_COOKIE)?.value
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    return typeof parsed?.cartId === 'string' ? { cartId: parsed.cartId, guestToken: typeof parsed.guestToken === 'string' ? parsed.guestToken : null } : null
  } catch {
    return null
  }
}

export async function setStoredCart(cart: StoredCart) {
  const jar = await cookies()
  jar.set(CART_COOKIE, JSON.stringify(cart), { maxAge: 60 * 60 * 24 * 7, ...shopperCookie })
  await clearLegacy(jar, LEGACY_CART_COOKIE)
}

export async function removeStoredCart() {
  const jar = await cookies()
  jar.set(CART_COOKIE, '', { maxAge: -1, ...shopperCookie })
  await clearLegacy(jar, LEGACY_CART_COOKIE)
}

export async function getStoredLocationId() {
  const jar = await cookies()
  return jar.get(LOCATION_COOKIE)?.value || jar.get(LEGACY_LOCATION_COOKIE)?.value || null
}

export async function setStoredLocationId(locationId: string) {
  const jar = await cookies()
  jar.set(LOCATION_COOKIE, locationId, { maxAge: 60 * 60 * 24 * 365, ...shopperCookie })
  await clearLegacy(jar, LEGACY_LOCATION_COOKIE)
}
