import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import type { PublicPharmacyLocationProjection } from '@/features/pharmacy/contracts'
import { LocationPicker } from '../components/LocationPicker'
import { ProductGrid } from '../components/ProductGrid'
import { Dot, Field, TitleLine } from '../components/rx-ui'
import { retrieveCart } from '../lib/data/cart'
import { getStorefront, getStorefrontCatalog, type Storefront } from '../lib/data/store'
import { formatAddress } from '../lib/money'
import { StoreUnavailable } from './MainLayout'

export async function generateMetadata(): Promise<Metadata> {
  const storefront = await getStorefront()
  if (!storefront) return { title: 'Pharmacy' }
  const { displayName, tagline } = storefront.brand
  return { title: tagline ? `${displayName} - ${tagline}` : displayName, description: tagline || undefined }
}

export function NoLocations({ storefront }: { storefront: Storefront }) {
  const phone = storefront.brand.supportPhone
  const email = storefront.brand.supportEmail
  return <section className="mx-auto max-w-xl px-4 py-24 text-center">
    <p className="rx-eyebrow">{storefront.brand.displayName}</p>
    <h1 className="mt-3 text-3xl font-semibold tracking-tight">No pharmacy locations are open online</h1>
    {(phone || email) && <p className="mt-4 text-muted-foreground">{phone && <a href={`tel:${phone}`} className="rx-num font-medium text-foreground">{phone}</a>}{phone && email && ' · '}{email && <a href={`mailto:${email}`} className="font-medium text-foreground">{email}</a>}</p>}
  </section>
}

/** Location picker and product grid for the selected location, shared by the home and shop pages. */
export async function StoreCatalog({ storefront, title, eyebrow }: { storefront: Storefront; title?: string; eyebrow?: string }) {
  const location = storefront.location!
  const [catalog, cart] = await Promise.all([getStorefrontCatalog(location.id), retrieveCart()])
  const lockedReason = cart?.items.length ? 'Empty your cart to change pharmacy.' : null
  return <>
    <LocationPicker key={`picker-${location.id}`} location={location} locations={storefront.locations} hasMore={storefront.hasMoreLocations} nextCursor={storefront.nextLocationCursor} lockedReason={lockedReason} />
    {!location.onlineOrderingEnabled && <p role="status" className="mx-auto mt-6 max-w-7xl px-4 text-sm text-muted-foreground sm:px-6 lg:px-8"><span className="inline-flex items-baseline gap-2"><Dot tone="warn" />Online ordering is off at {location.name}. Call the pharmacy to order.</span></p>}
    {catalog
      ? <ProductGrid key={location.id} locationId={location.id} orderingEnabled={location.onlineOrderingEnabled} initialPage={catalog} title={title} eyebrow={eyebrow} />
      : <p role="alert" className="mx-auto max-w-7xl px-4 py-14 text-sm text-destructive sm:px-6 lg:px-8">Products could not be loaded. Try again.</p>}
  </>
}

const COUNTER = [
  { href: '/account', label: 'Refill a prescription' },
  { href: '/prescriptions#transfer', label: 'New or transferred prescription' },
  { href: '/order-status', label: 'Track an order' },
  { href: '/products', label: 'Shop over the counter' },
]

function LocationLabel({ location, phone }: { location: PublicPharmacyLocationProjection; phone?: string | null }) {
  const address = formatAddress(location.address)
  const services = [location.pickupEnabled && 'Pickup', location.deliveryEnabled && 'Delivery'].filter(Boolean).join(' · ')
  return <aside aria-label="Pharmacy location" className="relative overflow-hidden rounded-[1.25rem] border border-border bg-card shadow-[0_1px_0_var(--border),0_18px_40px_-28px_oklch(0.2_0.03_var(--store-brand-hue)/0.35)]">
    <div className="flex items-center justify-between gap-3 border-b border-dashed border-[var(--rx-rule)] px-5 py-3">
      <span className="rx-eyebrow">Pharmacy</span>
      <span aria-hidden="true" className="rx-num text-xs text-muted-foreground">{location.code}</span>
    </div>
    <div className="px-5 pb-5 pt-4">
      <TitleLine title={location.name} titleClassName="text-xl" tone={location.onlineOrderingEnabled ? 'ok' : 'warn'} state={location.onlineOrderingEnabled ? 'Ordering online' : 'Call to order'} />
      <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4">
        {address && <Field label="Address" className="col-span-2">{address}</Field>}
        {phone && <Field label="Phone"><a href={`tel:${phone}`} className="rx-num hover:text-primary">{phone}</a></Field>}
        {services && <Field label="Service">{services}</Field>}
      </dl>
    </div>
  </aside>
}

export async function HomePage() {
  const storefront = await getStorefront()
  if (!storefront) return <StoreUnavailable />
  if (!storefront.location) return <NoLocations storefront={storefront} />
  const { brand, location } = storefront

  return <>
    <section className="mx-auto grid max-w-7xl gap-10 px-4 pb-12 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16 lg:px-8 lg:pb-16 lg:pt-20">
      <div className="min-w-0">
        {brand.tagline && <p className="rx-eyebrow">{brand.tagline}</p>}
        <h1 className="mt-3 max-w-[14ch] text-balance text-[2.75rem] font-semibold leading-[1.02] tracking-[-0.035em] sm:text-6xl lg:text-[4.5rem]">{brand.displayName}</h1>
        <nav aria-label="Pharmacy services" className="mt-10">
          <ol className="divide-y divide-border border-y border-border">
            {COUNTER.map((entry, index) => <li key={entry.href}>
              <Link href={entry.href} className="group grid min-h-16 grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-3 py-3 transition-colors hover:text-primary">
                <span className="rx-num text-xs text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                <span className="min-w-0 text-[17px] font-semibold tracking-[-0.01em]">{entry.label}</span>
                <ArrowUpRight aria-hidden="true" className="size-4 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            </li>)}
          </ol>
        </nav>
      </div>
      <div className="min-w-0 lg:pt-10">
        <LocationLabel location={location} phone={location.phone || brand.supportPhone} />
      </div>
    </section>

    <StoreCatalog storefront={storefront} title="Over the counter" eyebrow="Shop" />
  </>
}

export default HomePage
