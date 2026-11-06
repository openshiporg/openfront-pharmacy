import type { Metadata } from 'next'
import Link from 'next/link'

import { LocationHours, OpenNow } from '../components/LocationHours'
import { PrescriptionRequestForm } from '../components/PrescriptionRequestForm'
import { Field, PageHead, SecondaryAction, TitleLine, buttonClass, pillClass } from '../components/rx-ui'
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

  const prescriptions = portal?.prescriptions || []
  const ready = prescriptions.filter((rx) => rx.status === 'ready_for_pickup')
  const inProgress = prescriptions.filter((rx) => ['refill_requested', 'pending_review', 'approved', 'ready_to_dispense', 'partially_dispensed', 'transfer_requested'].includes(rx.status))
  const counter = location?.hours?.pharmacy

  return <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
    <PageHead eyebrow={brand.displayName} title="Prescriptions" meta={location && counter ? <OpenNow week={counter} timezone={location.timezone} label="Pharmacy" /> : undefined} />

    <nav aria-label="Prescription services" className="mt-6 flex flex-wrap gap-2">
      <a href="#refills" className={pillClass}>Refill</a>
      <a href="#transfer" className={pillClass}>Transfer</a>
      <a href="#status" className={pillClass}>Status</a>
      <a href="#location" className={pillClass}>Hours &amp; location</a>
    </nav>

    <div className="mt-6 grid gap-[14px] md:grid-cols-2">
      <section id="refills" aria-labelledby="refills-title" className="flex flex-col rx-panel p-6">
        <h2 id="refills-title" className="text-xl font-semibold tracking-tight">Refill a prescription</h2>
        {!customer
          ? <>
            <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">Have your label handy: the Rx number is printed on it. Sign in to refill by Rx number or from your prescription list.</p>
            <div className="mt-auto pt-6"><Link href="/account?from=/prescriptions%23refills" className={buttonClass}>Sign in to refill</Link></div>
          </>
          : <>
            {refillable.length > 0 && <>
              <p className="mt-2 text-[14px] text-muted-foreground">Ready to refill from your list:</p>
              <ul className="mt-2 divide-y divide-[var(--rx-rule)]">{refillable.map((rx) => <li key={rx.id} className="flex items-baseline justify-between gap-3 py-2.5 text-[14px]"><span className="min-w-0 break-words font-medium">{rx.medicationName} <span className="rx-num text-muted-foreground">Rx {rx.prescriptionNumber}</span></span><span className="shrink-0 text-muted-foreground">{rx.refillsRemaining} {rx.refillsRemaining === 1 ? 'refill' : 'refills'} left</span></li>)}</ul>
              <div className="pt-4"><Link href="/account#account-prescriptions" className={buttonClass}>Refill from my list</Link></div>
              <p className="mt-6 text-[14px] font-medium">Or refill by Rx number</p>
            </>}
            {location
              ? <div className="mt-3"><PrescriptionRequestForm kinds={['refill']} locationId={location.id} needsIdentity={!account?.hasPatientProfile} /></div>
              : <p className="mt-2 text-sm text-muted-foreground">No pharmacy locations are open online.</p>}
          </>}
      </section>
      <section id="transfer" aria-labelledby="transfer-title" className="rx-panel p-6">
        <h2 id="transfer-title" className="text-xl font-semibold tracking-tight">Transfer or new prescription</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">Tell us the pharmacy your prescription is at and we call them for it. For a new prescription, we contact your prescriber.</p>
        <div className="mt-5">
          {!location
            ? <p className="text-sm text-muted-foreground">No pharmacy locations are open online.</p>
            : customer
              ? <PrescriptionRequestForm kinds={['transfer', 'new_prescription']} locationId={location.id} needsIdentity={!account?.hasPatientProfile} />
              : <div className="flex flex-wrap items-center gap-3">
                <Link href="/account?from=/prescriptions%23transfer" className={buttonClass}>Sign in to transfer</Link>
                {phone && <SecondaryAction href={`tel:${phone}`} className="min-h-12">Call <span className="rx-num">{phone}</span></SecondaryAction>}
              </div>}
        </div>
      </section>
    </div>

    <section id="status" aria-labelledby="status-title" className="mt-[14px] rx-panel p-6">
      <h2 id="status-title" className="text-xl font-semibold tracking-tight">Prescription status</h2>
      {!customer
        ? <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">Sign in to see which prescriptions are ready for pickup and which are being filled. We email you when one is ready.</p>
        : !prescriptions.length
          ? <p className="mt-2 text-[14px] text-muted-foreground">No prescriptions on file yet. Requests you send show in your account with their status.</p>
          : <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <Field label="Ready for pickup"><span className="rx-num text-lg">{ready.length}</span>{ready.length > 0 && <span className="block text-sm text-muted-foreground">{ready.map((rx) => `Rx ${rx.prescriptionNumber}`).join(', ')}</span>}</Field>
            <Field label="Being filled"><span className="rx-num text-lg">{inProgress.length}</span></Field>
            <Field label="On file"><span className="rx-num text-lg">{prescriptions.length}</span></Field>
          </dl>}
      {customer && <div className="mt-5"><SecondaryAction href="/account#account-prescriptions">All prescriptions</SecondaryAction></div>}
    </section>

    <section id="location" aria-label="Pharmacy hours and location" className="mt-[14px] rx-panel p-6">
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
          {location.hours ? <LocationHours hours={location.hours} timezone={location.timezone} /> : <dl><Field label="Hours">{phone ? <>Call <a href={`tel:${phone}`} className="rx-num hover:text-primary">{phone}</a> for today's hours</> : 'Hours not listed yet'}</Field></dl>}
        </div>
        : <p className="font-medium">No pharmacy locations are open online</p>}
    </section>
  </div>
}

export default PrescriptionServicesPage
