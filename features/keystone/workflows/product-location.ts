export type ProductLocationIdentity = {
  organization?: { id?: string | null } | null
  location?: { id?: string | null } | null
  coldChainRequired?: boolean | null
}

export type ActivePharmacyLocationIdentity = {
  id?: string | null
  status?: string | null
  organization?: { id?: string | null; status?: string | null } | null
}

// Receiving requires exact active tenant/location identity. Cold-chain products are allowed; the receiving
// workflow then demands their storage range and temperature-log evidence.
export function isProductAtActiveTenantLocation(
  product: ProductLocationIdentity | null | undefined,
  location: ActivePharmacyLocationIdentity | null | undefined,
) {
  return Boolean(
    product &&
    location &&
    location.status === 'active' &&
    location.organization?.status === 'active' &&
    location.organization.id &&
    location.id &&
    product.organization?.id === location.organization.id &&
    product.location?.id === location.id,
  )
}
