import type { Metadata } from 'next'

import { getStorefront } from '../lib/data/store'
import { NoLocations, StoreCatalog } from './HomePage'
import { StoreUnavailable } from './MainLayout'
import { categoryLabel } from '../lib/categories'

type Props = { searchParams?: Promise<{ category?: string }> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams
  const section = params?.category ? categoryLabel(params.category) : 'Shop'
  return { title: section }
}

export async function StorePage({ searchParams }: Props) {
  const params = await searchParams
  const category = typeof params?.category === 'string' && /^[a-z_]{1,40}$/.test(params.category) ? params.category : null
  const storefront = await getStorefront()
  if (!storefront) return <StoreUnavailable />
  if (!storefront.location) return <NoLocations storefront={storefront} />
  return <div>
    <StoreCatalog storefront={storefront} title={category ? categoryLabel(category) : 'Shop'} eyebrow={storefront.location.name} category={category} />
  </div>
}

export default StorePage
