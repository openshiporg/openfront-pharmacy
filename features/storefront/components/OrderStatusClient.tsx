'use client'

import { useState, useTransition, type FormEvent } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { GuestPharmacyOrderProjection } from '@/features/pharmacy/contracts'
import { cn } from '@/lib/utils'
import { lookupGuestOrder } from '../lib/data/orders'
import { formatMoney, formatStatus } from '../lib/money'
import { Field, TitleLine, buttonClass, type DotTone } from './rx-ui'

function orderTone(status: string): DotTone {
  if (['handed_off', 'completed', 'ready', 'ready_for_pickup', 'out_for_delivery'].includes(status)) return 'ok'
  if (['cancelled', 'exception', 'payment_failed'].includes(status)) return 'danger'
  if (['review_required', 'on_hold'].includes(status)) return 'warn'
  return 'info'
}

export function OrderDetails({ order }: { order: GuestPharmacyOrderProjection }) {
  const fulfillmentStatus = order.fulfillment?.status || ''
  const state = fulfillmentStatus || order.status
  const delivery = order.fulfillmentMethod === 'delivery'
  const reached = fulfillmentStatus === 'handed_off' ? 3 : ['ready', 'ready_for_pickup', 'out_for_delivery'].includes(fulfillmentStatus) ? 2 : 1
  const steps = ['Received', delivery ? 'On the way' : 'Ready for pickup', delivery ? 'Delivered' : 'Picked up']
  return <div>
    <p className="rx-eyebrow">{order.locationName}</p>
    <TitleLine as="h2" className="mt-1.5" title={<>Order <span className="rx-num">{order.orderNumber}</span></>} titleClassName="text-2xl" tone={orderTone(state)} state={<span className="capitalize">{formatStatus(state)}</span>} />

    <ol aria-label="Progress" className="mt-6 grid grid-cols-3 gap-1.5">
      {steps.map((label, index) => <li key={label} aria-current={index + 1 === reached ? 'step' : undefined} className="min-w-0">
        <span aria-hidden="true" className={cn('block h-1.5 rounded-full', index < reached ? 'bg-primary' : 'bg-muted shadow-[var(--rx-recess)]')} />
        <span className={cn('mt-2 block truncate text-xs sm:text-sm', index < reached ? 'font-semibold text-foreground' : 'text-muted-foreground')}>{label}</span>
      </li>)}
    </ol>

    <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
      <Field label="Placed">{new Date(order.createdAt).toLocaleDateString()}</Field>
      <Field label="Method"><span className="capitalize">{formatStatus(order.fulfillmentMethod)}</span></Field>
      {order.pickupAt && <Field label="Pickup">{new Date(order.pickupAt).toLocaleString()}</Field>}
      {order.deliveryWindow && <Field label="Delivery window">{order.deliveryWindow}</Field>}
    </dl>

    <ul className="mt-6 divide-y divide-border border-y border-border">{order.lines.map((line) => <li key={line.id} className="flex justify-between gap-4 py-3.5 text-sm"><span className="min-w-0"><span className="rx-num text-muted-foreground">{line.quantity}×</span> {line.title}</span><span className="rx-num">{formatMoney(line.lineTotalAmount, order.currencyCode)}</span></li>)}</ul>
    <dl className="mt-4 grid gap-2 text-sm">
      <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="rx-num">{formatMoney(order.subtotalAmount, order.currencyCode)}</dd></div>
      <div className="flex justify-between"><dt className="text-muted-foreground">Tax</dt><dd className="rx-num">{formatMoney(order.taxAmount, order.currencyCode)}</dd></div>
      {order.deliveryAmount > 0 && <div className="flex justify-between"><dt className="text-muted-foreground">Delivery</dt><dd className="rx-num">{formatMoney(order.deliveryAmount, order.currencyCode)}</dd></div>}
      <div className="flex justify-between border-t border-dashed border-[var(--rx-rule)] pt-3 text-base font-semibold"><dt>Total</dt><dd className="rx-num">{formatMoney(order.totalAmount, order.currencyCode)}</dd></div>
    </dl>
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
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <div className="grid gap-2"><Label htmlFor="lookup-order">Order reference</Label><Input id="lookup-order" value={orderId} onChange={(event) => setOrderId(event.target.value)} autoComplete="off" required className="rx-num h-11 rounded-xl bg-card" /></div>
      <div className="grid gap-2"><Label htmlFor="lookup-token">Tracking code</Label><Input id="lookup-token" value={token} onChange={(event) => setToken(event.target.value)} autoComplete="off" required className="rx-num h-11 rounded-xl bg-card" /></div>
      <button type="submit" disabled={pending} className={buttonClass}>{pending ? 'Checking…' : 'Check status'}</button>
    </form>
    {error && <p role="alert" aria-live="polite" className="mt-5 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
    {order && <div className="mt-8 border-t border-border pt-8"><OrderDetails order={order} /></div>}
  </div>
}
