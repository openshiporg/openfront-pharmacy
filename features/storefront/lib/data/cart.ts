'use server'

import { revalidatePath } from 'next/cache'

import type { PharmacyCartProjection } from '@/features/pharmacy/contracts'
import { storefrontRequest, type StorefrontResult } from '../storefront-client'
import { getStoredCart, removeStoredCart, setStoredCart, setStoredLocationId } from './cookies'
import { getStorefront } from './store'

const CART_FIELDS = 'id status fulfillmentMethod subtotalAmount taxAmount deliveryAmount totalAmount expiresAt organization { id name } location { id name pickupEnabled deliveryEnabled } items { id quantity unitPriceAmount product { id title handle description category priceAmount currencyCode imageUrl prescriptionRequirement } }'

const OTHER_LOCATION_CART_ERROR = 'Your cart is for another location. Empty your cart to shop here.'

/** The customer's active cart from the cart cookie, or null. */
export async function retrieveCart(): Promise<PharmacyCartProjection | null> {
  const stored = await getStoredCart()
  if (!stored) return null
  const response = await storefrontRequest<{ pharmacyCart: PharmacyCartProjection }>(`query StorefrontCart($cartId: ID!, $guestToken: String) { pharmacyCart(cartId: $cartId, guestToken: $guestToken) { ${CART_FIELDS} } }`, stored)
  if (!response.success || response.data.pharmacyCart.status !== 'active') return null
  return response.data.pharmacyCart
}

export async function addToCart(input: { productId: string; locationId: string; quantity?: number }): Promise<StorefrontResult<PharmacyCartProjection>> {
  let stored = await getStoredCart()
  const current = stored ? await retrieveCart() : null
  if (current && current.location.id !== input.locationId) {
    if (current.items.length) return { success: false, error: OTHER_LOCATION_CART_ERROR }
    stored = null
  }
  if (!current) stored = null
  if (!stored) {
    const storefront = await getStorefront()
    if (!storefront) return { success: false, error: 'Online ordering is unavailable right now.' }
    const created = await storefrontRequest<{ createPharmacyCart: { cart: PharmacyCartProjection; guestToken: string | null } }>(
      `mutation StorefrontCreateCart($locationId: ID!, $tenantKey: String) { createPharmacyCart(locationId: $locationId, tenantKey: $tenantKey) { guestToken cart { id } } }`,
      { locationId: input.locationId, tenantKey: storefront.brand.tenantKey },
      'Online ordering is unavailable at this location.',
    )
    if (!created.success) return created
    stored = { cartId: created.data.createPharmacyCart.cart.id, guestToken: created.data.createPharmacyCart.guestToken }
    await setStoredCart(stored)
    await setStoredLocationId(input.locationId)
  }
  const response = await storefrontRequest<{ addPharmacyCartItem: PharmacyCartProjection }>(
    `mutation StorefrontAddItem($cartId: ID!, $guestToken: String, $productId: ID!, $quantity: Int!) { addPharmacyCartItem(cartId: $cartId, guestToken: $guestToken, productId: $productId, quantity: $quantity) { ${CART_FIELDS} } }`,
    { ...stored, productId: input.productId, quantity: input.quantity ?? 1 },
    'This item could not be added. Please try again.',
  )
  if (!response.success) return response
  revalidatePath('/', 'layout')
  return { success: true, data: response.data.addPharmacyCartItem }
}

export async function updateCartItem(input: { cartItemId: string; quantity: number }): Promise<StorefrontResult<PharmacyCartProjection>> {
  const stored = await getStoredCart()
  if (!stored) return { success: false, error: 'Your cart has expired.' }
  const response = await storefrontRequest<{ updatePharmacyCartItem: PharmacyCartProjection }>(
    `mutation StorefrontUpdateItem($cartItemId: ID!, $guestToken: String, $quantity: Int!) { updatePharmacyCartItem(cartItemId: $cartItemId, guestToken: $guestToken, quantity: $quantity) { ${CART_FIELDS} } }`,
    { cartItemId: input.cartItemId, guestToken: stored.guestToken, quantity: input.quantity },
    'Your cart could not be updated. Please try again.',
  )
  if (!response.success) return response
  revalidatePath('/', 'layout')
  return { success: true, data: response.data.updatePharmacyCartItem }
}

export async function clearCart() {
  await removeStoredCart()
  revalidatePath('/', 'layout')
}
