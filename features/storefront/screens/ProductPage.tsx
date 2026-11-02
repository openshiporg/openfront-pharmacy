import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Check, ChevronRight, ClipboardList, Info, MapPin, Phone, Search, ShieldCheck, Store, Truck, UserRound } from 'lucide-react'

import { AddProductButton } from '../components/AddProductButton'
import { CategoryIcon } from '../components/CategoryIcon'
import { OpenNow } from '../components/LocationHours'
import { ProductImage } from '../components/ProductImage'
import { Notice } from '../components/rx-ui'
import { prescriptionRequirementLabel, publicCatalogAvailability } from '../lib/catalog-availability'
import { categoryLabel, categoryShortLabel } from '../lib/categories'
import { fetchCatalogPage, getStorefrontCategories, getStorefrontProduct } from '../lib/data/store'
import { formatAddress, formatMoney } from '../lib/money'
import { categoryHref } from '../modules/layout/templates/nav/links'

type Props = { params: Promise<{ handle: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  const result = await getStorefrontProduct(decodeURIComponent(handle))
  if (!result) return { title: 'Product not found' }
  return { title: result.product.title, description: result.product.description || undefined }
}

function Section({ icon: Icon, title, children }: { icon: typeof Info; title: string; children: React.ReactNode }) {
  return <section className="border-b border-[var(--rx-rule)] py-5 first:pt-0">
    <h2 className="rx-serif flex items-center gap-2.5 text-[20px]"><Icon aria-hidden="true" strokeWidth={1.7} className="size-5 text-primary" />{title}</h2>
    <div className="mt-2 pl-[30px] text-[15px] leading-relaxed text-foreground/85">{children}</div>
  </section>
}

export async function ProductPage({ params }: Props) {
  const { handle } = await params
  const result = await getStorefrontProduct(decodeURIComponent(handle))
  if (!result) notFound()
  const { product, location, storefront } = result
  const availability = publicCatalogAvailability(product)
  const requirement = prescriptionRequirementLabel(product.prescriptionRequirement)
  const price = formatMoney(product.priceAmount, product.currencyCode)
  const canBuy = location.onlineOrderingEnabled && availability.canOrder
  const [relatedPage, categories] = await Promise.all([
    product.category ? fetchCatalogPage({ locationId: location.id, category: product.category, first: 5 }).catch(() => null) : null,
    getStorefrontCategories(location.id),
  ])
  let related = relatedPage?.success ? relatedPage.data.items.filter((entry) => entry.id !== product.id) : []
  if (related.length < 4) {
    const more = await fetchCatalogPage({ locationId: location.id, first: 8 }).catch(() => null)
    if (more?.success) related = [...related, ...more.data.items.filter((entry) => entry.id !== product.id && !related.some((existing) => existing.id === entry.id))]
  }
  related = related.slice(0, 4)
  const phone = location.phone || storefront.brand.supportPhone
  const address = formatAddress(location.address)
  const methods = [location.pickupEnabled && { key: 'pickup', label: 'Pickup', icon: Store }, location.deliveryEnabled && { key: 'delivery', label: 'Delivery', icon: Truck }].filter(Boolean) as Array<{ key: string; label: string; icon: typeof Store }>
  const facts = [product.category && categoryLabel(product.category), requirement || 'No prescription needed', availability.canOrder ? 'In stock at this pharmacy' : null].filter(Boolean) as string[]

  return <div className="mx-auto max-w-[90rem] px-4 pb-28 pt-4 sm:px-8 lg:pb-16 lg:pt-8 xl:px-16">
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[14px] text-muted-foreground">
      <Link href="/products" className="inline-flex min-h-10 items-center hover:text-primary">Shop</Link>
      {product.category && <><ChevronRight aria-hidden="true" className="size-3.5 shrink-0" /><Link href={categoryHref(product.category)} className="inline-flex min-h-10 items-center truncate hover:text-primary">{categoryLabel(product.category)}</Link></>}
    </nav>

    <div className="mt-2 grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_300px] xl:gap-10">
      {/* Left: shop by category and why shop with us */}
      <aside className="order-3 grid content-start gap-6 lg:order-none lg:row-span-2">
        {categories.length > 0 && <nav aria-labelledby="by-category">
          <h2 id="by-category" className="rx-serif text-[22px]">Shop by category</h2>
          <ul className="mt-3 grid">
            {categories.map((entry) => <li key={entry.value}><Link href={categoryHref(entry.value)} aria-current={entry.value === product.category ? 'true' : undefined} className="rx-serif flex min-h-11 items-center gap-3 text-[17px] hover:text-primary aria-[current]:text-primary"><CategoryIcon category={entry.value} /><span className="flex-1">{categoryLabel(entry.value)}</span><ChevronRight aria-hidden="true" className="size-4 text-muted-foreground" /></Link></li>)}
          </ul>
          <Link href="/products" className="mt-2 flex min-h-11 items-center justify-between border-t border-[var(--rx-rule)] pt-2 text-[13px] font-semibold uppercase tracking-[0.06em] hover:text-primary">Shop all categories<ChevronRight aria-hidden="true" className="size-4" /></Link>
        </nav>}
        <div className="rounded-[8px] bg-[oklch(0.955_0.003_50)] p-5">
          <h2 className="text-[14px] font-semibold uppercase tracking-[0.06em]">Why shop with us?</h2>
          <ul className="mt-3 divide-y divide-[var(--rx-rule)]">
            <li className="flex gap-3 py-3"><MapPin aria-hidden="true" strokeWidth={1.5} className="size-8 shrink-0 rounded-full border border-primary/40 p-1.5 text-primary" /><span><span className="rx-serif block text-[17px] leading-tight">{location.name}</span><span className="text-[13.5px] text-muted-foreground">{address || 'Your local pharmacy'}</span></span></li>
            <li className="flex gap-3 py-3"><UserRound aria-hidden="true" strokeWidth={1.5} className="size-8 shrink-0 rounded-full border border-primary/40 p-1.5 text-primary" /><span><span className="rx-serif block text-[17px] leading-tight">Pharmacist care</span><span className="text-[13.5px] text-muted-foreground">Questions answered at the counter or by phone.</span></span></li>
            <li className="flex gap-3 py-3"><ClipboardList aria-hidden="true" strokeWidth={1.5} className="size-8 shrink-0 rounded-full border border-primary/40 p-1.5 text-primary" /><span><span className="rx-serif block text-[17px] leading-tight">Prescriptions online</span><span className="text-[13.5px] text-muted-foreground">Refill, transfer and track.</span></span></li>
          </ul>
        </div>
      </aside>

      {/* Centre: photo and buy box */}
      <div className="min-w-0">
        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          <div className="rx-photo relative aspect-square overflow-hidden rounded-[8px]">
            <ProductImage src={product.imageUrl} alt={product.title} fallbackLabel={product.title} sizes="(max-width: 768px) 100vw, 30vw" />
            {requirement && <span className="rx-plate absolute left-3 top-3 px-2 py-0.5 text-[13px] font-semibold">{requirement}</span>}
          </div>
          <div className="min-w-0">
            <p className="text-[15px] text-muted-foreground">{storefront.brand.displayName}</p>
            <h1 className="rx-display mt-1 text-[1.9rem] leading-[1.1] sm:text-[2.25rem]">{product.title}</h1>
            <p className="mt-2 inline-flex items-center gap-1.5 text-[14px] text-muted-foreground"><span className={`size-2 rounded-full ${availability.canOrder ? 'bg-emerald-600' : 'bg-muted-foreground/50'}`} aria-hidden="true" />{availability.canOrder ? 'In stock' : 'Unavailable'}<span className="text-foreground/30">·</span>SKU <span className="rx-num">{product.sku}</span></p>
            <p className="rx-display rx-num mt-3 text-[2.25rem] text-foreground">{price}</p>
            {product.description && <p className="mt-2 text-[15.5px] leading-relaxed text-foreground/85">{product.description}</p>}
            <ul className="mt-3 grid gap-1">{facts.map((fact) => <li key={fact} className="flex items-center gap-2 text-[15px] text-foreground/85"><Check aria-hidden="true" className="size-4 text-muted-foreground" />{fact}</li>)}</ul>

            <div className="mt-5 hidden sm:block">
              {canBuy
                ? <AddProductButton locationId={location.id} productId={product.id} align="start" withQuantity className="w-full" />
                : <Notice>{location.onlineOrderingEnabled ? 'Unavailable at this pharmacy.' : 'Online ordering is off at this pharmacy. Call to order.'}</Notice>}
            </div>

            {methods.length > 0 && <div className="mt-6">
              <p className="rx-serif text-[18px]">Pickup or delivery</p>
              <ul className="mt-2 grid grid-cols-2 gap-2">{methods.map((method, index) => <li key={method.key} className={`flex h-11 items-center justify-center gap-2 rounded-full text-[16px] ${index === 0 ? 'bg-primary text-primary-foreground' : 'border border-input bg-card'}`}><method.icon aria-hidden="true" strokeWidth={1.7} className="size-[18px]" />{method.label}</li>)}</ul>
              <p className="mt-3 flex items-start gap-2 text-[15px]"><MapPin aria-hidden="true" strokeWidth={1.7} className="mt-0.5 size-4 shrink-0" /><span><span className="block">{location.name}</span>{location.hours ? <OpenNow week={location.hours.pharmacy} timezone={location.timezone} label="Pharmacy" /> : <span className="text-[14px] text-muted-foreground">{methods.map((method) => method.label).join(' or ')} at checkout</span>}</span></p>
            </div>}
          </div>
        </div>

        <div className="mt-8 border-t border-[var(--rx-rule)] pt-5">
          <Section icon={Info} title="Details">{product.description || product.title}</Section>
          <Section icon={ShieldCheck} title="Prescription">{requirement ? `${requirement}. The pharmacy reviews this item before it is released.` : 'No prescription needed.'}</Section>
          <Section icon={Phone} title="Questions">Ask a pharmacist before use if you take other medicines or have a health condition.{phone && <> Call <a href={`tel:${phone}`} className="rx-num font-medium text-primary hover:underline">{phone}</a>.</>}</Section>
        </div>
      </div>

      {/* Right: related products */}
      {related.length > 0 && <aside aria-labelledby="related-title" className="min-w-0 lg:col-start-2 xl:col-start-auto">
        <h2 id="related-title" className="rx-serif flex items-center gap-2 text-[20px]"><Search aria-hidden="true" strokeWidth={1.7} className="size-[18px]" />Shop related products</h2>
        <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-4 xl:grid-cols-2">
          {related.map((entry) => <li key={entry.id} className="min-w-0">
            <Link href={`/products/${encodeURIComponent(entry.handle)}`} className="group block max-md:!flex max-md:!flex-col max-md:!items-stretch">
              <span className="rx-photo relative block aspect-square overflow-hidden rounded-[6px]"><ProductImage src={entry.imageUrl} alt={entry.title} fallbackLabel={entry.title} sizes="(max-width: 1280px) 25vw, 150px" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" /></span>
              {entry.category && <span className="mt-2 block text-[13px] leading-tight text-muted-foreground">{categoryShortLabel(entry.category)}</span>}
              <span className="line-clamp-2 block break-words text-[15px] leading-snug group-hover:text-primary">{entry.title}</span>
              <span className="rx-num block text-[15px] font-semibold">{formatMoney(entry.priceAmount, entry.currencyCode)}</span>
            </Link>
          </li>)}
        </ul>
      </aside>}
    </div>

    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--rx-rule)] bg-card px-4 py-3 sm:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0"><p className="truncate text-[15px] font-semibold">{product.title}</p><p className="rx-num text-[15px] text-primary">{price}</p></div>
        {canBuy ? <AddProductButton locationId={location.id} productId={product.id} label="Add to cart" className="min-h-11 px-5 text-[16px]" /> : <span className="text-sm text-muted-foreground">Unavailable</span>}
      </div>
    </div>
  </div>
}

export default ProductPage
