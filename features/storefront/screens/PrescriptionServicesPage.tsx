import type { Metadata } from 'next'
import Link from 'next/link'

import { Field, PageHead, SecondaryAction, TitleLine, buttonClass } from '../components/rx-ui'
import { getStorefront } from '../lib/data/store'
import { formatAddress } from '../lib/money'
import { StoreUnavailable } from './MainLayout'

export async function generateMetadata(): Promise<Metadata> {
  const storefront = await getStorefront()
  return { title: storefront ? `Prescriptions | ${storefront.brand.displayName}` : 'Prescriptions' }
}

export async function PrescriptionServicesPage() {
  const storefront = await getStorefront()
  if (!storefront) return <StoreUnavailable />
  const { brand, location } = storefront
  const phone = location?.phone || brand.supportPhone
  const address = formatAddress(location?.address)

  return <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
    <PageHead eyebrow={brand.displayName} title="Prescriptions" />

    <div className="mt-8 grid gap-4 md:grid-cols-2">
      <section id="refills" aria-labelledby="refills-title" className="flex flex-col rounded-2xl border border-border bg-card p-6">
        <p className="rx-eyebrow">01</p>
        <h2 id="refills-title" className="mt-2 text-xl font-semibold tracking-tight">Refills</h2>
        <div className="mt-auto pt-6"><Link href="/account" className={buttonClass}>Request a refill</Link></div>
      </section>
      <section id="transfer" aria-labelledby="transfer-title" className="flex flex-col rounded-2xl border border-border bg-card p-6">
        <p className="rx-eyebrow">02</p>
        <h2 id="transfer-title" className="mt-2 text-xl font-semibold tracking-tight">New and transferred prescriptions</h2>
        <dl className="mt-5 grid gap-3">
          <Field label="How">By phone or in person</Field>
          {phone && <Field label="Phone"><span className="rx-num">{phone}</span></Field>}
        </dl>
        {phone && <div className="mt-auto pt-6"><SecondaryAction href={`tel:${phone}`}>Call the pharmacy</SecondaryAction></div>}
      </section>
    </div>

    <section id="location" aria-label="Pharmacy location" className="mt-4 rounded-2xl bg-muted p-6 shadow-[var(--rx-recess)]">
      {location
        ? <>
          <TitleLine title={location.name} titleClassName="text-xl" tone={location.onlineOrderingEnabled ? 'ok' : 'warn'} state={location.onlineOrderingEnabled ? 'Ordering online' : 'Call to order'} />
          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            {address && <Field label="Address" className="col-span-2 sm:col-span-1">{address}</Field>}
            <Field label="Service">{[location.pickupEnabled && 'Pickup', location.deliveryEnabled && 'Delivery'].filter(Boolean).join(' · ') || 'In store'}</Field>
            {brand.supportEmail && <Field label="Email"><a href={`mailto:${brand.supportEmail}`} className="break-all hover:text-primary">{brand.supportEmail}</a></Field>}
          </dl>
        </>
        : <p className="font-medium">No pharmacy locations are open online</p>}
    </section>
  </div>
}

export default PrescriptionServicesPage
