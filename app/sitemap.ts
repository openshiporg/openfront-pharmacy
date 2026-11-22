import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'

import { fetchCatalogPage, getStorefront } from '@/features/storefront/lib/data/store'

/** The public pages of this store: home, shop, prescription services, privacy notice and each product for sale online. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const requestHeaders = await headers()
  const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host')
  if (!host) return []
  const origin = `https://${host}`
  const pages: MetadataRoute.Sitemap = ['', '/products', '/prescriptions', '/privacy'].map((path) => ({ url: `${origin}${path}` }))
  const storefront = await getStorefront()
  if (!storefront?.location) return pages
  let after: string | null = null
  for (let page = 0; page < 20; page += 1) {
    const catalog = await fetchCatalogPage({ locationId: storefront.location.id, first: 50, after })
    if (!catalog.success) break
    for (const product of catalog.data.items) pages.push({ url: `${origin}/products/${product.handle}` })
    if (!catalog.data.hasMore || !catalog.data.nextCursor) break
    after = catalog.data.nextCursor
  }
  return pages
}
