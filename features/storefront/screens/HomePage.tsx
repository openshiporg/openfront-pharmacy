import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import type { PublicPharmacyLocationProjection } from '@/features/pharmacy/contracts'
import { OpenNow } from '../components/LocationHours'
import { LocationPicker } from '../components/LocationPicker'
import { ProductGrid } from '../components/ProductGrid'
import { Dot, Field, TitleLine } from '../components/rx-ui'
import { retrieveCart } from '../lib/data/cart'
import { getStorefront, getStorefrontCatalog, getStorefrontCategories, type Storefront } from '../lib/data/store'
import { formatAddress } from '../lib/money'
import { StoreUnavailable } from './MainLayout'

export async function generateMetadata(): Promise<Metadata> {
  const storefront = await getStorefront()
  if (!storefront) return { title: 'Pharmacy' }
  const { displayName, tagline } = storefront.brand
  return { title: { absolute: tagline ? `${displayName} - ${tagline}` : displayName }, description: tagline || undefined }
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
export async function StoreCatalog({ storefront, title, eyebrow, category = null }: { storefront: Storefront; title?: string; eyebrow?: string; category?: string | null }) {
  const location = storefront.location!
  const categories = await getStorefrontCategories(location.id)
  const activeCategory = categories.some((entry) => entry.value === category) ? category : null
  const [catalog, cart] = await Promise.all([getStorefrontCatalog(location.id, activeCategory), retrieveCart()])
  const lockedReason = cart?.items.length ? 'Empty your cart to change pharmacy.' : null
  return <>
    <LocationPicker key={`picker-${location.id}`} location={location} locations={storefront.locations} hasMore={storefront.hasMoreLocations} nextCursor={storefront.nextLocationCursor} lockedReason={lockedReason} />
    {!location.onlineOrderingEnabled && <p role="status" className="mx-auto mt-6 max-w-7xl px-4 text-sm text-muted-foreground sm:px-6 lg:px-8"><span className="inline-flex items-baseline gap-2"><Dot tone="warn" />Online ordering is off at {location.name}. Call the pharmacy to order.</span></p>}
    {catalog
      ? <ProductGrid key={`${location.id}:${activeCategory || ''}`} locationId={location.id} orderingEnabled={location.onlineOrderingEnabled} initialPage={catalog} title={title} eyebrow={eyebrow} categories={categories} activeCategory={activeCategory} />
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
  return <aside aria-label="Pharmacy location" className="rounded-[22px] bg-background/45 px-5 pb-5 pt-4 sm:px-6">
    <TitleLine title={location.name} titleClassName="text-xl font-bold" tone={location.onlineOrderingEnabled ? 'ok' : 'warn'} state={location.onlineOrderingEnabled ? 'Ordering online' : 'Call to order'} />
    <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4">
      {address && <Field label="Address" className="col-span-2">{address}</Field>}
      {phone && <Field label="Phone"><a href={`tel:${phone}`} className="rx-num hover:text-primary">{phone}</a></Field>}
      {services && <Field label="Service">{services}</Field>}
      {location.hours && <Field label="Store"><OpenNow week={location.hours.store} timezone={location.timezone} /></Field>}
      {location.hours && <Field label="Pharmacy counter"><OpenNow week={location.hours.pharmacy} timezone={location.timezone} /></Field>}
    </dl>
    {location.hours && <Link href="/prescriptions#location" className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-primary underline decoration-2 underline-offset-4">All hours</Link>}
  </aside>
}

export async function HomePage() {
  const storefront = await getStorefront()
  if (!storefront) return <StoreUnavailable />
  if (!storefront.location) return <NoLocations storefront={storefront} />
  const { brand, location } = storefront

  return <>
    <section aria-labelledby="rx-home-title" className="bg-[var(--rx-field)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-14 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14 lg:px-8 lg:pb-20 lg:pt-20">
        <div className="flex min-w-0 flex-col">
          <h1 id="rx-home-title" className="max-w-[12ch] text-balance text-[3rem] font-extrabold leading-[0.9] tracking-[-0.05em] sm:text-[4.5rem] lg:text-[6rem]">{brand.displayName}</h1>
          {brand.tagline && <p className="mt-5 max-w-[34ch] text-[1.25rem] leading-[1.4] text-foreground/85 sm:text-[1.375rem]">{brand.tagline}</p>}
          <div className="mt-10 lg:mt-auto"><LocationLabel location={location} phone={location.phone || brand.supportPhone} /></div>
        </div>
        <nav aria-label="Pharmacy services" className="min-w-0">
          <ol className="rx-press grid grid-cols-2 gap-[14px] p-2">
            {COUNTER.map((entry) => <li key={entry.href}>
              <Link href={entry.href} className="rx-dome group flex aspect-square flex-col justify-end p-5 sm:p-7">
                <ArrowUpRight aria-hidden="true" className="absolute right-5 top-5 size-6 text-primary transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:right-7 sm:top-7" />
                <span className="text-balance text-[1.25rem] font-bold leading-[1.1] tracking-[-0.02em] sm:text-[1.75rem]">{entry.label}</span>
              </Link>
            </li>)}
          </ol>
        </nav>
      </div>
    </section>

    <StoreCatalog storefront={storefront} title="Over the counter" eyebrow="Shop" />
  </>
}

export default HomePage
