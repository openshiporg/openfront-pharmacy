'use client'

import { useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'

import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { normalizeStoreLogoColor } from '@/features/lib/store-logo'
import type { PublicPharmacyOperatorBrandProjection } from '@/features/pharmacy/contracts'

export function MobileMenu({ brand, links }: { brand: Pick<PublicPharmacyOperatorBrandProjection, 'displayName' | 'logoColor'>; links: Array<{ href: string; label: string }> }) {
  const [open, setOpen] = useState(false)
  const logoHue = normalizeStoreLogoColor(brand.logoColor)
  // The sheet renders in a portal outside the store wrapper, so it carries the brand hue itself.
  const style = { '--store-page-logo-hue': logoHue, '--store-page-brand-hue': String((260 + Number.parseInt(logoHue, 10)) % 360) } as CSSProperties
  return <Sheet open={open} onOpenChange={setOpen}>
    <SheetTrigger className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border md:hidden" aria-label="Open menu"><Menu className="size-5" /></SheetTrigger>
    <SheetContent side="right" className="storefront-brand w-72 max-w-[85vw]" style={style}>
      <SheetTitle className="truncate">{brand.displayName}</SheetTitle>
      <nav aria-label="Menu" className="mt-6 grid gap-1">
        {[...links, { href: '/cart', label: 'Cart' }].map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="flex min-h-11 items-center font-semibold">{link.label}</Link>)}
      </nav>
    </SheetContent>
  </Sheet>
}
