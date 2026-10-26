import type { Metadata } from 'next'

import { getStorefront } from '@/features/storefront/lib/data/store'
import { rxFontClass } from '@/features/storefront/lib/fonts'
import { storeBrandStyle } from '@/features/storefront/lib/rx-brand'
import './apothecary.css'

// Every storefront tab reads "Page | Store name".
export async function generateMetadata(): Promise<Metadata> {
  const name = (await getStorefront())?.brand.displayName || 'Pharmacy'
  return { title: { template: `%s | ${name}`, default: name } }
}

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const storefront = await getStorefront()
  return <div className={`storefront-brand ${rxFontClass}`} style={storeBrandStyle(storefront?.brand.logoColor)}>{children}</div>
}
