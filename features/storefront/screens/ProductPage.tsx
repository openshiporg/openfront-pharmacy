import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { AddProductButton } from '../components/AddProductButton'
import { ProductImage } from '../components/ProductImage'
import { publicCatalogAvailability } from '../lib/catalog-availability'
import { getStorefrontProduct } from '../lib/data/store'
import { formatMoney, formatStatus } from '../lib/money'

type Props = { params: Promise<{ handle: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  const result = await getStorefrontProduct(decodeURIComponent(handle))
  if (!result) return { title: 'Product not found' }
  return { title: `${result.product.title} | ${result.storefront.brand.displayName}`, description: result.product.description || undefined }
}

export async function ProductPage({ params }: Props) {
  const { handle } = await params
  const result = await getStorefrontProduct(decodeURIComponent(handle))
  if (!result) notFound()
  const { product, location } = result
  const availability = publicCatalogAvailability(product)

  return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
    <Link href="/products" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold"><ArrowLeft className="size-4" /> All products</Link>
    <section className="mt-6 grid overflow-hidden rounded-3xl bg-card lg:grid-cols-2">
      <div className="relative min-h-72 bg-muted sm:min-h-[30rem]"><ProductImage src={product.imageUrl} alt={product.title} sizes="(max-width: 1024px) 100vw, 50vw" /></div>
      <div className="p-7 sm:p-10">
        {product.category && <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">{formatStatus(product.category)}</p>}
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">{product.title}</h1>
        {product.description && <p className="mt-5 leading-7 text-muted-foreground">{product.description}</p>}
        <dl className="mt-7 grid gap-4 border-y border-border py-6 text-sm">
          <div className="flex justify-between gap-4"><dt>Price</dt><dd className="font-semibold">{formatMoney(product.priceAmount, product.currencyCode)}</dd></div>
          <div className="flex justify-between gap-4"><dt>Availability</dt><dd className="font-semibold">{availability.canOrder ? 'In stock' : 'Unavailable'}</dd></div>
          <div className="flex justify-between gap-4"><dt>Location</dt><dd className="text-right font-semibold">{location.name}</dd></div>
        </dl>
        <div className="mt-7">
          {!location.onlineOrderingEnabled
            ? <p className="text-sm text-muted-foreground">Online ordering is unavailable at this location. Call the pharmacy to place an order.</p>
            : availability.canOrder
              ? <AddProductButton locationId={location.id} productId={product.id} className="rounded-full" align="start" />
              : <p className="text-sm text-muted-foreground">This product is currently unavailable.</p>}
        </div>
      </div>
    </section>
  </div>
}

export default ProductPage
