import type { Metadata } from 'next'
import Link from 'next/link'

import { LocationHours, OpenNow } from '../components/LocationHours'
import { PrescriptionRequestForm } from '../components/PrescriptionRequestForm'
import { Field, PageHead, SecondaryAction, TitleLine, buttonClass } from '../components/rx-ui'
import { getCustomerAccount } from '../lib/data/account'
import { getStorefront } from '../lib/data/store'
import { getCustomer } from '../lib/data/user'
import { formatAddress } from '../lib/money'
import { StoreUnavailable } from './MainLayout'

export const metadata: Metadata = { title: 'Prescriptions' }

export async function PrescriptionServicesPage() {
  const [storefront, customer] = await Promise.all([getStorefront(), getCustomer()])
  if (!storefront) return <StoreUnavailable />
  const { brand, location } = storefront
  const account = customer ? await getCustomerAccount() : null
  const phone = location?.phone || brand.supportPhone
  const address = formatAddress(location?.address)

  return <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
    <PageHead eyebrow={brand.displayName} title="Prescriptions" />

    <div className="mt-8 grid gap-4 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <section id="refills" aria-labelledby="refills-title" className="flex flex-col rounded-[22px] bg-card p-6">
        <h2 id="refills-title" className="text-xl font-semibold tracking-tight">Refills</h2>
        <div className="mt-auto pt-6"><Link href="/account" className={buttonClass}>Request a refill</Link></div>
      </section>
      <section id="transfer" aria-labelledby="transfer-title" className="rounded-[22px] bg-card p-6">
        <h2 id="transfer-title" className="text-xl font-semibold tracking-tight">Transfer or new prescription</h2>
        <div className="mt-5">
          {!location
            ? <p className="text-sm text-muted-foreground">No pharmacy locations are open online.</p>
            : customer
              ? <PrescriptionRequestForm kinds={['transfer', 'new_prescription']} locationId={location.id} needsIdentity={!account?.hasPatientProfile} />
              : <div className="flex flex-wrap items-center gap-3">
                <Link href="/account?from=/prescriptions%23transfer" className={buttonClass}>Sign in to send a request</Link>
                {phone && <SecondaryAction href={`tel:${phone}`}>Call <span className="rx-num">{phone}</span></SecondaryAction>}
              </div>}
        </div>
      </section>
    </div>

    <section id="location" aria-label="Pharmacy location" className="mt-4 rounded-[22px] bg-muted p-6">
      {location
        ? <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div>
            <TitleLine title={location.name} titleClassName="text-xl" tone={location.onlineOrderingEnabled ? 'ok' : 'warn'} state={location.onlineOrderingEnabled ? 'Ordering online' : 'Call to order'} />
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4">
              {address && <Field label="Address" className="col-span-2">{address}</Field>}
              {phone && <Field label="Phone"><a href={`tel:${phone}`} className="rx-num hover:text-primary">{phone}</a></Field>}
              <Field label="Service">{[location.pickupEnabled && 'Pickup', location.deliveryEnabled && 'Delivery'].filter(Boolean).join(' · ') || 'In store'}</Field>
              {location.hours && <Field label="Pharmacy counter" className="col-span-2"><OpenNow week={location.hours.pharmacy} timezone={location.timezone} /></Field>}
              {brand.supportEmail && <Field label="Email" className="col-span-2"><a href={`mailto:${brand.supportEmail}`} className="break-all hover:text-primary">{brand.supportEmail}</a></Field>}
            </dl>
          </div>
          {location.hours ? <LocationHours hours={location.hours} timezone={location.timezone} /> : <Field label="Hours">Call the pharmacy</Field>}
        </div>
        : <p className="font-medium">No pharmacy locations are open online</p>}
    </section>
  </div>
}

export default PrescriptionServicesPage
