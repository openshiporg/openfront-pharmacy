import type { Metadata } from 'next'

import { getStorefront } from '../lib/data/store'
import { NoLocations, StoreCatalog } from './HomePage'
import { StoreUnavailable } from './MainLayout'

type Props = { searchParams?: Promise<{ category?: string }> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const [storefront, params] = await Promise.all([getStorefront(), searchParams])
  const section = params?.category ? params.category.replaceAll('_', ' ') : 'Shop'
  return { title: storefront ? `${section} | ${storefront.brand.displayName}` : section }
}

export async function StorePage({ searchParams }: Props) {
  const params = await searchParams
  const category = typeof params?.category === 'string' && /^[a-z_]{1,40}$/.test(params.category) ? params.category : null
  const storefront = await getStorefront()
  if (!storefront) return <StoreUnavailable />
  if (!storefront.location) return <NoLocations storefront={storefront} />
  return <div className="pt-8 sm:pt-10">
    <StoreCatalog storefront={storefront} title={category ? category.replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase()) : 'Shop'} eyebrow={storefront.location.name} category={category} />
  </div>
}

export default StorePage
