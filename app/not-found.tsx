import { connection } from 'next/server'

import { getStorefront } from '@/features/storefront/lib/data/store'
import { rxFontClass } from '@/features/storefront/lib/fonts'
import { storeBrandStyle } from '@/features/storefront/lib/rx-brand'
import { MainLayout } from '@/features/storefront/screens/MainLayout'
import { StoreNotFound } from '@/features/storefront/screens/StoreNotFound'
import './(storefront)/apothecary.css'

// Unmatched URLs get the storefront's own 404 with its header and footer, not the bare Next.js page.
export default async function NotFound() {
  // Rendered per request: the store's brand and cart come from the database, never at build time.
  await connection()
  const storefront = await getStorefront()
  return <div className={`storefront-brand ${rxFontClass}`} style={storeBrandStyle(storefront?.brand.logoColor)}>
    <MainLayout><StoreNotFound /></MainLayout>
  </div>
}
