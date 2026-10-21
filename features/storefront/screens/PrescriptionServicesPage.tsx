import type { Metadata } from 'next'
import Link from 'next/link'
import { ClipboardCheck, UserRound } from 'lucide-react'

import { getStorefront } from '../lib/data/store'
import { formatAddress } from '../lib/money'
import { StoreUnavailable } from './MainLayout'

export async function generateMetadata(): Promise<Metadata> {
  const storefront = await getStorefront()
  return { title: storefront ? `Prescription services | ${storefront.brand.displayName}` : 'Prescription services' }
}

export async function PrescriptionServicesPage() {
  const storefront = await getStorefront()
  if (!storefront) return <StoreUnavailable />
  const { brand, location } = storefront
  const phone = location?.phone || brand.supportPhone

  return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
    <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Prescription services</h1>

    <section className="mt-8 grid gap-4 md:grid-cols-2">
      <article id="refills" className="rounded-2xl bg-card p-6 sm:p-7">
        <UserRound className="size-6 text-primary" />
        <h2 className="mt-5 text-2xl font-semibold">Prescriptions and refills</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">View your prescriptions and request refills.</p>
        <Link href="/account" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">Your account</Link>
      </article>
      <article id="transfer" className="rounded-2xl bg-card p-6 sm:p-7">
        <ClipboardCheck className="size-6 text-primary" />
        <h2 className="mt-5 text-2xl font-semibold">New prescriptions and transfers</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Call or visit the pharmacy to fill a new prescription or transfer one.</p>
        {phone && <a href={`tel:${phone}`} className="mt-6 inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-semibold">Call {phone}</a>}
      </article>
    </section>

    <section id="location" className="mt-4 rounded-2xl bg-card p-6 sm:p-8">
      {location
        ? <div><h2 className="text-2xl font-semibold">{location.name}</h2>{formatAddress(location.address) && <p className="mt-2 text-muted-foreground">{formatAddress(location.address)}</p>}<p className="mt-2 text-sm text-muted-foreground">{[location.pickupEnabled && 'Pickup', location.deliveryEnabled && 'Delivery'].filter(Boolean).join(' · ')}</p></div>
        : <p className="text-muted-foreground">No pickup locations available.</p>}
      <p className="mt-6 text-sm text-muted-foreground">In an emergency, call 911.</p>
    </section>
  </div>
}

export default PrescriptionServicesPage
