'use client'

import { useState, type ReactNode } from 'react'
import { Menu, X } from 'lucide-react'

import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import type { PublicPharmacyOperatorBrandProjection } from '@/features/pharmacy/contracts'
import { StoreMark } from '../../../../components/StoreBrand'
import type { StoreCategory } from '../../../../lib/data/store'
import { rxFontClass } from '../../../../lib/fonts'
import { storeBrandStyle } from '../../../../lib/rx-brand'
import { SideMenu } from './side-menu'

const iconButton = 'inline-flex size-11 shrink-0 items-center justify-center rounded-full text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring'

export function MobileMenu({ brand, categories, phone, signedIn, search }: { brand: Pick<PublicPharmacyOperatorBrandProjection, 'displayName' | 'logoIcon' | 'logoColor'>; categories: StoreCategory[]; phone?: string | null; signedIn: boolean; search?: ReactNode }) {
  const [open, setOpen] = useState(false)
  // The sheet renders in a portal outside the store wrapper, so it carries the brand tokens itself.
  // Its own close button sits in the title row; the sheet's default floating one is hidden.
  return <Sheet open={open} onOpenChange={setOpen}>
    <SheetTrigger className={iconButton} aria-label="Open menu"><Menu aria-hidden="true" className="size-6" strokeWidth={1.6} /></SheetTrigger>
    <SheetContent side="left" aria-describedby={undefined} className={`storefront-brand ${rxFontClass} flex h-dvh w-[22rem] max-w-[88vw] flex-col gap-0 p-0 [&>button.absolute]:hidden`} style={storeBrandStyle(brand.logoColor)}>
      <div className="flex shrink-0 items-center gap-2.5 border-b border-[var(--rx-rule)] py-2 pl-5 pr-2">
        <StoreMark logoIcon={brand.logoIcon} logoColor={brand.logoColor} className="size-7" />
        <SheetTitle className="rx-serif min-w-0 flex-1 truncate text-[19px] font-medium text-foreground">{brand.displayName}</SheetTitle>
        <SheetClose className={iconButton} aria-label="Close menu"><X aria-hidden="true" className="size-5" strokeWidth={1.7} /></SheetClose>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8 pt-4">
        {search && <div className="mb-5">{search}</div>}
        <nav aria-label="Menu"><SideMenu drawer categories={categories} phone={phone} signedIn={signedIn} onNavigate={() => setOpen(false)} /></nav>
      </div>
    </SheetContent>
  </Sheet>
}
