import type { Metadata } from 'next'

import { getStorefront } from '../lib/data/store'
import { NoLocations, StoreCatalog } from './HomePage'
import { StoreUnavailable } from './MainLayout'

export async function generateMetadata(): Promise<Metadata> {
  const storefront = await getStorefront()
  return { title: storefront ? `Shop | ${storefront.brand.displayName}` : 'Shop' }
}

export async function StorePage() {
  const storefront = await getStorefront()
  if (!storefront) return <StoreUnavailable />
  if (!storefront.location) return <NoLocations storefront={storefront} />
  return <div className="pt-8 sm:pt-10">
    <StoreCatalog storefront={storefront} title="Shop" eyebrow={storefront.location.name} />
  </div>
}

export default StorePage
