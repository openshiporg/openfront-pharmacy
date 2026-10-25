import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { AddProductButton } from '../components/AddProductButton'
import { ProductImage } from '../components/ProductImage'
import { Field, Notice, TitleLine } from '../components/rx-ui'
import { prescriptionRequirementLabel, publicCatalogAvailability } from '../lib/catalog-availability'
import { fetchCatalogPage, getStorefrontProduct } from '../lib/data/store'
import { formatMoney } from '../lib/money'
import { categoryLabel } from '../lib/categories'

type Props = { params: Promise<{ handle: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  const result = await getStorefrontProduct(decodeURIComponent(handle))
  if (!result) return { title: 'Product not found' }
  return { title: result.product.title, description: result.product.description || undefined }
}

export async function ProductPage({ params }: Props) {
  const { handle } = await params
  const result = await getStorefrontProduct(decodeURIComponent(handle))
  if (!result) notFound()
  const { product, location } = result
  const availability = publicCatalogAvailability(product)
  const requirement = prescriptionRequirementLabel(product.prescriptionRequirement)
  const price = formatMoney(product.priceAmount, product.currencyCode)
  const canBuy = location.onlineOrderingEnabled && availability.canOrder
  const relatedPage = product.category ? await fetchCatalogPage({ locationId: location.id, category: product.category, first: 5 }).catch(() => null) : null
  const related = relatedPage?.success ? relatedPage.data.items.filter((entry) => entry.id !== product.id).slice(0, 4) : []

  return <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pb-16">
    <Link href="/products" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft aria-hidden="true" className="size-4" />Shop</Link>
    <section className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14">
      <div className="rx-dome relative m-2 aspect-square overflow-hidden">
        <ProductImage src={product.imageUrl} alt={product.title} fallbackLabel={product.title} sizes="(max-width: 1024px) 100vw, 55vw" />
      </div>
      <div className="min-w-0 lg:pt-4">
        {product.category && <p className="rx-eyebrow">{categoryLabel(product.category)}</p>}
        <TitleLine as="h1" className="mt-2" title={product.title} titleClassName="text-[2rem] leading-[1.1] tracking-[-0.025em] sm:text-[2.5rem]" tone={availability.canOrder ? 'ok' : 'muted'} state={availability.canOrder ? 'In stock' : 'Unavailable'} />
        <p className="rx-num mt-4 text-2xl">{price}</p>
        {product.description && <p className="mt-5 max-w-prose text-[15px] leading-7 text-muted-foreground">{product.description}</p>}

        <div className="mt-7 hidden sm:block">
          {canBuy
            ? <AddProductButton locationId={location.id} productId={product.id} align="start" className="min-h-12 px-7" />
            : <Notice>{location.onlineOrderingEnabled ? 'Unavailable at this pharmacy.' : 'Online ordering is off at this pharmacy. Call to order.'}</Notice>}
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t-2 border-dotted border-[var(--rx-perf)] pt-6">
          <Field label="Pharmacy">{location.name}</Field>
          <Field label="SKU"><span className="rx-num">{product.sku}</span></Field>
          <Field label="Prescription">{requirement || 'Not required'}</Field>
          <Field label="Service">{[location.pickupEnabled && 'Pickup', location.deliveryEnabled && 'Delivery'].filter(Boolean).join(' · ') || 'In store'}</Field>
        </dl>
      </div>
    </section>

    {related.length > 0 && <section aria-labelledby="related-title" className="mt-16">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="related-title" className="text-xl font-semibold tracking-tight">More in {categoryLabel(product.category)}</h2>
        <Link href={`/products?category=${product.category}#products`} className="text-sm font-semibold text-primary">See all</Link>
      </div>
      <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
        {related.map((entry) => <li key={entry.id} className="min-w-0">
          <Link href={`/products/${encodeURIComponent(entry.handle)}`} className="group block">
            <span className="rx-dome relative block aspect-square overflow-hidden"><ProductImage src={entry.imageUrl} alt={entry.title} fallbackLabel={entry.title} sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" /></span>
            <span className="mt-3 block text-[15px] font-semibold leading-snug group-hover:underline group-hover:underline-offset-4">{entry.title}</span>
            <span className="rx-num mt-1 block text-sm text-muted-foreground">{formatMoney(entry.priceAmount, entry.currencyCode)}</span>
          </Link>
        </li>)}
      </ul>
    </section>}

    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-4 py-3 sm:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0"><p className="truncate text-sm font-semibold">{product.title}</p><p className="rx-num text-sm text-muted-foreground">{price}</p></div>
        {canBuy ? <AddProductButton locationId={location.id} productId={product.id} label="Add" /> : <span className="text-sm text-muted-foreground">Unavailable</span>}
      </div>
    </div>
  </div>
}

export default ProductPage
