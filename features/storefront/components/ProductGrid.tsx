'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { PublicPharmacyCatalogPageProjection } from '@/features/pharmacy/contracts'
import { publicCatalogAvailability } from '../lib/catalog-availability'
import { getCatalogPage } from '../lib/data/catalog'
import { formatMoney, formatStatus } from '../lib/money'
import { AddProductButton } from './AddProductButton'
import { ProductImage } from './ProductImage'

export function ProductGrid({ locationId, orderingEnabled, initialPage, title = 'Shop' }: { locationId: string; orderingEnabled: boolean; initialPage: PublicPharmacyCatalogPageProjection; title?: string }) {
  const [products, setProducts] = useState(initialPage.items)
  const [hasMore, setHasMore] = useState(initialPage.hasMore)
  const [nextCursor, setNextCursor] = useState(initialPage.nextCursor)
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [totalCount, setTotalCount] = useState(initialPage.totalCount)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function load(term: string, after: string | null) {
    setError('')
    startTransition(async () => {
      const page = await getCatalogPage({ locationId, search: term || null, after })
      if (!page.success) return setError('Products could not be loaded. Please try again.')
      setProducts((current) => after ? [...current, ...page.data.items.filter((item) => !current.some((existing) => existing.id === item.id))] : page.data.items)
      setHasMore(page.data.hasMore)
      setNextCursor(page.data.nextCursor)
      setTotalCount(page.data.totalCount)
      setAppliedSearch(term)
    })
  }

  return <section id="products" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
    <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
      <form onSubmit={(event) => { event.preventDefault(); load(search.trim(), null) }} className="flex w-full gap-2 sm:max-w-xl">
        <Input aria-label="Search products" value={search} onChange={(event) => setSearch(event.target.value)} maxLength={100} placeholder="Search products" className="min-w-0 flex-1 bg-card" />
        <Button type="submit" disabled={pending} className="rounded-full">{pending ? 'Searching…' : 'Search'}</Button>
      </form>
    </div>
    {appliedSearch && <p className="mb-4 text-sm text-muted-foreground">{totalCount} {totalCount === 1 ? 'result' : 'results'} for “{appliedSearch}”</p>}
    {error && <p role="alert" className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}
    <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => {
        const availability = publicCatalogAvailability(product)
        const href = `/products/${encodeURIComponent(product.handle)}`
        return <article key={product.id} className="flex flex-col bg-card p-5">
          <Link href={href} aria-label={`View ${product.title}`} className="relative block aspect-[4/3] overflow-hidden rounded-xl bg-muted"><ProductImage src={product.imageUrl} alt={product.title} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" /></Link>
          {product.category && <p className="mt-5 text-xs uppercase tracking-[.14em] text-muted-foreground">{formatStatus(product.category)}</p>}
          <h3 className="mt-2 text-xl font-semibold tracking-tight"><Link href={href} className="hover:underline">{product.title}</Link></h3>
          {product.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{product.description}</p>}
          <div className="mt-auto flex items-end justify-between gap-3 pt-6">
            <div><span className="text-lg font-semibold">{formatMoney(product.priceAmount, product.currencyCode)}</span><p className="mt-1 text-xs text-muted-foreground">{availability.canOrder ? 'In stock' : 'Unavailable'}</p></div>
            {orderingEnabled && availability.canOrder && <AddProductButton locationId={locationId} productId={product.id} label="Add" />}
          </div>
        </article>
      })}
    </div>
    {products.length === 0 && <p className="mt-6 text-sm text-muted-foreground">{appliedSearch ? 'No products match this search.' : 'No products are available at this location.'}</p>}
    {hasMore && <div className="mt-8 flex justify-center"><Button variant="outline" onClick={() => load(appliedSearch, nextCursor)} disabled={pending || !nextCursor} className="rounded-full px-6">{pending ? 'Loading…' : 'Load more products'}</Button></div>}
  </section>
}
