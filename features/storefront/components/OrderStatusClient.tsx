'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { CheckCircle2, Clock3, PackageCheck, Truck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { GuestPharmacyOrderProjection } from '@/features/pharmacy/contracts'
import { lookupGuestOrder } from '../lib/data/orders'
import { formatMoney, formatStatus } from '../lib/money'

export function OrderDetails({ order }: { order: GuestPharmacyOrderProjection }) {
  const fulfillmentStatus = order.fulfillment?.status || ''
  const steps = [
    { label: 'Received', active: true, icon: Clock3 },
    { label: order.fulfillmentMethod === 'delivery' ? 'On the way' : 'Ready', active: ['ready', 'out_for_delivery', 'handed_off'].includes(fulfillmentStatus), icon: order.fulfillmentMethod === 'delivery' ? Truck : PackageCheck },
    { label: 'Completed', active: fulfillmentStatus === 'handed_off', icon: CheckCircle2 },
  ]
  return <div>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div><p className="text-sm text-muted-foreground">{order.locationName}</p><h2 className="mt-1 text-2xl font-semibold">Order {order.orderNumber}</h2></div>
      <span className="w-fit rounded-full bg-muted px-4 py-2 text-sm font-semibold capitalize">{formatStatus(fulfillmentStatus || order.status)}</span>
    </div>
    <div className="mt-8 grid grid-cols-3 gap-2 text-center text-xs sm:text-sm">
      {steps.map(({ label, active, icon: Icon }) => <div key={label} className={`rounded-xl p-4 ${active ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}><Icon className="mx-auto mb-2 size-5" />{label}</div>)}
    </div>
    <ul className="mt-8 divide-y divide-border border-y border-border">{order.lines.map((line) => <li key={line.id} className="flex justify-between gap-4 py-4 text-sm"><span>{line.quantity} × {line.title}</span><strong>{formatMoney(line.lineTotalAmount, order.currencyCode)}</strong></li>)}</ul>
    <div className="mt-5 flex justify-between text-lg font-semibold"><span>Total</span><span>{formatMoney(order.totalAmount, order.currencyCode)}</span></div>
  </div>
}

export function OrderLookupForm() {
  const [orderId, setOrderId] = useState('')
  const [token, setToken] = useState('')
  const [order, setOrder] = useState<GuestPharmacyOrderProjection | null>(null)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await lookupGuestOrder({ orderId, guestOrderToken: token })
      setOrder(result.ok ? result.order : null)
      if (!result.ok) setError(result.message)
    })
  }

  return <div>
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
      <Input aria-label="Order reference" value={orderId} onChange={(event) => setOrderId(event.target.value)} placeholder="Order reference" required />
      <Input aria-label="Tracking code" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Tracking code" required />
      <Button disabled={pending}>{pending ? 'Checking…' : 'Check status'}</Button>
    </form>
    {error && <p role="alert" aria-live="polite" className="mt-5 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    {order && <div className="mt-10 border-t border-border pt-8"><OrderDetails order={order} /></div>}
  </div>
}
