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

// Receiving requires exact active tenant/location identity and explicit support in the bounded room-temperature scope.
export function isProductAtActiveTenantLocation(
  product: ProductLocationIdentity | null | undefined,
  location: ActivePharmacyLocationIdentity | null | undefined,
) {
  return Boolean(
    product &&
    product.coldChainRequired === false &&
    location &&
    location.status === 'active' &&
    location.organization?.status === 'active' &&
    location.organization.id &&
    location.id &&
    product.organization?.id === location.organization.id &&
    product.location?.id === location.id,
  )
}
