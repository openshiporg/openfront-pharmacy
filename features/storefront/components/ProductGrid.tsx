'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import type { PublicPharmacyCatalogPageProjection } from '@/features/pharmacy/contracts'
import { prescriptionRequirementLabel, publicCatalogAvailability } from '../lib/catalog-availability'
import { getCatalogPage } from '../lib/data/catalog'
import { formatMoney, formatStatus } from '../lib/money'
import { AddProductButton } from './AddProductButton'
import { ProductImage } from './ProductImage'
import { Dot, Pill, Track, pillClass, trackClass } from './rx-ui'

const ALL = '__all__'

export function ProductGrid({ locationId, orderingEnabled, initialPage, title = 'Shop', eyebrow }: { locationId: string; orderingEnabled: boolean; initialPage: PublicPharmacyCatalogPageProjection; title?: string; eyebrow?: string }) {
  const [products, setProducts] = useState(initialPage.items)
  const [hasMore, setHasMore] = useState(initialPage.hasMore)
  const [nextCursor, setNextCursor] = useState(initialPage.nextCursor)
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [totalCount, setTotalCount] = useState(initialPage.totalCount)
  const [category, setCategory] = useState(ALL)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  // Categories filter the loaded page, so they only show once every product is loaded.
  const categories = useMemo(() => hasMore ? [] : Array.from(new Set(products.map((product) => product.category).filter((value): value is string => Boolean(value)))).sort(), [hasMore, products])
  const visible = category === ALL ? products : products.filter((product) => product.category === category)

  function load(term: string, after: string | null) {
    setError('')
    startTransition(async () => {
      const page = await getCatalogPage({ locationId, search: term || null, after })
      if (!page.success) return setError('Products could not be loaded. Try again.')
      setProducts((current) => after ? [...current, ...page.data.items.filter((item) => !current.some((existing) => existing.id === item.id))] : page.data.items)
      setHasMore(page.data.hasMore)
      setNextCursor(page.data.nextCursor)
      setTotalCount(page.data.totalCount)
      setAppliedSearch(term)
      if (!after) setCategory(ALL)
    })
  }

  return <section id="products" aria-labelledby="products-title" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow && <p className="rx-eyebrow mb-2">{eyebrow}</p>}
        <h2 id="products-title" className="flex items-baseline gap-3 text-[1.75rem] font-semibold tracking-[-0.02em]">{title}<span className="rx-num text-sm font-normal text-muted-foreground">{totalCount}</span></h2>
      </div>
      <form role="search" onSubmit={(event) => { event.preventDefault(); load(search.trim(), null) }} className={`${trackClass} w-full gap-1 sm:max-w-md`}>
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search products</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" value={search} onChange={(event) => setSearch(event.target.value)} maxLength={100} placeholder="Search products" className="h-9 rounded-full border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0 max-sm:h-10" />
        </label>
        <button type="submit" disabled={pending} data-active="true" className={`${pillClass} px-4 font-semibold`}>{pending ? 'Searching…' : 'Search'}</button>
      </form>
    </div>

    {categories.length > 1 && <Track label="Category" className="mt-6">
      <Pill active={category === ALL} onClick={() => setCategory(ALL)}>All</Pill>
      {categories.map((entry) => <Pill key={entry} active={category === entry} onClick={() => setCategory(entry)} className="capitalize">{formatStatus(entry)}</Pill>)}
    </Track>}

    {appliedSearch && <p className="mt-4 text-sm text-muted-foreground" aria-live="polite"><span className="rx-num">{totalCount}</span> {totalCount === 1 ? 'result' : 'results'} for “{appliedSearch}”</p>}
    {error && <p role="alert" className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

    <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
      {visible.map((product) => {
        const availability = publicCatalogAvailability(product)
        const requirement = prescriptionRequirementLabel(product.prescriptionRequirement)
        const href = `/products/${encodeURIComponent(product.handle)}`
        return <li key={product.id} className="flex min-w-0 flex-col">
          <Link href={href} aria-label={`View ${product.title}`} className="group relative block aspect-square overflow-hidden rounded-2xl border border-border bg-muted">
            <ProductImage src={product.imageUrl} alt={product.title} fallbackLabel={product.title} sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
            {requirement && <span className="absolute left-2.5 top-2.5 rounded-full bg-card/95 px-2.5 py-1 text-[11px] font-semibold shadow-[var(--rx-raise)]">{requirement}</span>}
          </Link>
          {product.category && <p className="rx-eyebrow mt-3">{formatStatus(product.category)}</p>}
          <h3 className="mt-1 flex items-baseline gap-2 text-[15px] font-semibold leading-snug">
            <Dot tone={availability.canOrder ? 'ok' : 'muted'} />
            <Link href={href} className="min-w-0 hover:underline hover:underline-offset-4">{product.title}<span className="sr-only"> · {availability.canOrder ? 'In stock' : 'Unavailable'}</span></Link>
          </h3>
          <div className="mt-auto flex flex-wrap items-end justify-between gap-x-3 gap-y-2 pt-3">
            <div>
              <p className="rx-num text-base font-medium">{formatMoney(product.priceAmount, product.currencyCode)}</p>
              {!availability.canOrder && <p className="mt-0.5 text-xs text-muted-foreground">Unavailable</p>}
            </div>
            {orderingEnabled && availability.canOrder && <AddProductButton locationId={locationId} productId={product.id} label="Add" compact />}
          </div>
        </li>
      })}
    </ul>
    {visible.length === 0 && <p className="mt-6 rounded-2xl border border-dashed border-[var(--rx-rule)] px-6 py-12 text-center text-sm text-muted-foreground">{appliedSearch ? 'No products match this search.' : 'No products are available at this location.'}</p>}
    {hasMore && <div className="mt-10 flex justify-center"><span className={trackClass}><button type="button" data-active="true" onClick={() => load(appliedSearch, nextCursor)} disabled={pending || !nextCursor} className={`${pillClass} px-5 font-semibold`}>{pending ? 'Loading…' : 'Load more'}</button></span></div>}
  </section>
}
