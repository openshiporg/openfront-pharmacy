import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { getCustomerOrder } from '../lib/data/orders'
import { formatMoney, formatStatus } from '../lib/money'

export const metadata: Metadata = { title: 'Order details' }

export async function CustomerOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getCustomerOrder(id)
  if (!order) notFound()

  return <div>
    <Link href="/account" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold"><ArrowLeft className="size-4" /> Account</Link>
    <h1 className="mt-4 flex flex-wrap items-center gap-3 text-3xl font-semibold">Order {order.orderNumber}<span className="rounded-full bg-muted px-3 py-1 text-sm font-normal capitalize">{formatStatus(order.status)}</span></h1>
    <p className="mt-2 text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
    <ul className="my-6 divide-y divide-border rounded-xl bg-card px-5">{order.lineItems.map((line, index) => <li key={index} className="flex justify-between gap-4 py-4"><span>{line.title} × {line.quantity}</span><strong>{formatMoney(line.unitPriceAmount * line.quantity, order.currencyCode)}</strong></li>)}</ul>
    <p className="text-xl font-semibold">Total {formatMoney(order.totalAmount, order.currencyCode)}</p>
  </div>
}

export default CustomerOrderPage
