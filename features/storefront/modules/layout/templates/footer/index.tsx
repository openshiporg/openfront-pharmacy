import Link from 'next/link'

import type { PublicPharmacyOperatorBrandProjection } from '@/features/pharmacy/contracts'
import { StoreBrand } from '../../../../components/StoreBrand'
import { NAV_LINKS } from '../nav'

export default function Footer({ brand }: { brand: Pick<PublicPharmacyOperatorBrandProjection, 'displayName' | 'logoIcon' | 'logoColor' | 'supportEmail' | 'supportPhone'> }) {
  return <footer className="mt-auto border-t border-border">
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between lg:px-8">
      <div className="min-w-0 max-w-sm">
        <StoreBrand name={brand.displayName} logoIcon={brand.logoIcon} logoColor={brand.logoColor} />
        {(brand.supportPhone || brand.supportEmail) && <div className="mt-3 grid gap-1 text-sm text-muted-foreground">
          {brand.supportPhone && <a href={`tel:${brand.supportPhone}`} className="hover:text-primary">{brand.supportPhone}</a>}
          {brand.supportEmail && <a href={`mailto:${brand.supportEmail}`} className="break-all hover:text-primary">{brand.supportEmail}</a>}
        </div>}
      </div>
      <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {NAV_LINKS.map((link) => <Link key={link.href} href={link.href} className="inline-flex min-h-11 items-center hover:text-primary">{link.label}</Link>)}
      </nav>
    </div>
    <div className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} {brand.displayName}</div>
  </footer>
}
