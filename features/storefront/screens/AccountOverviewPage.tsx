import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { Band, Notice, TitleLine, buttonClass, type DotTone } from '../components/rx-ui'
import { getCustomerAccount, getPatientPortal } from '../lib/data/account'
import { getStorefront } from '../lib/data/store'
import { formatMoney, formatStatus } from '../lib/money'
import { PatientAccountPrescriptions } from './PatientAccountPrescriptions'

export function orderStatusTone(status: string): DotTone {
  if (['completed', 'ready', 'handed_off'].includes(status)) return 'ok'
  if (['cancelled', 'exception'].includes(status)) return 'danger'
  if (['review_required', 'pending'].includes(status)) return 'warn'
  return 'info'
}

function SectionHead({ title, count }: { title: string; count?: number }) {
  return <h2 className="mb-3 flex items-baseline gap-2.5 text-lg font-semibold tracking-tight">{title}{count !== undefined && <span className="rx-num text-sm font-normal text-muted-foreground">{count}</span>}</h2>
}

export async function AccountOverviewPage() {
  const [account, storefront] = await Promise.all([getCustomerAccount(), getStorefront()])
  if (!account) return <Notice tone="danger">Your account could not be loaded. Try again.</Notice>
  const patient = account.hasPatientProfile ? await getPatientPortal() : null
  const phone = storefront?.location?.phone || storefront?.brand.supportPhone

  return <div className="grid gap-10">
    <section aria-labelledby="account-prescriptions">
      <div id="account-prescriptions"><SectionHead title="Prescriptions" count={patient?.prescriptions.length} /></div>
      {patient
        ? <PatientAccountPrescriptions patientId={patient.id} prescriptions={patient.prescriptions} />
        : <div className="rounded-2xl border border-dashed border-[var(--rx-rule)] p-5">
          <p className="font-medium">No prescriptions linked to this account</p>
          {phone && <a href={`tel:${phone}`} className={`${buttonClass} mt-4`}>Call <span className="rx-num">{phone}</span></a>}
        </div>}
    </section>

    <section aria-labelledby="account-orders">
      <div id="account-orders"><SectionHead title="Orders" count={account.orders.length} /></div>
      {account.orders.length
        ? <Band>{account.orders.map((order) => <Link key={order.id} href={`/account/orders/details/${order.id}`} className="group flex items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-muted/60 sm:px-5">
          <div className="min-w-0">
            <TitleLine as="h3" title={<>Order <span className="rx-num">{order.orderNumber}</span></>} titleClassName="text-[15px]" tone={orderStatusTone(order.status)} state={<span className="capitalize">{formatStatus(order.status)}</span>} />
            <p className="mt-1 text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()} · {order.lineItems.length} {order.lineItems.length === 1 ? 'item' : 'items'}</p>
          </div>
          <span className="flex shrink-0 items-center gap-2"><span className="rx-num text-sm font-medium">{formatMoney(order.totalAmount, order.currencyCode)}</span><ChevronRight aria-hidden="true" className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" /></span>
        </Link>)}</Band>
        : <div className="rounded-2xl border border-dashed border-[var(--rx-rule)] p-5"><p className="font-medium">No orders yet</p><Link href="/products" className={`${buttonClass} mt-4`}>Shop</Link></div>}
    </section>
  </div>
}

export default AccountOverviewPage
