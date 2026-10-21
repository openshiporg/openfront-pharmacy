import type { Metadata } from 'next'
import { CheckCircle2 } from 'lucide-react'

import { OrderDetails, OrderLookupForm } from '../components/OrderStatusClient'
import { lookupGuestOrder } from '../lib/data/orders'

export const metadata: Metadata = { title: 'Track order' }

export async function OrderStatusPage({ searchParams }: { searchParams: Promise<{ orderId?: string; token?: string; placed?: string }> }) {
  const params = await searchParams
  const result = params.orderId && params.token ? await lookupGuestOrder({ orderId: params.orderId, guestOrderToken: params.token }) : null

  return <div className="mx-auto max-w-3xl px-4 py-10">
    <section className="rounded-3xl bg-card p-6 shadow-sm sm:p-10">
      {result?.ok && params.placed === '1'
        ? <div className="mb-8 flex items-start gap-3"><CheckCircle2 className="mt-1 size-6 shrink-0 text-primary" /><div><h1 className="text-3xl font-semibold tracking-tight">Thank you, your order was placed</h1><p className="mt-2 text-muted-foreground">Bookmark this page to check on your order.</p></div></div>
        : <><h1 className="text-4xl font-semibold tracking-tight">Track your order</h1>{!result?.ok && <p className="mt-3 text-muted-foreground">Enter the details from your order confirmation.</p>}</>}
      {result?.ok
        ? <div className="mt-8"><OrderDetails order={result.order} /></div>
        : <div className="mt-8">{result && <p role="alert" className="mb-5 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{result.message}</p>}<OrderLookupForm /></div>}
    </section>
  </div>
}

export default OrderStatusPage
