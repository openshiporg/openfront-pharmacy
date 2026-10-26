import type { Metadata } from 'next'
import { CheckCircle2 } from 'lucide-react'

import { OrderDetails, OrderLookupForm } from '../components/OrderStatusClient'
import { PageHead } from '../components/rx-ui'
import { getCustomerOrderDetails, lookupGuestOrder } from '../lib/data/orders'

export const metadata: Metadata = { title: 'Track order' }

export async function OrderStatusPage({ searchParams }: { searchParams: Promise<{ orderId?: string; token?: string; placed?: string }> }) {
  const params = await searchParams
  // Guests carry the order token; a signed-in customer's own order is read through their session.
  const customerOrder = params.orderId && !params.token ? await getCustomerOrderDetails(params.orderId) : null
  const result = customerOrder
    ? { ok: true as const, order: customerOrder }
    : params.orderId && params.token ? await lookupGuestOrder({ orderId: params.orderId, guestOrderToken: params.token }) : null
  const placed = result?.ok && params.placed === '1'

  return <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
    {placed
      ? <header className="flex items-start gap-3"><CheckCircle2 aria-hidden="true" className="mt-1.5 size-7 shrink-0 text-primary" /><div><h1 className="text-[2rem] font-semibold leading-tight tracking-[-0.02em]">Order placed</h1><p className="mt-1 text-sm text-muted-foreground">Track it any time with order number <span className="rx-num font-medium text-foreground">{result.order.orderNumber}</span> and your email.</p></div></header>
      : <PageHead title="Track order" />}
    <section className="mt-8 rx-panel p-5 sm:p-8">
      {result?.ok
        ? <OrderDetails order={result.order} />
        : <>{result && <p role="alert" className="mb-5 rounded-[4px] bg-destructive/10 px-4 py-3 text-sm text-destructive">{result.message}</p>}<OrderLookupForm /></>}
    </section>
  </div>
}

export default OrderStatusPage
