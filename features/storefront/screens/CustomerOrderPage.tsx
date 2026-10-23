import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { Field, TitleLine } from '../components/rx-ui'
import { getCustomerOrder } from '../lib/data/orders'
import { formatMoney, formatStatus } from '../lib/money'
import { orderStatusTone } from './AccountOverviewPage'

export const metadata: Metadata = { title: 'Order details' }

export async function CustomerOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getCustomerOrder(id)
  if (!order) notFound()
  const count = order.lineItems.reduce((sum, line) => sum + line.quantity, 0)

  return <div>
    <Link href="/account" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft aria-hidden="true" className="size-4" />Overview</Link>
    <section className="mt-3 rounded-2xl border border-border bg-card p-5 sm:p-7">
      <TitleLine as="h2" title={<>Order <span className="rx-num">{order.orderNumber}</span></>} titleClassName="text-2xl" tone={orderStatusTone(order.status)} state={<span className="capitalize">{formatStatus(order.status)}</span>} />
      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
        <Field label="Placed">{new Date(order.createdAt).toLocaleDateString()}</Field>
        <Field label="Items"><span className="rx-num">{count}</span></Field>
      </dl>
      <ul className="mt-6 divide-y divide-border border-y border-border">{order.lineItems.map((line, index) => <li key={index} className="flex justify-between gap-4 py-3.5 text-sm"><span className="min-w-0"><span className="rx-num text-muted-foreground">{line.quantity}×</span> {line.title}</span><span className="rx-num">{formatMoney(line.unitPriceAmount * line.quantity, order.currencyCode)}</span></li>)}</ul>
      <div className="mt-4 flex justify-between text-base font-semibold"><span>Total</span><span className="rx-num">{formatMoney(order.totalAmount, order.currencyCode)}</span></div>
    </section>
  </div>
}

export default CustomerOrderPage
