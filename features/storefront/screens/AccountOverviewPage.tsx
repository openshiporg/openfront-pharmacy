import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { Band, Notice, TitleLine, buttonClass } from '../components/rx-ui'
import { formatStoreDate } from '../lib/dates'
import { orderStatusLabel, orderTone } from '../lib/order-status'
import { getCustomerAccount, getPatientPortal } from '../lib/data/account'
import { getStorefront } from '../lib/data/store'
import { formatMoney, formatStatus } from '../lib/money'
import { PatientAccountPrescriptions } from './PatientAccountPrescriptions'
import { PrescriptionRequestForm } from '../components/PrescriptionRequestForm'
import { getMyPrescriptionRequests, type RequestKind } from '../lib/data/requests'

const REQUEST_LABELS: Record<RequestKind, string> = { registration: 'Patient registration', transfer: 'Prescription transfer', new_prescription: 'New prescription' }

function SectionHead({ title, count }: { title: string; count?: number }) {
  return <h2 className="mb-3 flex items-baseline gap-2.5 text-lg font-semibold tracking-tight">{title}{count !== undefined && <span className="rx-num text-sm font-normal text-muted-foreground">{count}</span>}</h2>
}

export async function AccountOverviewPage() {
  const [account, storefront] = await Promise.all([getCustomerAccount(), getStorefront()])
  if (!account) return <Notice tone="danger">Your account could not be loaded. Try again.</Notice>
  const [patient, requests] = await Promise.all([account.hasPatientProfile ? getPatientPortal() : null, getMyPrescriptionRequests()])
  const pendingRegistration = requests.some((request) => request.kind === 'registration' && ['requested', 'in_review'].includes(request.status))
  const phone = storefront?.location?.phone || storefront?.brand.supportPhone
  const timezone = storefront?.location?.timezone

  return <div className="grid gap-10">
    <section aria-labelledby="account-prescriptions">
      <div id="account-prescriptions"><SectionHead title="Prescriptions" count={patient?.prescriptions.length} /></div>
      {patient
        ? <PatientAccountPrescriptions patientId={patient.id} prescriptions={patient.prescriptions} />
        : <div className="rx-card p-5 sm:p-6">
          <TitleLine as="h3" title="Register as a patient" titleClassName="text-lg" tone={pendingRegistration ? 'info' : 'muted'} state={pendingRegistration ? 'Request sent' : 'Not linked'} />
          {storefront?.location && !pendingRegistration && <div className="mt-5"><PrescriptionRequestForm kinds={['registration', 'transfer', 'new_prescription']} locationId={storefront.location.id} needsIdentity /></div>}
          {phone && <p className="mt-4 text-sm text-muted-foreground">Pharmacy <a href={`tel:${phone}`} className="rx-num font-medium text-foreground">{phone}</a></p>}
        </div>}
    </section>

    {requests.length > 0 && <section aria-labelledby="account-requests">
      <div id="account-requests"><SectionHead title="Requests" count={requests.length} /></div>
      <Band>{requests.map((request) => <div key={request.id} className="px-4 py-4 sm:px-5">
        <TitleLine as="h3" title={REQUEST_LABELS[request.kind]} titleClassName="text-[15px]" tone={request.status === 'completed' ? 'ok' : request.status === 'declined' ? 'danger' : 'info'} state={<span className="capitalize">{formatStatus(request.status)}</span>} />
        <p className="mt-1 text-sm text-muted-foreground">{formatStoreDate(request.createdAt, timezone)} · {request.locationName}{request.counterpartyName ? ` · from ${request.counterpartyName}` : ''}</p>
        {request.resolutionNote && <p className="mt-2 text-sm">{request.resolutionNote}</p>}
      </div>)}</Band>
    </section>}

    <section aria-labelledby="account-orders">
      <div id="account-orders"><SectionHead title="Orders" count={account.orders.length} /></div>
      {account.orders.length
        ? <Band>{account.orders.map((order) => <Link key={order.id} href={`/account/orders/details/${order.id}`} className="group flex items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-muted/60 sm:px-5">
          <div className="min-w-0">
            <TitleLine as="h3" title={<>Order <span className="rx-num">{order.orderNumber}</span></>} titleClassName="text-[15px]" tone={orderTone(order.status)} state={orderStatusLabel(order.status)} />
            <p className="mt-1 text-sm text-muted-foreground">{formatStoreDate(order.createdAt, timezone)} · {order.lineItems.length} {order.lineItems.length === 1 ? 'item' : 'items'}</p>
          </div>
          <span className="flex shrink-0 items-center gap-2"><span className="rx-num text-sm font-medium">{formatMoney(order.totalAmount, order.currencyCode)}</span><ChevronRight aria-hidden="true" className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" /></span>
        </Link>)}</Band>
        : <div className="rx-card p-5"><p className="font-medium">No orders yet</p><Link href="/products" className={`${buttonClass} mt-4`}>Shop</Link></div>}
    </section>
  </div>
}

export default AccountOverviewPage
