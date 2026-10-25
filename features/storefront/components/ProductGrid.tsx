'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import type { PublicPharmacyCatalogPageProjection } from '@/features/pharmacy/contracts'
import { prescriptionRequirementLabel, publicCatalogAvailability } from '../lib/catalog-availability'
import { getCatalogPage } from '../lib/data/catalog'
import { formatMoney } from '../lib/money'
import { AddProductButton } from './AddProductButton'
import { ProductImage } from './ProductImage'
import { Dot, PillLink, Track, pillClass, trackClass } from './rx-ui'
import { categoryLabel } from '../lib/categories'

export function ProductGrid({ locationId, orderingEnabled, initialPage, title = 'Shop', eyebrow, categories = [], activeCategory = null }: { locationId: string; orderingEnabled: boolean; initialPage: PublicPharmacyCatalogPageProjection; title?: string; eyebrow?: string; categories?: Array<{ value: string; count: number }>; activeCategory?: string | null }) {
  const [products, setProducts] = useState(initialPage.items)
  const [hasMore, setHasMore] = useState(initialPage.hasMore)
  const [nextCursor, setNextCursor] = useState(initialPage.nextCursor)
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [totalCount, setTotalCount] = useState(initialPage.totalCount)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const visible = products

  function load(term: string, after: string | null) {
    setError('')
    startTransition(async () => {
      const page = await getCatalogPage({ locationId, search: term || null, category: activeCategory, after })
      if (!page.success) return setError('Products could not be loaded. Try again.')
      setProducts((current) => after ? [...current, ...page.data.items.filter((item) => !current.some((existing) => existing.id === item.id))] : page.data.items)
      setHasMore(page.data.hasMore)
      setNextCursor(page.data.nextCursor)
      setTotalCount(page.data.totalCount)
      setAppliedSearch(term)
    })
  }

  return <section id="products" aria-labelledby="products-title" className="bg-[var(--rx-field)]"><div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 id="products-title" className="flex items-baseline gap-3 text-[2.5rem] font-extrabold leading-none tracking-[-0.04em] sm:text-[3.25rem]">{title}<span className="rx-num text-sm font-normal text-muted-foreground">{totalCount}</span></h2>
      </div>
      <form role="search" onSubmit={(event) => { event.preventDefault(); load(search.trim(), null) }} className={`${trackClass} w-full gap-1 sm:max-w-md`}>
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search products</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" value={search} onChange={(event) => setSearch(event.target.value)} maxLength={100} placeholder="Search products" className="h-9 rounded-[14px] border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0 max-sm:h-10" />
        </label>
        <button type="submit" disabled={pending} data-active="true" className={`${pillClass} px-4 font-semibold`}>{pending ? 'Searching…' : 'Search'}</button>
      </form>
    </div>

    {categories.length > 1 && <Track label="Category" className="mt-6">
      <PillLink href="/products#products" active={!activeCategory} scroll={false}>All</PillLink>
      {categories.map((entry) => <PillLink key={entry.value} href={`/products?category=${entry.value}#products`} active={activeCategory === entry.value} scroll={false}>{categoryLabel(entry.value)} <span className="rx-num text-[13px] text-muted-foreground">{entry.count}</span></PillLink>)}
    </Track>}

    {appliedSearch && <p className="mt-4 text-sm text-muted-foreground" aria-live="polite"><span className="rx-num">{totalCount}</span> {totalCount === 1 ? 'result' : 'results'} for “{appliedSearch}”</p>}
    {error && <p role="alert" className="mt-4 rounded-[14px] bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

    <ul className="rx-press mt-10 grid grid-cols-2 gap-x-[14px] gap-y-10 lg:grid-cols-4">
      {visible.map((product) => {
        const availability = publicCatalogAvailability(product)
        const requirement = prescriptionRequirementLabel(product.prescriptionRequirement)
        const href = `/products/${encodeURIComponent(product.handle)}`
        return <li key={product.id} className="flex min-w-0 flex-col">
          <Link href={href} aria-label={`View ${product.title}`} className="rx-dome group relative block aspect-square overflow-hidden">
            <ProductImage src={product.imageUrl} alt={product.title} fallbackLabel={product.title} sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.03]" />
            {requirement && <span className="absolute left-2.5 top-2.5 z-10 rounded-[14px] bg-background px-2.5 py-1 text-[13px] font-semibold">{requirement}</span>}
          </Link>
          <h3 className="mt-4 text-[16px] font-bold leading-snug">
            <Link href={href} className="break-words [overflow-wrap:anywhere] hover:underline hover:underline-offset-4"><Dot tone={availability.canOrder ? 'ok' : 'muted'} className="mr-2" />{product.title}<span className="sr-only"> · {availability.canOrder ? 'In stock' : 'Unavailable'}</span></Link>
          </h3>
          {product.category && <p className="mt-1 text-[13px] text-muted-foreground">{categoryLabel(product.category)}</p>}
          <div className="mt-auto flex flex-wrap items-end justify-between gap-x-3 gap-y-2 pt-3">
            <div>
              <p className="text-base font-bold">{formatMoney(product.priceAmount, product.currencyCode)}</p>
              {!availability.canOrder && <p className="mt-0.5 text-[13px] text-muted-foreground">Unavailable</p>}
            </div>
            {orderingEnabled && availability.canOrder && <AddProductButton locationId={locationId} productId={product.id} label="Add" compact />}
          </div>
        </li>
      })}
    </ul>
    {visible.length === 0 && <p className="rx-card mt-6 px-6 py-12 text-center text-sm text-muted-foreground">{appliedSearch ? 'No products match this search.' : 'No products are available at this location.'}</p>}
    {hasMore && <div className="mt-10 flex justify-center"><span className={trackClass}><button type="button" data-active="true" onClick={() => load(appliedSearch, nextCursor)} disabled={pending || !nextCursor} className={`${pillClass} px-5 font-semibold`}>{pending ? 'Loading…' : 'Load more'}</button></span></div>}
  </div></section>
}
