'use client'

import { useState } from 'react'
import { Ellipsis, Menu } from 'lucide-react'

import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import type { PublicPharmacyOperatorBrandProjection } from '@/features/pharmacy/contracts'
import { StoreMark } from '../../../../components/StoreBrand'
import type { StoreCategory } from '../../../../lib/data/store'
import { rxFontClass } from '../../../../lib/fonts'
import { storeBrandStyle } from '../../../../lib/rx-brand'
import { SideMenu } from './side-menu'

export function MobileMenu({ brand, categories, phone, signedIn, trigger = 'icon' }: { trigger?: 'icon' | 'tab'; brand: Pick<PublicPharmacyOperatorBrandProjection, 'displayName' | 'logoIcon' | 'logoColor'>; categories: StoreCategory[]; phone?: string | null; signedIn: boolean }) {
  const [open, setOpen] = useState(false)
  // The sheet renders in a portal outside the store wrapper, so it carries the brand tokens itself.
  return <Sheet open={open} onOpenChange={setOpen}>
    {trigger === 'tab'
      ? <SheetTrigger className="flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-[13px] text-foreground/80"><Ellipsis aria-hidden="true" className="size-6" strokeWidth={1.6} />More</SheetTrigger>
      : <SheetTrigger className="inline-flex size-11 items-center justify-center rounded-[4px] text-foreground" aria-label="Open menu"><Menu className="size-6" strokeWidth={1.6} /></SheetTrigger>}
    <SheetContent side="left" className={`storefront-brand ${rxFontClass} w-80 max-w-[88vw] gap-0 overflow-y-auto p-0`} style={storeBrandStyle(brand.logoColor)}>
      <div className="flex items-center gap-2.5 border-b border-[var(--rx-rule)] px-5 py-4 pr-12">
        <StoreMark logoIcon={brand.logoIcon} logoColor={brand.logoColor} className="size-7" />
        <SheetTitle className="rx-serif truncate text-[19px] font-medium text-primary">{brand.displayName}</SheetTitle>
      </div>
      <nav aria-label="Menu" className="p-5"><SideMenu categories={categories} phone={phone} signedIn={signedIn} onNavigate={() => setOpen(false)} /></nav>
    </SheetContent>
  </Sheet>
}
