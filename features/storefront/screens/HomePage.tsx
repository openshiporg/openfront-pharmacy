import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ClipboardList, PackageSearch, UserRound } from 'lucide-react'

import { LocationPicker } from '../components/LocationPicker'
import { ProductGrid } from '../components/ProductGrid'
import { retrieveCart } from '../lib/data/cart'
import { getStorefront, getStorefrontCatalog, type Storefront } from '../lib/data/store'
import { StoreUnavailable } from './MainLayout'

export async function generateMetadata(): Promise<Metadata> {
  const storefront = await getStorefront()
  if (!storefront) return { title: 'Pharmacy' }
  const { displayName, tagline } = storefront.brand
  return { title: tagline ? `${displayName} - ${tagline}` : displayName, description: tagline || undefined }
}

export function NoLocations({ storefront }: { storefront: Storefront }) {
  const contact = storefront.brand.supportPhone || storefront.brand.supportEmail
  return <section className="mx-auto max-w-2xl px-4 py-24 text-center">
    <h1 className="text-3xl font-semibold tracking-tight">No pickup locations available</h1>
    {contact && <p className="mt-3 text-muted-foreground">Contact us at {contact}.</p>}
  </section>
}

/** Location picker and product grid for the selected location, shared by the home and products pages. */
export async function StoreCatalog({ storefront, title }: { storefront: Storefront; title?: string }) {
  const location = storefront.location!
  const [catalog, cart] = await Promise.all([getStorefrontCatalog(location.id), retrieveCart()])
  const lockedReason = cart?.items.length ? 'Empty your cart to change location.' : null
  return <>
    <LocationPicker key={`picker-${location.id}`} location={location} locations={storefront.locations} hasMore={storefront.hasMoreLocations} nextCursor={storefront.nextLocationCursor} lockedReason={lockedReason} />
    {location.onlineOrderingEnabled ? null : <p className="mx-auto max-w-7xl px-4 pt-8 text-sm text-muted-foreground sm:px-6 lg:px-8">Online ordering is unavailable at this location. Call the pharmacy to place an order.</p>}
    {catalog
      ? <ProductGrid key={location.id} locationId={location.id} orderingEnabled={location.onlineOrderingEnabled} initialPage={catalog} title={title} />
      : <p role="alert" className="mx-auto max-w-7xl px-4 py-14 text-sm text-destructive sm:px-6 lg:px-8">Products could not be loaded. Please try again.</p>}
  </>
}

export async function HomePage() {
  const storefront = await getStorefront()
  if (!storefront) return <StoreUnavailable />
  if (!storefront.location) return <NoLocations storefront={storefront} />
  const { brand } = storefront

  return <>
    <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_.8fr] lg:px-8 lg:py-24">
      <div>
        {brand.tagline && <p className="mb-5 text-xs font-bold uppercase tracking-[0.24em] text-primary">{brand.tagline}</p>}
        <h1 className="max-w-3xl text-5xl font-semibold leading-[.96] tracking-[-0.05em] sm:text-7xl">{brand.displayName}</h1>
        <div className="mt-8 flex flex-wrap gap-5 font-semibold">
          <Link href="/products" className="inline-flex items-center gap-2 border-b border-foreground pb-1">Shop products <ArrowRight className="size-4" /></Link>
          <Link href="/prescriptions" className="inline-flex items-center gap-2 border-b border-foreground pb-1">Prescription services <ArrowRight className="size-4" /></Link>
        </div>
      </div>
      <div className="rounded-[2rem] bg-muted p-7 lg:mt-16">
        <h2 className="text-2xl font-semibold tracking-tight">{storefront.location.name}</h2>
        <p className="mt-3 text-sm text-muted-foreground">{storefront.location.onlineOrderingEnabled ? 'Order online for pickup.' : 'Call or visit to place an order.'}</p>
        {storefront.location.phone && <a href={`tel:${storefront.location.phone}`} className="mt-4 inline-block font-semibold">{storefront.location.phone}</a>}
      </div>
    </section>

    <StoreCatalog storefront={storefront} title="Everyday essentials" />

    <section id="services" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <h2 className="text-3xl font-semibold tracking-tight">Services</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Link href="/account" className="rounded-2xl bg-card p-6"><UserRound className="size-6 text-primary" /><h3 className="mt-5 text-xl font-semibold">Refills</h3><span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">Your account <ArrowRight className="size-4" /></span></Link>
        <Link href="/order-status" className="rounded-2xl bg-card p-6"><PackageSearch className="size-6 text-primary" /><h3 className="mt-5 text-xl font-semibold">Order status</h3><span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">Track an order <ArrowRight className="size-4" /></span></Link>
        <Link href="/prescriptions" className="rounded-2xl bg-card p-6"><ClipboardList className="size-6 text-primary" /><h3 className="mt-5 text-xl font-semibold">Prescription services</h3><span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">Learn more <ArrowRight className="size-4" /></span></Link>
      </div>
    </section>
  </>
}

export default HomePage
