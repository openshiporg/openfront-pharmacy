import type { Metadata } from 'next'
import Link from 'next/link'

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
    <h1 className="text-3xl font-semibold tracking-tight">No pharmacy locations are open online</h1>
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
  { href: '/prescriptions#transfer', label: 'New or transfer' },
  { href: '/order-status', label: 'Track an order' },
  { href: '/products', label: 'Shop the shelves' },
]

function LocationPlate({ location, phone }: { location: PublicPharmacyLocationProjection; phone?: string | null }) {
  const address = formatAddress(location.address)
  const services = [location.pickupEnabled && 'Pickup', location.deliveryEnabled && 'Delivery'].filter(Boolean).join(' · ')
  return <aside aria-label="Pharmacy location" className="border-y border-[var(--rx-rule)]">
    <TitleLine title={location.name} titleClassName="rx-display text-[1.6rem]" tone={location.onlineOrderingEnabled ? 'ok' : 'warn'} state={location.onlineOrderingEnabled ? 'Ordering online' : 'Call to order'} className="pt-4" />
    <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 pb-4">
      {address && <Field label="Address" className="col-span-2">{address}</Field>}
      {location.hours && <Field label="Pharmacy counter"><OpenNow week={location.hours.pharmacy} timezone={location.timezone} /></Field>}
      {location.hours && <Field label="Store"><OpenNow week={location.hours.store} timezone={location.timezone} /></Field>}
      {phone && <Field label="Phone"><a href={`tel:${phone}`} className="rx-num hover:text-primary">{phone}</a></Field>}
      {services && <Field label="Service">{services}</Field>}
    </dl>
    {location.hours && <Link href="/prescriptions#location" className="mb-4 inline-flex min-h-10 items-center text-sm font-semibold text-primary underline decoration-1 underline-offset-4">All hours</Link>}
  </aside>
}

export async function HomePage() {
  const storefront = await getStorefront()
  if (!storefront) return <StoreUnavailable />
  if (!storefront.location) return <NoLocations storefront={storefront} />
  const { brand, location } = storefront

  return <>
    <section aria-labelledby="rx-home-title" className="border-b border-[var(--rx-rule)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-14 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:pb-20 lg:pt-16">
        <div className="flex min-w-0 flex-col">
          <h1 id="rx-home-title" className="rx-display rx-gold max-w-[11ch] text-balance text-[3.25rem] sm:text-[5rem] lg:text-[6.5rem]">{brand.displayName}</h1>
          {brand.tagline && <p className="mt-5 max-w-[34ch] text-[1.25rem] leading-[1.4] text-foreground/85">{brand.tagline}</p>}
          <div className="mt-8 lg:mt-auto lg:pt-10"><LocationPlate location={location} phone={location.phone || brand.supportPhone} /></div>
        </div>
        <nav aria-label="Pharmacy counter" className="min-w-0 lg:order-none">
          <ol className="rx-settle grid grid-cols-2 gap-2 rounded-[6px] bg-[var(--rx-field)] p-2 shadow-[0_0_0_1px_var(--rx-rule)] sm:gap-3 sm:p-3">
            {COUNTER.map((entry) => <li key={entry.href}>
              <Link href={entry.href} className="rx-drawer group flex aspect-[5/4] flex-col items-center justify-center gap-5 px-3 text-center sm:aspect-[4/3]">
                <span className="rx-plate min-h-10 max-w-full justify-center px-3 py-1.5 text-[15px] font-bold leading-tight sm:text-[17px]">{entry.label}</span>
                <span aria-hidden="true" className="rx-pull" />
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
