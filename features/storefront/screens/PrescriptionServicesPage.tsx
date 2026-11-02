import type { Metadata } from 'next'
import Link from 'next/link'

import { LocationHours, OpenNow } from '../components/LocationHours'
import { PrescriptionRequestForm } from '../components/PrescriptionRequestForm'
import { Field, PageHead, SecondaryAction, TitleLine, buttonClass } from '../components/rx-ui'
import { getCustomerAccount, getPatientPortal } from '../lib/data/account'
import { getStorefront } from '../lib/data/store'
import { getCustomer } from '../lib/data/user'
import { formatAddress } from '../lib/money'
import { StoreUnavailable } from './MainLayout'

export const metadata: Metadata = { title: 'Prescriptions' }

export async function PrescriptionServicesPage() {
  const [storefront, customer] = await Promise.all([getStorefront(), getCustomer()])
  if (!storefront) return <StoreUnavailable />
  const { brand, location } = storefront
  const [account, portal] = customer ? await Promise.all([getCustomerAccount(), getPatientPortal()]) : [null, null]
  const refillable = (portal?.prescriptions || []).filter((rx) => rx.refillEligible)
  const phone = location?.phone || brand.supportPhone
  const address = formatAddress(location?.address)

  return <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
    <PageHead eyebrow={brand.displayName} title="Prescriptions" />

    <div className="mt-8 grid gap-[14px] md:grid-cols-2">
      <section id="refills" aria-labelledby="refills-title" className="flex flex-col rx-panel p-6">
        <h2 id="refills-title" className="text-xl font-semibold tracking-tight">Refills</h2>
        {!customer
          ? <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">Sign in to see your prescriptions and ask for a refill.</p>
          : refillable.length
            ? <ul className="mt-3 divide-y divide-[var(--rx-rule)]">{refillable.map((rx) => <li key={rx.id} className="flex items-baseline justify-between gap-3 py-2.5 text-[14px]"><span className="min-w-0 break-words font-medium">{rx.medicationName}</span><span className="shrink-0 text-muted-foreground">{rx.refillsRemaining} {rx.refillsRemaining === 1 ? 'refill' : 'refills'} left</span></li>)}</ul>
            : <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{portal?.prescriptions?.length ? 'None of your prescriptions can be refilled online right now. Call us and we can help.' : 'No prescriptions on file yet. Transfer one or send a new prescription.'}</p>}
        <div className="mt-auto pt-6"><Link href={customer ? '/account' : '/account?from=/prescriptions'} className={buttonClass}>{customer ? 'Request a refill' : 'Sign in to request a refill'}</Link></div>
      </section>
      <section id="transfer" aria-labelledby="transfer-title" className="rx-panel p-6">
        <h2 id="transfer-title" className="text-xl font-semibold tracking-tight">Transfer or new prescription</h2>
        <div className="mt-5">
          {!location
            ? <p className="text-sm text-muted-foreground">No pharmacy locations are open online.</p>
            : customer
              ? <PrescriptionRequestForm kinds={['transfer', 'new_prescription']} locationId={location.id} needsIdentity={!account?.hasPatientProfile} />
              : <div className="flex flex-wrap items-center gap-3">
                <Link href="/account?from=/prescriptions%23transfer" className={buttonClass}>Sign in to send a request</Link>
                {phone && <SecondaryAction href={`tel:${phone}`} className="min-h-12">Call <span className="rx-num">{phone}</span></SecondaryAction>}
              </div>}
        </div>
      </section>
    </div>

    <section id="location" aria-label="Pharmacy location" className="mt-8 rx-panel p-6">
      {location
        ? <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div>
            <TitleLine title={location.name} titleClassName="text-xl" tone={location.onlineOrderingEnabled ? 'ok' : 'warn'} state={location.onlineOrderingEnabled ? 'Ordering online' : 'Call to order'} />
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4">
              {address && <Field label="Address" className="col-span-2">{address}</Field>}
              {phone && <Field label="Phone"><a href={`tel:${phone}`} className="rx-num hover:text-primary max-md:-my-3.5">{phone}</a></Field>}
              <Field label="Service">{[location.pickupEnabled && 'Pickup', location.deliveryEnabled && 'Delivery'].filter(Boolean).join(' · ') || 'In store'}</Field>
              {location.hours && <Field label="Pharmacy counter" className="col-span-2"><OpenNow week={location.hours.pharmacy} timezone={location.timezone} /></Field>}
              {brand.supportEmail && <Field label="Email" className="col-span-2"><a href={`mailto:${brand.supportEmail}`} className="break-all hover:text-primary max-md:-my-3.5">{brand.supportEmail}</a></Field>}
            </dl>
          </div>
          {location.hours ? <LocationHours hours={location.hours} timezone={location.timezone} /> : <dl><Field label="Hours">Call the pharmacy</Field></dl>}
        </div>
        : <p className="font-medium">No pharmacy locations are open online</p>}
    </section>
  </div>
}

export default PrescriptionServicesPage
