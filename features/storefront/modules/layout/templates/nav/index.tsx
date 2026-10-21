import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'

import type { PublicPharmacyOperatorBrandProjection } from '@/features/pharmacy/contracts'
import { StoreBrand } from '../../../../components/StoreBrand'
import { MobileMenu } from './mobile-menu'

export const NAV_LINKS = [
  { href: '/products', label: 'Products' },
  { href: '/prescriptions', label: 'Prescriptions' },
  { href: '/order-status', label: 'Track order' },
  { href: '/account', label: 'Account' },
]

export default function Nav({ brand, cartCount }: { brand: Pick<PublicPharmacyOperatorBrandProjection, 'displayName' | 'logoIcon' | 'logoColor'>; cartCount: number }) {
  return <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
      <div className="min-w-0 flex-1"><StoreBrand name={brand.displayName} logoIcon={brand.logoIcon} logoColor={brand.logoColor} /></div>
      <nav aria-label="Store" className="hidden items-center gap-5 text-sm font-semibold md:flex">
        {NAV_LINKS.map((link) => <Link key={link.href} href={link.href} className="hover:text-primary">{link.label}</Link>)}
      </nav>
      <Link href="/cart" aria-label={`Cart, ${cartCount} items`} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"><ShoppingBag className="size-4" />{cartCount}</Link>
      <MobileMenu brand={brand} links={NAV_LINKS} />
    </div>
  </header>
}
