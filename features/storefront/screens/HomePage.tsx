import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ClipboardList, PackageSearch, Phone, ShieldCheck, Store, Truck } from 'lucide-react'

import type { PublicPharmacyLocationProjection } from '@/features/pharmacy/contracts'
import { CategoryIcon } from '../components/CategoryIcon'
import { OpenNow } from '../components/LocationHours'
import { LocationPicker } from '../components/LocationPicker'
import { ProductCard } from '../components/ProductCard'
import { ProductGrid } from '../components/ProductGrid'
import { Dot, buttonClass, outlineButtonClass } from '../components/rx-ui'
import { categoryLabel } from '../lib/categories'
import { retrieveCart } from '../lib/data/cart'
import { fetchCatalogPage, getStorefront, getStorefrontCatalog, getStorefrontCategories, type Storefront } from '../lib/data/store'
import { categoryHref } from '../modules/layout/templates/nav/links'
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
    <h1 className="rx-display text-[2.25rem]">No pharmacy locations are open online</h1>
    {(phone || email) && <p className="mt-4 text-muted-foreground">{phone && <a href={`tel:${phone}`} className="rx-num font-medium text-foreground">{phone}</a>}{phone && email && ' · '}{email && <a href={`mailto:${email}`} className="font-medium text-foreground">{email}</a>}</p>}
  </section>
}

/** Location picker and product grid for the selected location (the shop page). */
export async function StoreCatalog({ storefront, title, eyebrow, category = null, search = '' }: { storefront: Storefront; title?: string; eyebrow?: string; category?: string | null; search?: string }) {
  const location = storefront.location!
  const categories = await getStorefrontCategories(location.id)
  const activeCategory = categories.some((entry) => entry.value === category) ? category : null
  const [catalog, cart] = await Promise.all([
    search ? fetchCatalogPage({ locationId: location.id, category: activeCategory, search, first: 50 }).then((page) => page.success ? page.data : null) : getStorefrontCatalog(location.id, activeCategory),
    retrieveCart(),
  ])
  const lockedReason = cart?.items.length ? 'Empty your cart to change pharmacy.' : null
  return <>
    <LocationPicker key={`picker-${location.id}`} location={location} locations={storefront.locations} hasMore={storefront.hasMoreLocations} nextCursor={storefront.nextLocationCursor} lockedReason={lockedReason} />
    {!location.onlineOrderingEnabled && <p role="status" className="mt-6 px-4 text-sm text-muted-foreground sm:px-8 xl:px-16"><span className="inline-flex items-baseline gap-2"><Dot tone="warn" />Online ordering is off at {location.name}. Call the pharmacy to order.</span></p>}
    {catalog
      ? <ProductGrid key={`${location.id}:${activeCategory || ''}:${search}`} locationId={location.id} orderingEnabled={location.onlineOrderingEnabled} initialPage={catalog} initialSearch={search} title={title} eyebrow={eyebrow} categories={categories} activeCategory={activeCategory} />
      : <p role="alert" className="px-4 py-14 text-sm text-destructive sm:px-8 xl:px-16">Products could not be loaded. Try again.</p>}
  </>
}

function serviceLine(location: PublicPharmacyLocationProjection) {
  if (location.pickupEnabled && location.deliveryEnabled) return { icon: Truck, title: 'Pickup or delivery', detail: `Order online from ${location.name}` }
  if (location.deliveryEnabled) return { icon: Truck, title: 'Delivery available', detail: `Order online from ${location.name}` }
  return { icon: Store, title: 'Order online, pick up in store', detail: `Ready at ${location.name}` }
}

export async function HomePage() {
  const storefront = await getStorefront()
  if (!storefront) return <StoreUnavailable />
  if (!storefront.location) return <NoLocations storefront={storefront} />
  const { brand, location } = storefront
  const phone = location.phone || brand.supportPhone
  const [categories, catalog] = await Promise.all([getStorefrontCategories(location.id), getStorefrontCatalog(location.id)])
  const featured = (catalog?.items ?? []).filter((product) => product.imageUrl).slice(0, 4)
  const service = serviceLine(location)
  const headline = brand.tagline || brand.displayName

  const trust = [
    { icon: ShieldCheck, title: 'Licensed pharmacists', detail: phone ? `Questions? Call ${phone}.` : 'Ask us at the counter.' },
    { icon: service.icon, title: service.title, detail: service.detail },
    { icon: PackageSearch, title: 'Track every order', detail: 'Order status online, any time.' },
    { icon: ClipboardList, title: 'Prescriptions online', detail: 'Refill, transfer and track online.' },
  ]

  return <>
    {/* Hero */}
    <div className="px-4 pt-4 lg:p-0">
      <section aria-labelledby="home-title" className="relative overflow-hidden rounded-[28px] bg-[oklch(0.3_0.05_200)] lg:rounded-none lg:bg-[oklch(0.955_0.02_185)]">
        <div className="absolute inset-y-0 left-[52%] right-0 lg:left-auto lg:w-[60%]">
          <Image src={brand.heroUrl || "/storefront/hero-pharmacist.jpg"} alt="" fill priority sizes="(max-width: 1024px) 50vw, 55vw" className="object-cover object-[100%_25%] lg:object-[70%_30%]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.3_0.05_200)] to-transparent to-[22%] lg:via-[oklch(0.955_0.02_185/0.35)] lg:via-25% lg:from-[oklch(0.955_0.02_185)] lg:to-transparent lg:to-60%" />
        </div>
        <div className="relative flex min-h-[236px] max-w-[58%] flex-col justify-center py-6 pl-5 text-white sm:min-h-[340px] sm:pl-8 lg:min-h-0 lg:max-w-[44rem] lg:px-8 lg:py-4 lg:text-foreground xl:px-12">
          <h1 id="home-title" className="rx-display text-balance text-[1.75rem] leading-[1.08] sm:text-[2.5rem] lg:max-w-[22ch] lg:text-[2.25rem] xl:text-[2.4rem]">{headline}</h1>
          <p className="mt-2 text-[15px] leading-snug text-white/90 lg:mt-1.5 lg:max-w-[48ch] lg:rx-serif lg:text-[17px] lg:text-foreground/85"><span className="lg:hidden">Refills and everyday health.</span><span className="max-lg:hidden">Prescriptions, refills and everyday health products from {location.name}.</span></p>
          <div className="mt-4 flex flex-col items-start gap-1 lg:mt-3 lg:flex-row lg:items-center lg:gap-3">
            <Link href="/account#account-prescriptions" className={`${buttonClass} whitespace-nowrap max-lg:min-h-11 max-lg:bg-white max-lg:px-5 max-lg:text-[15px] max-lg:text-foreground lg:min-h-9 lg:px-4 lg:text-[15px]`}>Refill prescription</Link>
            <Link href="/products" className={`${outlineButtonClass} whitespace-nowrap max-lg:min-h-11 max-lg:bg-transparent max-lg:px-0 max-lg:text-[15px] max-lg:font-medium max-lg:text-white max-lg:underline max-lg:underline-offset-4 max-lg:shadow-none lg:min-h-9 lg:px-4 lg:text-[15px]`}>Shop OTC products</Link>
          </div>
          <p className="mt-2 hidden items-start gap-2 lg:flex"><service.icon aria-hidden="true" strokeWidth={1.6} className="mt-0.5 size-5 text-primary" /><span><span className="rx-serif block text-[16px] leading-tight">{service.title}</span><span className="text-[13px] text-muted-foreground">{service.detail}</span></span></p>
        </div>
      </section>
    </div>

    {/* Phone only: today's hours and the phone number on one line. */}
    {(location.hours || phone) && <p className="flex min-h-11 items-center justify-between gap-3 px-5 pt-2 lg:hidden">
      {location.hours ? <OpenNow week={location.hours.pharmacy} timezone={location.timezone} label="Pharmacy" /> : <span />}
      {phone && <a href={`tel:${phone}`} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-[14px] font-medium text-primary"><Phone aria-hidden="true" strokeWidth={1.7} className="size-4" />Call</a>}
    </p>}

    {/* Featured products */}
    {featured.length > 0 && <section aria-labelledby="featured-title" className="px-4 pt-4 lg:px-8 lg:pt-5 xl:px-12">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="featured-title" className="rx-display text-[1.5rem] sm:text-[2rem] lg:text-[1.75rem]">Featured products</h2>
        <Link href="/products" className="rx-serif inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap text-[15px] text-primary hover:underline lg:text-[17px]">View all<span className="hidden lg:inline"> products</span><ArrowRight aria-hidden="true" className="hidden size-4 lg:block" /></Link>
      </div>
      <ul className="mt-1 grid grid-cols-2 gap-3 lg:mt-2 lg:grid-cols-4 lg:gap-5">
        {featured.map((product) => <li key={product.id} className="flex min-w-0"><ProductCard product={product} locationId={location.id} orderingEnabled={location.onlineOrderingEnabled} className="w-full" /></li>)}
      </ul>
    </section>}

    {/* Phone only: departments (the desktop rail carries these). */}
    {categories.length > 0 && <nav aria-labelledby="departments-title" className="px-4 pt-8 lg:hidden">
      <h2 id="departments-title" className="rx-display text-[1.5rem] sm:text-[2rem]">Shop by department</h2>
      <ul className="mt-2 grid grid-cols-2 gap-x-4 sm:grid-cols-3">
        {categories.map((entry) => <li key={entry.value} className="border-b border-[var(--rx-rule)]"><Link href={categoryHref(entry.value)} className="flex min-h-12 items-center gap-2.5 text-[15px] leading-tight"><CategoryIcon category={entry.value} />{categoryLabel(entry.value)}</Link></li>)}
      </ul>
    </nav>}

    {/* Trust strip */}
    <section aria-label="Why shop with us" className="mt-8 border-y border-[var(--rx-rule)] bg-[oklch(0.955_0.02_185)] lg:mt-6">
      <ul className="grid gap-x-5 gap-y-4 px-5 py-5 sm:grid-cols-2 lg:grid-cols-4 lg:px-8 lg:py-3 xl:px-12">
        {trust.map(({ icon: Icon, title, detail }) => <li key={title} className="flex items-start gap-3 lg:items-center lg:gap-2.5">
          <Icon aria-hidden="true" strokeWidth={1.4} className="size-9 shrink-0 text-primary lg:size-7" />
          <span className="min-w-0"><span className="rx-serif block text-[18px] leading-tight lg:text-[15px]">{title}</span><span className="block text-[14px] text-muted-foreground lg:text-[12.5px] lg:leading-snug">{detail}</span></span>
        </li>)}
      </ul>
    </section>

  </>
}

export default HomePage
