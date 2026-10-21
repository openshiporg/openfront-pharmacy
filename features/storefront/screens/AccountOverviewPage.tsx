import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { getCustomerAccount, getPatientPortal } from '../lib/data/account'
import { getStorefront } from '../lib/data/store'
import { formatMoney, formatStatus } from '../lib/money'
import { PatientAccountPrescriptions } from './PatientAccountPrescriptions'

export async function AccountOverviewPage() {
  const [account, storefront] = await Promise.all([getCustomerAccount(), getStorefront()])
  if (!account) return <p role="alert" className="rounded-xl bg-card p-5">Your account could not be loaded. Please try again.</p>
  const patient = account.hasPatientProfile ? await getPatientPortal() : null
  const phone = storefront?.location?.phone || storefront?.brand.supportPhone

  return <div>
    <h1 className="text-3xl font-semibold tracking-tight">Hello, {account.name.split(' ')[0]}</h1>

    <section className="mt-8">
      <h2 className="text-2xl font-semibold">Orders</h2>
      <div className="mt-4 grid gap-3">
        {account.orders.length
          ? account.orders.map((order) => <Link key={order.id} href={`/account/orders/details/${order.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card p-5">
            <div><h3 className="font-semibold">Order {order.orderNumber}</h3><p className="text-sm capitalize text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()} · {formatStatus(order.status)}</p></div>
            <span className="flex items-center gap-2 font-semibold">{formatMoney(order.totalAmount, order.currencyCode)}<ChevronRight className="size-4 text-muted-foreground" /></span>
          </Link>)
          : <p className="rounded-xl bg-card p-5 text-muted-foreground">No orders yet. <Link href="/products" className="font-semibold text-primary">Shop products</Link></p>}
      </div>
    </section>

    <section className="mt-10">
      <h2 className="text-2xl font-semibold">Prescriptions</h2>
      {patient
        ? <PatientAccountPrescriptions patientId={patient.id} prescriptions={patient.prescriptions} />
        : <div className="mt-4 rounded-xl bg-card p-5 text-sm text-muted-foreground">
          <p>Your prescriptions appear here once the pharmacy links them to your account. Call or visit the pharmacy to set this up or to transfer a prescription.</p>
          {phone && <a href={`tel:${phone}`} className="mt-3 inline-flex min-h-11 items-center font-semibold text-primary">Call {phone}</a>}
        </div>}
    </section>
  </div>
}

export default AccountOverviewPage
