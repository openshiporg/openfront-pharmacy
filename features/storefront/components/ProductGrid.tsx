'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'

import type { PublicPharmacyCatalogPageProjection } from '@/features/pharmacy/contracts'
import { getCatalogPage } from '../lib/data/catalog'
import { categoryLabel } from '../lib/categories'
import { ProductCard } from './ProductCard'
import { PillLink, Track, outlineButtonClass } from './rx-ui'

export function ProductGrid({ locationId, orderingEnabled, initialPage, initialSearch = '', title = 'Shop', categories = [], activeCategory = null }: { locationId: string; orderingEnabled: boolean; initialPage: PublicPharmacyCatalogPageProjection; initialSearch?: string; title?: string; eyebrow?: string; categories?: Array<{ value: string; count: number }>; activeCategory?: string | null }) {
  const [products, setProducts] = useState(initialPage.items)
  const [hasMore, setHasMore] = useState(initialPage.hasMore)
  const [nextCursor, setNextCursor] = useState(initialPage.nextCursor)
  const [search, setSearch] = useState(initialSearch)
  const [appliedSearch, setAppliedSearch] = useState(initialSearch)
  const [totalCount, setTotalCount] = useState(initialPage.totalCount)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

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

  return <section id="products" aria-labelledby="products-title" className="scroll-mt-4 px-4 py-6 sm:px-8 lg:py-8 xl:px-16">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <h1 id="products-title" className="rx-display flex items-baseline gap-3 text-[2rem] sm:text-[2.5rem]">{title}<span className="rx-num font-sans text-[15px] text-muted-foreground">{totalCount} {totalCount === 1 ? 'product' : 'products'}</span></h1>
      <form role="search" onSubmit={(event) => { event.preventDefault(); load(search.trim(), null) }} className="relative w-full sm:max-w-md">
        <label className="block">
          <span className="sr-only">Search products</span>
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} maxLength={100} placeholder="Search for products by name, brand, or keyword…" className="h-11 w-full rounded-[4px] border border-input bg-card pl-4 pr-11 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15" />
        </label>
        <button type="submit" disabled={pending} aria-label="Search" className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center text-foreground/70 hover:text-primary disabled:opacity-50"><Search aria-hidden="true" className="size-[18px]" strokeWidth={1.8} /></button>
      </form>
    </div>

    {categories.length > 1 && <Track label="Category" className="mt-5 flex">
      <PillLink href="/products#products" active={!activeCategory} scroll={false}>All</PillLink>
      {categories.map((entry) => <PillLink key={entry.value} href={`/products?category=${entry.value}#products`} active={activeCategory === entry.value} scroll={false}>{categoryLabel(entry.value)} <span className="rx-num text-[13px] opacity-70">{entry.count}</span></PillLink>)}
    </Track>}

    {appliedSearch && <p className="mt-4 text-[15px] text-muted-foreground" aria-live="polite"><span className="rx-num">{totalCount}</span> {totalCount === 1 ? 'result' : 'results'} for “{appliedSearch}” · <button type="button" onClick={() => { setSearch(''); load('', null) }} className="font-semibold text-primary hover:underline">Clear</button></p>}
    {error && <p role="alert" className="mt-4 rounded-[4px] bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

    <ul className="rx-settle mt-6 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => <li key={product.id} className="flex min-w-0"><ProductCard product={product} locationId={locationId} orderingEnabled={orderingEnabled} className="w-full" /></li>)}
    </ul>
    {products.length === 0 && <div className="rx-panel mt-6 px-6 py-12 text-center text-[15px] text-muted-foreground">{appliedSearch ? 'No products match this search.' : 'No products are available at this location.'}{appliedSearch && <div className="mt-4"><Link href="/products" className="font-semibold text-primary hover:underline">See all products</Link></div>}</div>}
    {hasMore && <div className="mt-8 flex justify-center"><button type="button" onClick={() => load(appliedSearch, nextCursor)} disabled={pending || !nextCursor} className={outlineButtonClass}>{pending ? 'Loading…' : 'Load more'}</button></div>}
  </section>
}
