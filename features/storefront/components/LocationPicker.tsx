'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { PublicPharmacyLocationProjection } from '@/features/pharmacy/contracts'
import { getLocationsPage, selectLocation } from '../lib/data/catalog'
import { formatAddress } from '../lib/money'

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
  const services = [location.pickupEnabled && 'Pickup', location.deliveryEnabled && 'Delivery'].filter(Boolean).join(' · ')

  function load(term: string, after: string | null) {
    setError('')
    startTransition(async () => {
      const page = await getLocationsPage({ search: term || null, after })
      if (!page.success) return setError('Locations could not be loaded. Please try again.')
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

  return <section aria-labelledby="pickup-location" className="border-y border-border bg-muted">
    <div className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:px-8">
      <div className="flex items-start gap-3">
        <MapPin aria-hidden="true" className="mt-1 size-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <label id="pickup-location" htmlFor="store-location" className="font-semibold">Pharmacy location</label>
          <select id="store-location" value={location.id} onChange={(event) => choose(event.target.value)} disabled={pending || Boolean(lockedReason)} className="mt-2 w-full rounded-md border border-input bg-card px-3 py-2 text-sm">
            {options.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
          </select>
          {formatAddress(location.address) && <p className="mt-2 text-sm text-muted-foreground">{formatAddress(location.address)}</p>}
          {services && <p className="mt-1 text-sm text-muted-foreground">{services}</p>}
          {location.phone && <a className="mt-1 inline-block text-sm font-semibold" href={`tel:${location.phone}`}>{location.phone}</a>}
          {lockedReason && <p className="mt-2 text-xs text-muted-foreground">{lockedReason}</p>}
          {appliedSearch && locations.length === 0 && <p className="mt-2 text-sm text-muted-foreground">No locations match this search.</p>}
        </div>
      </div>
      <div>
        <form onSubmit={(event) => { event.preventDefault(); load(search.trim(), null) }} className="flex gap-2">
          <Input aria-label="Search pharmacy locations" value={search} onChange={(event) => setSearch(event.target.value)} maxLength={100} placeholder="Search locations" className="min-w-0 flex-1 bg-card" />
          <Button type="submit" disabled={pending} className="rounded-full">{pending ? 'Searching…' : 'Find'}</Button>
        </form>
        {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
        {hasMore && <Button variant="outline" onClick={() => load(appliedSearch, nextCursor)} disabled={pending || !nextCursor} className="mt-3 rounded-full">{pending ? 'Loading…' : 'More locations'}</Button>}
      </div>
    </div>
  </section>
}
