'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'

import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import type { PublicPharmacyOperatorBrandProjection } from '@/features/pharmacy/contracts'
import { StoreMark } from '../../../../components/StoreBrand'
import { rxFontClass } from '../../../../lib/fonts'
import { storeBrandStyle } from '../../../../lib/rx-brand'
import { NAV_LINKS, isActivePath } from './links'

export function MobileMenu({ brand }: { brand: Pick<PublicPharmacyOperatorBrandProjection, 'displayName' | 'logoIcon' | 'logoColor'> }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname() ?? '/'
  const links = [...NAV_LINKS, { href: '/account', label: 'Account' }, { href: '/cart', label: 'Cart' }]
  // The sheet renders in a portal outside the store wrapper, so it carries the brand tokens itself.
  return <Sheet open={open} onOpenChange={setOpen}>
    <SheetTrigger className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[4px] bg-muted md:hidden" aria-label="Open menu"><Menu className="size-5" /></SheetTrigger>
    <SheetContent side="right" className={`storefront-brand ${rxFontClass} w-80 max-w-[88vw] gap-0 p-0`} style={storeBrandStyle(brand.logoColor)}>
      <div className="flex items-center gap-2.5 border-b border-[var(--rx-rule)] px-5 py-4 pr-12">
        <StoreMark logoIcon={brand.logoIcon} logoColor={brand.logoColor} className="size-7" />
        <SheetTitle className="truncate text-base">{brand.displayName}</SheetTitle>
      </div>
      <nav aria-label="Menu" className="grid p-3">
        {links.map((link) => {
          const active = isActivePath(pathname, link.href)
          return <Link key={link.href} href={link.href} onClick={() => setOpen(false)} aria-current={active ? 'page' : undefined} className={`flex min-h-12 items-center rounded-[4px] px-3 text-[15px] font-medium ${active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{link.label}</Link>
        })}
      </nav>
    </SheetContent>
  </Sheet>
}
