import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { OrderDetails } from '../components/OrderStatusClient'
import { getCustomerOrderDetails } from '../lib/data/orders'

export const metadata: Metadata = { title: 'Order details' }

export async function CustomerOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getCustomerOrderDetails(id)
  if (!order) notFound()

  return <div>
    <Link href="/account" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft aria-hidden="true" className="size-4" />Overview</Link>
    <section className="mt-3 rx-panel p-5 sm:p-7">
      <OrderDetails order={order} />
    </section>
  </div>
}

export default CustomerOrderPage
