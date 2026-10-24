import Link from 'next/link'
import { Phone, ShoppingBag, UserRound } from 'lucide-react'

import type { PublicPharmacyLocationProjection, PublicPharmacyOperatorBrandProjection } from '@/features/pharmacy/contracts'
import { StoreBrand } from '../../../../components/StoreBrand'
import { DesktopNav } from './desktop-nav'
import { MobileMenu } from './mobile-menu'

export { NAV_LINKS } from './links'

export default function Nav({ brand, location, cartCount }: { brand: Pick<PublicPharmacyOperatorBrandProjection, 'displayName' | 'logoIcon' | 'logoColor' | 'supportPhone'>; location?: Pick<PublicPharmacyLocationProjection, 'name' | 'phone'> | null; cartCount: number }) {
  const phone = location?.phone || brand.supportPhone
  return <header className="sticky top-0 z-30">
    {(location || phone) && <div className="bg-primary text-primary-foreground">
      <div className="mx-auto flex min-h-9 max-w-7xl items-center justify-between gap-4 px-4 text-xs sm:px-6 lg:px-8">
        <span className="min-w-0 truncate font-medium">{location?.name}</span>
        {phone && <a href={`tel:${phone}`} className="inline-flex min-h-9 shrink-0 items-center gap-1.5 font-medium underline-offset-4 hover:underline"><Phone aria-hidden="true" className="size-3.5" /><span className="rx-num">{phone}</span></a>}
      </div>
    </div>}
    <div className="border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="min-w-0 flex-1"><StoreBrand name={brand.displayName} logoIcon={brand.logoIcon} logoColor={brand.logoColor} /></div>
        <DesktopNav />
        <div className="flex shrink-0 items-center justify-end gap-2 lg:flex-1">
          <Link href="/account" className="hidden min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:inline-flex"><UserRound aria-hidden="true" className="size-4" />Account</Link>
          <Link href="/cart" aria-label={`Cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-foreground px-4 text-sm font-semibold text-background transition-transform active:scale-[0.97]"><ShoppingBag aria-hidden="true" className="size-4" /><span className="rx-num">{cartCount}</span></Link>
          <MobileMenu brand={brand} />
        </div>
      </div>
    </div>
  </header>
}
