'use server'

import { keystoneClient } from '@/features/dashboard/lib/keystoneClient'
import type {
  GuestPharmacyOrderProjection,
  PharmacyCartProjection,
  PharmacyCatalogProductProjection,
  PublicPharmacyCatalogProductProjection,
  PharmacyPaymentProviderOption,
  PharmacyPaymentSessionResult,
  PublicPharmacyCatalogPageProjection,
  PublicPharmacyLocationProjection,
  PublicPharmacyTenantProjection,
  SubmitPharmacyOrderProjection,
} from '@/features/pharmacy/contracts'
import { CHECKOUT_POLICY } from '../constants'
import { normalizePublicOrderLookupInput, publicOrderLookupFailure, type PublicOrderLookupResult } from '../public-order-lookup'

function unwrap<T>(response: Awaited<ReturnType<typeof keystoneClient<T>>>) {
  if (!response.success) throw new Error(response.error)
  return response.data
}

export async function getPublicPharmacyCatalogPage(input: { tenantKey: string; locationId: string; search?: string | null; first?: number; after?: string | null }): Promise<PublicPharmacyCatalogPageProjection> {
  const response = await keystoneClient<{ publicPharmacyCatalog: PublicPharmacyCatalogPageProjection }>(`query Catalog($tenantKey: String!, $locationId: ID!, $first: Int, $after: String, $search: String) { publicPharmacyCatalog(tenantKey: $tenantKey, locationId: $locationId, first: $first, after: $after, search: $search) { items { id title handle sku description category priceAmount currencyCode taxable imageUrl prescriptionRequirement availableQuantity inStock inventorySummaryStatus } totalCount hasMore nextCursor } }`, input,
    // @ts-expect-error The restored E-commerce keystoneClient ignores suppressErrorLog and logs failures with their variables; kept until the family upstreams it.
    { suppressErrorLog: true })
  if (!response.success) throw new Error('Storefront catalog is unavailable for this host')
  return response.data.publicPharmacyCatalog
}

export async function getPublicPharmacyTenantPage(input: { tenantKey: string; search?: string | null; first?: number; after?: string | null }): Promise<PublicPharmacyTenantProjection> {
  const response = await keystoneClient<{ publicPharmacyTenant: PublicPharmacyTenantProjection }>(`query Tenant($tenantKey: String!, $search: String, $first: Int, $after: String) { publicPharmacyTenant(tenantKey: $tenantKey, search: $search, first: $first, after: $after) { brand { organizationId tenantKey displayName tagline primaryColor accentColor logoUrl logoIcon logoColor supportEmail supportPhone } locations { id name code address phone onlineOrderingEnabled pickupEnabled deliveryEnabled } locationsTotalCount hasMoreLocations nextLocationCursor } }`, input,
    // @ts-expect-error The restored E-commerce keystoneClient ignores suppressErrorLog and logs failures with their variables; kept until the family upstreams it.
    { suppressErrorLog: true })
  if (!response.success) throw new Error('Storefront is unavailable for this host')
  return response.data.publicPharmacyTenant
}

export async function getPublicPharmacyStorefront(tenantKey: string) {
  const tenant = await getPublicPharmacyTenantPage({ tenantKey, first: 50 })
  const location = tenant.locations[0] || null
  if (!location) return { brand: tenant.brand, location, locations: tenant.locations, locationsTotalCount: tenant.locationsTotalCount, hasMoreLocations: tenant.hasMoreLocations, nextLocationCursor: tenant.nextLocationCursor, products: [] as PublicPharmacyCatalogProductProjection[], productCount: 0, hasMoreProducts: false, nextProductCursor: null }
  const catalog = await getPublicPharmacyCatalogPage({ tenantKey, locationId: location.id, first: 50 })
  return { brand: tenant.brand, location, locations: tenant.locations, locationsTotalCount: tenant.locationsTotalCount, hasMoreLocations: tenant.hasMoreLocations, nextLocationCursor: tenant.nextLocationCursor, products: catalog.items, productCount: catalog.totalCount, hasMoreProducts: catalog.hasMore, nextProductCursor: catalog.nextCursor }
}

export async function createStorefrontCart(locationId: string, tenantKey?: string) {
  return unwrap(await keystoneClient<{ createPharmacyCart: { cart: PharmacyCartProjection; guestToken: string | null } }>(`mutation Create($locationId: ID!, $tenantKey: String) { createPharmacyCart(locationId: $locationId, tenantKey: $tenantKey) { guestToken cart { id status fulfillmentMethod subtotalAmount taxAmount deliveryAmount totalAmount expiresAt organization { id name } location { id name pickupEnabled deliveryEnabled } items { id quantity unitPriceAmount product { id title handle sku description category priceAmount currencyCode imageUrl prescriptionRequirement } } } } }`, { locationId, tenantKey })).createPharmacyCart
}

export async function getStorefrontCart(input: { cartId: string; guestToken: string | null }) {
  return unwrap(await keystoneClient<{ pharmacyCart: PharmacyCartProjection }>(`query Cart($cartId: ID!, $guestToken: String) { pharmacyCart(cartId: $cartId, guestToken: $guestToken) { id status fulfillmentMethod subtotalAmount taxAmount deliveryAmount totalAmount expiresAt organization { id name } location { id name pickupEnabled deliveryEnabled } items { id quantity unitPriceAmount product { id title handle sku description category priceAmount currencyCode imageUrl prescriptionRequirement } } } }`, input)).pharmacyCart
}

export async function addStorefrontCartItem(input: { cartId: string; guestToken: string | null; productId: string; quantity: number }) {
  return unwrap(await keystoneClient<{ addPharmacyCartItem: PharmacyCartProjection }>(`mutation Add($cartId: ID!, $guestToken: String, $productId: ID!, $quantity: Int!) { addPharmacyCartItem(cartId: $cartId, guestToken: $guestToken, productId: $productId, quantity: $quantity) { id status fulfillmentMethod subtotalAmount taxAmount deliveryAmount totalAmount expiresAt organization { id name } location { id name pickupEnabled deliveryEnabled } items { id quantity unitPriceAmount product { id title handle sku description category priceAmount currencyCode imageUrl prescriptionRequirement } } } }`, input)).addPharmacyCartItem
}

export async function updateStorefrontCartItem(input: { cartItemId: string; guestToken: string | null; quantity: number }) {
  return unwrap(await keystoneClient<{ updatePharmacyCartItem: PharmacyCartProjection }>(`mutation Update($cartItemId: ID!, $guestToken: String, $quantity: Int!) { updatePharmacyCartItem(cartItemId: $cartItemId, guestToken: $guestToken, quantity: $quantity) { id status fulfillmentMethod subtotalAmount taxAmount deliveryAmount totalAmount expiresAt organization { id name } location { id name pickupEnabled deliveryEnabled } items { id quantity unitPriceAmount product { id title handle sku description category priceAmount currencyCode imageUrl prescriptionRequirement } } } }`, input)).updatePharmacyCartItem
}

export async function getStorefrontOrder(input: { orderId: string; guestOrderToken: string }): Promise<PublicOrderLookupResult> {
  const credentials = normalizePublicOrderLookupInput(input)
  if (!credentials) return publicOrderLookupFailure()
  try {
    const response = await keystoneClient<{ guestPharmacyOrder: GuestPharmacyOrderProjection | null }>(`query Order($orderId: ID!, $guestOrderToken: String!) { guestPharmacyOrder(orderId: $orderId, guestOrderToken: $guestOrderToken) { id orderNumber status fulfillmentMethod subtotalAmount taxAmount deliveryAmount totalAmount currencyCode pickupAt deliveryWindow createdAt locationName lines { id title sku quantity unitPriceAmount lineTotalAmount imageUrl prescriptionRequirement } fulfillment { method status readyAt handedOffAt } } }`, credentials,
      // @ts-expect-error The restored E-commerce keystoneClient ignores suppressErrorLog and logs failures with their variables; kept until the family upstreams it.
      { suppressErrorLog: true })
    if (!response.success || !response.data.guestPharmacyOrder) return publicOrderLookupFailure(response)
    return { ok: true, order: response.data.guestPharmacyOrder }
  } catch (cause) {
    return publicOrderLookupFailure(cause)
  }
}

export async function getStorefrontPaymentProviders(locationId: string) {
  return unwrap(await keystoneClient<{ activePharmacyPaymentProviders: PharmacyPaymentProviderOption[] }>(`query Providers($locationId: ID!) { activePharmacyPaymentProviders(locationId: $locationId) { code name } }`, { locationId })).activePharmacyPaymentProviders
}

export async function initiateStorefrontPayment(input: { cartId: string; guestToken: string | null; providerCode: string }) {
  return unwrap(await keystoneClient<{ initiatePharmacyPaymentSession: PharmacyPaymentSessionResult }>(`mutation Pay($cartId: ID!, $guestToken: String, $providerCode: String!) { initiatePharmacyPaymentSession(cartId: $cartId, guestToken: $guestToken, providerCode: $providerCode) { id amount currencyCode status providerCode providerName clientSecret } }`, input)).initiatePharmacyPaymentSession
}

export async function submitStorefrontOrder(input: Record<string, unknown>) {
  const idempotentInput = {
    ...input,
    idempotencyKey: input.idempotencyKey || `checkout:${String(input.cartId)}:${String(input.paymentSessionId)}`,
  }
  return unwrap(await keystoneClient<{ submitPharmacyOrder: SubmitPharmacyOrderProjection }>(`mutation Submit($input: SubmitPharmacyOrderInput!) { submitPharmacyOrder(input: $input) { success reused orderId orderNumber status fulfillmentStatus totalAmount currencyCode guestOrderToken } }`, { input: idempotentInput })).submitPharmacyOrder
}
