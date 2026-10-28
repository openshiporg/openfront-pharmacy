'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import type { PublicPharmacyLocationProjection } from '@/features/pharmacy/contracts'
import { getLocationsPage, selectLocation } from '../lib/data/catalog'
import { formatAddress } from '../lib/money'
import { pillClass, trackClass } from './rx-ui'

export function LocationPicker({ location, locations: initialLocations, hasMore: initialHasMore, nextCursor: initialNextCursor, lockedReason }: { location: PublicPharmacyLocationProjection; locations: PublicPharmacyLocationProjection[]; hasMore: boolean; nextCursor: string | null; lockedReason?: string | null }) {
  const router = useRouter()
  const [locations, setLocations] = useState(initialLocations)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [nextCursor, setNextCursor] = useState(initialNextCursor)
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const options = locations.some((entry) => entry.id === location.id) ? locations : [location, ...locations]
  const canSearch = hasMore || Boolean(appliedSearch) || locations.length > 8

  function load(term: string, after: string | null) {
    setError('')
    startTransition(async () => {
      const page = await getLocationsPage({ search: term || null, after })
      if (!page.success) return setError('Locations could not be loaded. Try again.')
      setLocations((current) => after ? [...current, ...page.data.locations.filter((item) => !current.some((existing) => existing.id === item.id))] : page.data.locations)
      setHasMore(page.data.hasMoreLocations)
      setNextCursor(page.data.nextLocationCursor)
      setAppliedSearch(term)
    })
  }

  function choose(locationId: string) {
    if (locationId === location.id) return
    startTransition(async () => {
      await selectLocation(locationId)
      router.refresh()
    })
  }

  if (options.length < 2 && !canSearch) return null

  return <section aria-labelledby="pickup-location" className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-10 lg:px-8">
    <div className="grid gap-4 rx-panel p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-end">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-6 grid size-9 shrink-0 place-items-center rounded-[4px] bg-accent text-accent-foreground"><MapPin aria-hidden="true" className="size-4" /></span>
        <div className="min-w-0 flex-1">
          <label id="pickup-location" htmlFor="store-location" className="rx-eyebrow">Your pharmacy</label>
          <select id="store-location" value={location.id} onChange={(event) => choose(event.target.value)} disabled={pending || Boolean(lockedReason)} className="mt-1.5 h-11 w-full rounded-[4px] border border-input bg-background px-3 text-[15px] font-medium disabled:opacity-70">
            {options.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
          </select>
          {formatAddress(location.address) && <p className="mt-2 text-sm text-muted-foreground">{formatAddress(location.address)}</p>}
          {lockedReason && <p className="mt-1 text-[13px] text-muted-foreground">{lockedReason}</p>}
          {appliedSearch && locations.length === 0 && <p className="mt-1 text-sm text-muted-foreground">No locations match this search.</p>}
        </div>
      </div>
      {canSearch && <div className="grid gap-2">
        <form role="search" onSubmit={(event) => { event.preventDefault(); load(search.trim(), null) }} className={`${trackClass} w-full gap-1`}>
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search pharmacy locations</span>
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="search" value={search} onChange={(event) => setSearch(event.target.value)} maxLength={100} placeholder="City, ZIP or name" className="h-9 rounded-[4px] border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0 max-sm:h-10" />
          </label>
          <button type="submit" disabled={pending} data-active="true" className={`${pillClass} px-4 font-semibold`}>{pending ? 'Finding…' : 'Find'}</button>
        </form>
        {hasMore && <button type="button" onClick={() => load(appliedSearch, nextCursor)} disabled={pending || !nextCursor} className="justify-self-start text-sm font-semibold text-primary disabled:opacity-60">{pending ? 'Loading…' : 'More locations'}</button>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </div>}
    </div>
  </section>
}
