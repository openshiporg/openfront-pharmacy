import type { PublicPharmacyCatalogProductProjection } from '@/features/pharmacy/contracts'

export function publicCatalogAvailability(product: Pick<PublicPharmacyCatalogProductProjection, 'availableQuantity' | 'inStock' | 'inventorySummaryStatus'>) {
  const quantity = product.availableQuantity
  const verified = product.inventorySummaryStatus === 'verified'
    && Number.isSafeInteger(quantity)
    && quantity! >= 0
    && typeof product.inStock === 'boolean'
    && product.inStock === (quantity! > 0)

  if (!verified) return { verified: false, canOrder: false, label: 'Unavailable' }
  if (quantity === 0) return { verified: true, canOrder: false, label: 'Unavailable' }
  return { verified: true, canOrder: true, label: `${quantity} in stock` }
}
