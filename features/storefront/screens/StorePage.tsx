import type { Metadata } from 'next'

import { getStorefront } from '../lib/data/store'
import { NoLocations, StoreCatalog } from './HomePage'
import { StoreUnavailable } from './MainLayout'

export async function generateMetadata(): Promise<Metadata> {
  const storefront = await getStorefront()
  return { title: storefront ? `Products | ${storefront.brand.displayName}` : 'Products' }
}

export async function StorePage() {
  const storefront = await getStorefront()
  if (!storefront) return <StoreUnavailable />
  if (!storefront.location) return <NoLocations storefront={storefront} />
  return <StoreCatalog storefront={storefront} title="Products" />
}

export default StorePage
