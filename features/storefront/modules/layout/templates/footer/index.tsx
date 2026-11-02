import Link from 'next/link'
import { Mail, MapPin, Phone } from 'lucide-react'

import type { PublicPharmacyLocationProjection, PublicPharmacyOperatorBrandProjection } from '@/features/pharmacy/contracts'
import { OpenNow } from '../../../../components/LocationHours'
import { StoreBrand } from '../../../../components/StoreBrand'
import { categoryLabel } from '../../../../lib/categories'
import type { StoreCategory } from '../../../../lib/data/store'
import { formatAddress } from '../../../../lib/money'
import { categoryHref } from '../nav/links'

const QUICK_LINKS = [
  { href: '/prescriptions', label: 'Prescriptions' },
  { href: '/prescriptions#location', label: 'Store' },
  { href: '/order-status', label: 'Track order' },
  { href: '/account', label: 'Account' },
  { href: '/privacy', label: 'Privacy notice' },
]

function Column({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return <div className={className ?? 'min-w-0'}>
    <p className="rx-serif text-[18px] lg:text-[16px]">{title}</p>
    <ul className="mt-1.5 grid lg:mt-1">{children}</ul>
  </div>
}

const linkClass = 'rx-serif inline-flex min-h-8 items-center text-[16px] text-foreground/80 hover:text-primary max-sm:min-h-10 lg:min-h-[22px] lg:text-[14px]'

export default function Footer({ brand, location, categories = [] }: { brand: Pick<PublicPharmacyOperatorBrandProjection, 'displayName' | 'tagline' | 'logoIcon' | 'logoColor' | 'supportEmail' | 'supportPhone'>; location?: Pick<PublicPharmacyLocationProjection, 'name' | 'address' | 'phone' | 'hours' | 'timezone'> | null; categories?: StoreCategory[] }) {
  const address = formatAddress(location?.address)
  const phone = location?.phone || brand.supportPhone
  return <footer className="mt-auto border-t border-[var(--rx-rule)] bg-background">
    <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-8 px-5 py-10 sm:px-8 lg:grid-cols-[1.5fr_1fr_1fr_1.3fr] lg:py-6">
      <div className="col-span-2 min-w-0 sm:col-span-1">
        <StoreBrand name={brand.displayName} logoIcon={brand.logoIcon} logoColor={brand.logoColor} />
        {brand.tagline && <p className="rx-serif mt-3 max-w-xs text-[16px] lg:mt-1.5 lg:text-[14px] leading-snug text-foreground/75">{brand.tagline}</p>}
        {location?.hours && <p className="mt-3"><OpenNow week={location.hours.pharmacy} timezone={location.timezone} label="Pharmacy" /></p>}
      </div>
      <Column title="Quick links">{QUICK_LINKS.map((link) => <li key={link.href}><Link href={link.href} className={linkClass}>{link.label}</Link></li>)}</Column>
      <Column title="Shop OTC">
        {categories.slice(0, 4).map((entry) => <li key={entry.value}><Link href={categoryHref(entry.value)} className={linkClass}>{categoryLabel(entry.value)}</Link></li>)}
        <li><Link href="/products" className={linkClass}>All products</Link></li>
      </Column>
      <Column title="Contact us" className="col-span-2 min-w-0 sm:col-span-1">
        {phone && <li><a href={`tel:${phone}`} className={`${linkClass} gap-2`}><Phone aria-hidden="true" strokeWidth={1.7} className="size-4 text-primary" /><span className="rx-num">{phone}</span></a></li>}
        {brand.supportEmail && <li><a href={`mailto:${brand.supportEmail}`} className={`${linkClass} gap-2 break-all`}><Mail aria-hidden="true" strokeWidth={1.7} className="size-4 shrink-0 text-primary" />{brand.supportEmail}</a></li>}
        {address && <li className="rx-serif flex gap-2 py-1 text-[16px] text-foreground/80 lg:py-0.5 lg:text-[14px]"><MapPin aria-hidden="true" strokeWidth={1.7} className="mt-1 size-4 shrink-0 text-primary" />{address}</li>}
      </Column>
    </div>
    <div className="border-t border-[var(--rx-rule)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-1 px-5 py-5 text-center sm:px-8 lg:py-3">
        <span className="rx-serif text-[15px] text-foreground/80 lg:text-[13px]">© {new Date().getFullYear()} {brand.displayName}. All rights reserved.</span>
        <span className="text-[13px] text-muted-foreground">In an emergency, call 911.</span>
      </div>
    </div>
  </footer>
}
