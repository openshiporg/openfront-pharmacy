import { cache } from 'react'
import { headers } from 'next/headers'

import { resolveStorefrontTenantKeyFromRequest } from '@/features/pharmacy/branding'
import type {
  PublicPharmacyCatalogPageProjection,
  PublicPharmacyCatalogProductProjection,
  PublicPharmacyLocationProjection,
  PublicPharmacyTenantProjection,
} from '@/features/pharmacy/contracts'
import { storefrontRequest } from '../storefront-client'
import { getStoredLocationId } from './cookies'

const PRODUCT_FIELDS = 'id title handle sku description category priceAmount currencyCode taxable imageUrl prescriptionRequirement availableQuantity inStock inventorySummaryStatus'

const TENANT_QUERY = `query StorefrontTenant($tenantKey: String!, $search: String, $first: Int, $after: String) {
  publicPharmacyTenant(tenantKey: $tenantKey, search: $search, first: $first, after: $after) {
    brand { organizationId tenantKey displayName tagline logoUrl logoIcon logoColor supportEmail supportPhone }
    locations { id name code address phone timezone hours onlineOrderingEnabled pickupEnabled deliveryEnabled }
    locationsTotalCount hasMoreLocations nextLocationCursor
  }
}`

const CATALOG_QUERY = `query StorefrontCatalog($tenantKey: String!, $locationId: ID!, $first: Int, $after: String, $search: String, $category: String) {
  publicPharmacyCatalog(tenantKey: $tenantKey, locationId: $locationId, first: $first, after: $after, search: $search, category: $category) {
    items { ${PRODUCT_FIELDS} }
    totalCount hasMore nextCursor
  }
}`

export type Storefront = PublicPharmacyTenantProjection & { location: PublicPharmacyLocationProjection | null }

export const getRequestTenantKey = cache(async () => resolveStorefrontTenantKeyFromRequest(await headers()) ?? '')

export async function fetchTenantPage(input: { search?: string | null; first?: number; after?: string | null }) {
  const response = await storefrontRequest<{ publicPharmacyTenant: PublicPharmacyTenantProjection }>(TENANT_QUERY, { tenantKey: await getRequestTenantKey(), ...input })
  return response.success ? { success: true as const, data: response.data.publicPharmacyTenant } : response
}

export async function fetchCatalogPage(input: { locationId: string; search?: string | null; category?: string | null; first?: number; after?: string | null }) {
  const response = await storefrontRequest<{ publicPharmacyCatalog: PublicPharmacyCatalogPageProjection }>(CATALOG_QUERY, { tenantKey: await getRequestTenantKey(), ...input })
  return response.success ? { success: true as const, data: response.data.publicPharmacyCatalog } : response
}

/** The store, its pickup locations and the customer's selected location; null when the store cannot be loaded. */
export const getStorefront = cache(async (): Promise<Storefront | null> => {
  const tenant = await fetchTenantPage({ first: 50 })
  if (!tenant.success) return null
  const storedLocationId = await getStoredLocationId()
  const location = tenant.data.locations.find((entry) => entry.id === storedLocationId) || tenant.data.locations[0] || null
  return { ...tenant.data, location }
})

export const getStorefrontCatalog = cache(async (locationId: string, category?: string | null) => {
  const page = await fetchCatalogPage({ locationId, category: category || null, first: 50 })
  return page.success ? page.data : null
})

export type StoreCategory = { value: string; count: number }

/** Categories with products for sale online at the location. */
export const getStorefrontCategories = cache(async (locationId: string): Promise<StoreCategory[]> => {
  const response = await storefrontRequest<{ publicPharmacyCategories: StoreCategory[] }>('query StorefrontCategories($tenantKey: String!, $locationId: ID!) { publicPharmacyCategories(tenantKey: $tenantKey, locationId: $locationId) { value count } }', { tenantKey: await getRequestTenantKey(), locationId })
  return response.success ? response.data.publicPharmacyCategories : []
})

/** Finds a product by handle across every catalog page of the selected location, then the other locations. */
export const getStorefrontProduct = cache(async (handle: string) => {
  const storefront = await getStorefront()
  if (!storefront) return null
  const ordered = storefront.location ? [storefront.location, ...storefront.locations.filter((entry) => entry.id !== storefront.location?.id)] : storefront.locations
  for (const location of ordered) {
    let after: string | null = null
    for (let page = 0; page < 50; page++) {
      const result = await fetchCatalogPage({ locationId: location.id, first: 100, after })
      if (!result.success) break
      const product: PublicPharmacyCatalogProductProjection | undefined = result.data.items.find((entry) => entry.handle === handle)
      if (product) return { storefront, location, product }
      if (!result.data.hasMore || !result.data.nextCursor) break
      after = result.data.nextCursor
    }
  }
  return null
})

/** The store's Notice of Privacy Practices text, or null when the pharmacy has not posted one. */
export const getPrivacyNotice = cache(async () => {
  const response = await storefrontRequest<{ publicPharmacyTenant: { brand: { privacyNotice?: string | null } } }>(
    'query StorefrontPrivacy($tenantKey: String!) { publicPharmacyTenant(tenantKey: $tenantKey, first: 1) { brand { privacyNotice } } }',
    { tenantKey: await getRequestTenantKey() },
  )
  return response.success ? response.data.publicPharmacyTenant.brand.privacyNotice?.trim() || null : null
})
