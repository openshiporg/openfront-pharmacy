import Link from 'next/link'

import type { PublicPharmacyLocationProjection, PublicPharmacyOperatorBrandProjection } from '@/features/pharmacy/contracts'
import { OpenNow } from '../../../../components/LocationHours'
import { StoreBrand } from '../../../../components/StoreBrand'
import { formatAddress } from '../../../../lib/money'
import { NAV_LINKS } from '../nav/links'

export default function Footer({ brand, location }: { brand: Pick<PublicPharmacyOperatorBrandProjection, 'displayName' | 'tagline' | 'logoIcon' | 'logoColor' | 'supportEmail' | 'supportPhone'>; location?: Pick<PublicPharmacyLocationProjection, 'name' | 'address' | 'phone' | 'hours' | 'timezone'> | null }) {
  const address = formatAddress(location?.address)
  const phone = location?.phone || brand.supportPhone
  return <footer className="mt-auto border-t border-[var(--rx-rule)] bg-[var(--rx-field)]">
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
      <div className="min-w-0">
        <StoreBrand name={brand.displayName} logoIcon={brand.logoIcon} logoColor={brand.logoColor} />
        {brand.tagline && <p className="mt-2 max-w-xs text-sm text-muted-foreground">{brand.tagline}</p>}
      </div>
      <div className="min-w-0">
        <p className="rx-eyebrow">Pharmacy</p>
        <div className="mt-3 grid gap-1.5 text-sm">
          {location?.name && <p className="font-medium">{location.name}</p>}
          {address && <p className="text-muted-foreground">{address}</p>}
          {phone && <a href={`tel:${phone}`} className="rx-num w-fit hover:text-primary">{phone}</a>}
          {brand.supportEmail && <a href={`mailto:${brand.supportEmail}`} className="w-fit break-all text-muted-foreground hover:text-primary">{brand.supportEmail}</a>}
          {location?.hours && <OpenNow week={location.hours.pharmacy} timezone={location.timezone} label="Pharmacy" />}
        </div>
      </div>
      <nav aria-label="Footer" className="min-w-0">
        <p className="rx-eyebrow">Store</p>
        <ul className="mt-1.5 grid">
          {[...NAV_LINKS, { href: '/account', label: 'Account' }, { href: '/privacy', label: 'Privacy notice' }].map((link) => <li key={link.href}><Link href={link.href} className="inline-flex min-h-10 items-center text-sm hover:text-primary">{link.label}</Link></li>)}
        </ul>
      </nav>
    </div>
    <div className="border-t border-[var(--rx-rule)]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-[13px] text-muted-foreground sm:px-6 lg:px-8">
        <span>© {new Date().getFullYear()} {brand.displayName}</span>
        <span>In an emergency, call 911.</span>
      </div>
    </div>
  </footer>
}
