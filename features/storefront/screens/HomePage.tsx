import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ChevronRight, ClipboardList, Clock, House, MessageCircleMore, PackageSearch, ShieldCheck, Store, Truck } from 'lucide-react'

import type { PublicPharmacyLocationProjection } from '@/features/pharmacy/contracts'
import { formatDay, openState } from '@/features/pharmacy/hours'
import { CategoryIcon } from '../components/CategoryIcon'
import { LocationPicker } from '../components/LocationPicker'
import { ProductCard } from '../components/ProductCard'
import { ProductGrid } from '../components/ProductGrid'
import { Dot, buttonClass, outlineButtonClass } from '../components/rx-ui'
import { categoryLabel } from '../lib/categories'
import { retrieveCart } from '../lib/data/cart'
import { fetchCatalogPage, getStorefront, getStorefrontCatalog, getStorefrontCategories, type Storefront } from '../lib/data/store'
import { HeaderSearch } from '../modules/layout/templates/nav'
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

function hoursSummary(location: PublicPharmacyLocationProjection) {
  if (!location.hours) return null
  const state = openState(location.hours.pharmacy, location.timezone)
  if (state.today < 0) return null
  return `${state.open ? 'Open today' : 'Today'} ${formatDay(state.todayHours)}`
}

/** Phone only: three small info cards under the header. */
function InfoCards({ location, phone }: { location: PublicPharmacyLocationProjection; phone?: string | null }) {
  const service = serviceLine(location)
  const hours = hoursSummary(location)
  const card = 'rx-panel flex min-w-0 flex-col gap-0.5 px-2 py-2 shadow-[0_0_0_1px_var(--rx-rule),0_6px_16px_-12px_oklch(0.3_0.02_30/0.4)]'
  return <div className="grid grid-cols-3 gap-2 px-4 pt-3 lg:hidden">
    <Link href="/prescriptions#location" className={card}>
      <span className="flex items-center gap-1.5"><Clock aria-hidden="true" strokeWidth={1.6} className="size-3.5 shrink-0 text-primary" /><span className="text-[13px] font-semibold leading-tight">Store hours</span></span>
      <span className="line-clamp-2 text-[12px] leading-[1.25] text-muted-foreground">{hours || location.name}</span>
    </Link>
    {phone
      ? <a href={`tel:${phone}`} className={card}>
        <span className="flex items-center gap-1.5"><MessageCircleMore aria-hidden="true" strokeWidth={1.6} className="size-3.5 shrink-0 text-primary" /><span className="text-[13px] font-semibold leading-tight">Pharmacist</span></span>
        <span className="line-clamp-2 text-[12px] leading-[1.25] text-muted-foreground">Call to ask a question</span>
      </a>
      : <Link href="/prescriptions" className={card}><span className="text-[14px] font-semibold">Prescriptions</span></Link>}
    <Link href="/products" className={card}>
      <span className="flex items-center gap-1.5"><service.icon aria-hidden="true" strokeWidth={1.6} className="size-3.5 shrink-0 text-primary" /><span className="text-[13px] font-semibold leading-tight">{location.deliveryEnabled ? 'Delivery' : 'Pickup'}</span></span>
      <span className="line-clamp-2 text-[12px] leading-[1.25] text-muted-foreground">{location.deliveryEnabled ? 'Order online' : 'Order online, collect in store'}</span>
    </Link>
  </div>
}

/** Phone only: the department column beside the hero and featured products. */
function PhoneDepartments({ categories }: { categories: Array<{ value: string }> }) {
  const row = 'flex min-h-[44px] items-center gap-1.5 pl-2 pr-0.5 text-[13px] leading-[1.15] [overflow-wrap:normal] [word-break:normal] hyphens-none'
  return <nav aria-label="Departments" className="self-start rounded-r-[18px] bg-[oklch(0.955_0.003_50)] pb-2 lg:hidden">
    <ul>
      <li><Link href="/" aria-current="page" className={`${row} rounded-r-[18px] bg-accent text-primary`}><House aria-hidden="true" strokeWidth={1.6} className="size-[17px] shrink-0" /><span className="min-w-0 flex-1">Home</span><ChevronRight aria-hidden="true" className="size-3 shrink-0 text-muted-foreground" /></Link></li>
      <li><Link href="/prescriptions" className={row}><ClipboardList aria-hidden="true" strokeWidth={1.5} className="size-[17px] shrink-0" /><span className="min-w-0 flex-1">Prescription services</span><ChevronRight aria-hidden="true" className="size-3 shrink-0 text-muted-foreground" /></Link></li>
      {categories.map((entry) => <li key={entry.value}><Link href={categoryHref(entry.value)} className={row}><CategoryIcon category={entry.value} className="size-[17px] text-foreground" /><span className="min-w-0 flex-1">{categoryLabel(entry.value)}</span><ChevronRight aria-hidden="true" className="size-3 shrink-0 text-muted-foreground" /></Link></li>)}
    </ul>
  </nav>
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
    <InfoCards location={location} phone={phone} />

    <div className="grid grid-cols-[138px_minmax(0,1fr)] gap-x-2 pt-2.5 sm:grid-cols-[170px_minmax(0,1fr)] lg:block lg:pt-0">
      <PhoneDepartments categories={categories} />

      <div className="min-w-0 pr-4 lg:pr-0">
        {/* Hero */}
        <section aria-labelledby="home-title" className="relative overflow-hidden rounded-[18px] bg-[oklch(0.36_0.035_35)] lg:rounded-none lg:bg-[oklch(0.955_0.003_50)]">
          <div className="absolute inset-y-0 left-[46%] right-0 lg:left-auto lg:w-[60%]">
            <Image src="/storefront/hero-pharmacist.jpg" alt="" fill priority sizes="(max-width: 1024px) 70vw, 55vw" className="object-cover object-[100%_25%] lg:object-[70%_30%]" />
            <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.36_0.035_35)] to-transparent to-[14%] lg:via-[oklch(0.955_0.003_50/0.35)] lg:via-25% lg:from-[oklch(0.955_0.003_50)] lg:via-[oklch(0.955_0.003_50/0.35)] lg:via-25% lg:to-transparent lg:to-60%" />
          </div>
          <div className="relative flex min-h-[160px] flex-col justify-center py-2.5 pl-3 pr-0 sm:px-4 text-white sm:min-h-[340px] lg:min-h-0 lg:max-w-[44rem] lg:px-8 lg:py-5 lg:text-foreground xl:px-12">
            <h1 id="home-title" className="rx-display max-w-[44%] text-[1.15rem] leading-[1.08] sm:max-w-[14ch] sm:text-[2.5rem] lg:max-w-[22ch] lg:text-[2.25rem] xl:text-[2.4rem]">{headline}</h1>
            <p className="mt-1 max-w-[44%] text-[12px] leading-snug text-white/90 sm:max-w-[34ch] sm:text-[14px] lg:mt-1.5 lg:max-w-[48ch] lg:rx-serif lg:text-[17px] lg:text-foreground/85"><span className="lg:hidden">Refills and everyday health.</span><span className="max-lg:hidden">Prescriptions, refills and everyday health products from {location.name}.</span></p>
            <div className="mt-2 flex flex-col items-start gap-0 lg:mt-4 lg:gap-3 lg:flex-row lg:items-center">
              <Link href="/account#account-prescriptions" className={`${buttonClass} lg:min-h-10 lg:text-[16px] max-lg:!min-h-12 max-lg:bg-transparent max-lg:p-0 max-lg:shadow-none`}><span className="lg:contents max-lg:inline-flex max-lg:whitespace-nowrap max-lg:h-6 max-lg:items-center max-lg:gap-0.5 max-lg:rounded-full max-lg:bg-white max-lg:pl-2.5 max-lg:pr-1.5 max-lg:font-sans max-lg:text-[12px] max-lg:font-medium max-lg:text-foreground">Refill prescription<ChevronRight aria-hidden="true" className="size-3 lg:hidden" /></span></Link>
              <Link href="/products" className={`${outlineButtonClass} lg:min-h-10 lg:text-[16px] max-lg:!min-h-12 max-lg:border-0 max-lg:bg-transparent max-lg:p-0 max-lg:shadow-none`}><span className="lg:contents max-lg:inline-flex max-lg:whitespace-nowrap max-lg:h-6 max-lg:items-center max-lg:gap-0.5 max-lg:rounded-full max-lg:bg-white max-lg:pl-2.5 max-lg:pr-1.5 max-lg:font-sans max-lg:text-[12px] max-lg:font-medium max-lg:text-foreground">Shop OTC products<ChevronRight aria-hidden="true" className="size-3 lg:hidden" /></span></Link>
            </div>
            <HeaderSearch placeholder="Search for products by name, brand, or keyword…" className="mt-3 hidden w-full max-w-[33rem] lg:block" />
            <p className="mt-3 hidden items-start gap-2 lg:flex"><service.icon aria-hidden="true" strokeWidth={1.6} className="mt-0.5 size-5 text-primary" /><span><span className="rx-serif block text-[16px] leading-tight">{service.title}</span><span className="text-[13px] text-muted-foreground">{service.detail}</span></span></p>
          </div>
        </section>

        {/* Featured products */}
        {featured.length > 0 && <section aria-labelledby="featured-title" className="pt-2 lg:px-8 lg:pt-5 xl:px-12">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="featured-title" className="rx-display text-[1.3rem] sm:text-[2rem] lg:text-[1.75rem]">Featured products</h2>
            <Link href="/products" className="rx-serif inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap text-[15px] text-primary hover:underline lg:text-[17px]">View all<span className="hidden lg:inline"> products</span><ArrowRight aria-hidden="true" className="hidden size-4 lg:block" /></Link>
          </div>
          <ul className="mt-1 grid grid-cols-2 gap-2.5 lg:mt-2 lg:grid-cols-4 lg:gap-5">
            {featured.map((product) => <li key={product.id} className="flex min-w-0"><ProductCard product={product} locationId={location.id} orderingEnabled={location.onlineOrderingEnabled} size="sm" className="w-full lg:hidden" /><ProductCard product={product} locationId={location.id} orderingEnabled={location.onlineOrderingEnabled} className="hidden w-full lg:flex" /></li>)}
          </ul>
        </section>}
      </div>
    </div>

    {/* Trust strip */}
    <section aria-label="Why shop with us" className="mt-8 border-y border-[var(--rx-rule)] bg-[oklch(0.955_0.003_50)] lg:mt-6">
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
