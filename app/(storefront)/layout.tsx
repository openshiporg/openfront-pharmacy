import { getStorefront } from '@/features/storefront/lib/data/store'
import { rxFontClass } from '@/features/storefront/lib/fonts'
import { storeBrandStyle } from '@/features/storefront/lib/rx-brand'
import './storefront.css'

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const storefront = await getStorefront()
  return <div className={`storefront-brand ${rxFontClass}`} style={storeBrandStyle(storefront?.brand.logoColor)}>{children}</div>
}
