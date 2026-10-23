'use client'

import { useEffect, useRef, useState, useTransition, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { PharmacyPaymentProviderOption } from '@/features/pharmacy/contracts'
import { CHECKOUT_PRIVACY_STATEMENT } from '../lib/constants'
import { completeCardCheckout, startCheckout, type PlaceOrderInput } from '../lib/data/checkout'
import { Notice, Pill, Track, buttonClass } from './rx-ui'
import { StripeCardStep } from './StripeCardStep'

const inputClass = 'h-11 rounded-xl bg-card'
// Holds the order details while Stripe confirms a card, so a bank redirect can finish the order on return.
const PENDING_CARD_KEY = 'pharmacy-checkout-card'

type CardStep = { paymentSessionId: string; clientSecret: string }

function Step({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return <fieldset className="grid gap-4 border-t border-border pt-6 first:border-t-0 first:pt-0">
    <legend className="flex items-baseline gap-3 text-lg font-semibold tracking-tight"><span className="rx-num text-xs font-normal text-muted-foreground">{String(number).padStart(2, '0')}</span>{title}</legend>
    {children}
  </fieldset>
}

function orderStatusHref(order: { orderId: string; guestOrderToken?: string | null }) {
  return `/order-status?${new URLSearchParams({ orderId: order.orderId, token: order.guestOrderToken || '', placed: '1' })}`
}

export function CheckoutForm({ providers, pickupEnabled, deliveryEnabled, defaultEmail, stripeKey, totalLabel, pickupHours }: { providers: PharmacyPaymentProviderOption[]; pickupEnabled: boolean; deliveryEnabled: boolean; defaultEmail?: string | null; stripeKey?: string | null; totalLabel: string; pickupHours?: ReactNode }) {
  const router = useRouter()
  const methods = [pickupEnabled && { value: 'pickup' as const, label: 'Pickup' }, deliveryEnabled && { value: 'delivery' as const, label: 'Delivery' }].filter((method): method is { value: 'pickup' | 'delivery'; label: string } => Boolean(method))
  const [fulfillmentMethod, setFulfillmentMethod] = useState(methods[0]?.value ?? 'pickup')
  // Pay at pickup cannot settle a delivery; delivery orders are paid online.
  const available = fulfillmentMethod === 'delivery' ? providers.filter((provider) => !provider.payAtPickup) : providers
  const [providerCode, setProviderCode] = useState(available[0]?.code ?? '')
  const selectedCode = available.some((provider) => provider.code === providerCode) ? providerCode : available[0]?.code ?? ''
  const [card, setCard] = useState<CardStep | null>(null)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const inputRef = useRef<PlaceOrderInput | null>(null)

  // Finishes an order after Stripe returns from a bank redirect.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('redirect_status') !== 'succeeded') return
    let saved: (PlaceOrderInput & { paymentSessionId: string }) | null = null
    try { saved = JSON.parse(sessionStorage.getItem(PENDING_CARD_KEY) || 'null') } catch { saved = null }
    if (!saved) return
    startTransition(async () => {
      const result = await completeCardCheckout(saved!)
      if (!result.success) return setError(result.error)
      sessionStorage.removeItem(PENDING_CARD_KEY)
      router.push(orderStatusHref(result.data))
    })
  }, [router])

  function readInput(form: HTMLFormElement): PlaceOrderInput {
    const data = new FormData(form)
    return {
      providerCode: selectedCode,
      email: String(data.get('email') || ''),
      phone: String(data.get('phone') || ''),
      fulfillmentMethod,
      shippingAddress: fulfillmentMethod === 'delivery' ? { line1: String(data.get('line1') || ''), line2: String(data.get('line2') || ''), city: String(data.get('city') || ''), region: String(data.get('region') || ''), postalCode: String(data.get('postalCode') || '') } : null,
      consentAccepted: data.get('consent') === 'on',
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const input = readInput(event.currentTarget)
    inputRef.current = input
    setError('')
    startTransition(async () => {
      const result = await startCheckout(input)
      if (!result.success) return setError(result.error)
      if (result.data.kind === 'placed') return router.push(orderStatusHref(result.data.order))
      if (!stripeKey) return setError('Card payment is not set up at this pharmacy. Choose another payment option.')
      setCard({ paymentSessionId: result.data.paymentSessionId, clientSecret: result.data.clientSecret })
    })
  }

  function finishCard() {
    if (!card || !inputRef.current) return
    const input = { ...inputRef.current, paymentSessionId: card.paymentSessionId }
    startTransition(async () => {
      const result = await completeCardCheckout(input)
      if (!result.success) return setError(result.error)
      sessionStorage.removeItem(PENDING_CARD_KEY)
      router.push(orderStatusHref(result.data))
    })
  }

  if (!providers.length) return <Notice>Online payment is unavailable at this pharmacy. Call to place an order.</Notice>
  if (!methods.length) return <Notice>Online ordering is unavailable at this pharmacy. Call to place an order.</Notice>

  return <form onSubmit={submit} className="grid gap-8">
    <fieldset disabled={Boolean(card)} className="grid gap-8 disabled:opacity-70">
      <Step number={1} title="Contact">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2"><Label htmlFor="checkout-email">Email</Label><Input id="checkout-email" name="email" type="email" autoComplete="email" defaultValue={defaultEmail || ''} maxLength={254} required className={inputClass} /></div>
          <div className="grid gap-2"><Label htmlFor="checkout-phone">Phone</Label><Input id="checkout-phone" name="phone" type="tel" autoComplete="tel" maxLength={40} required className={inputClass} /></div>
        </div>
      </Step>

      <Step number={2} title="Pickup or delivery">
        <Track label="Fulfillment">
          {methods.map((method) => <Pill key={method.value} active={fulfillmentMethod === method.value} onClick={() => setFulfillmentMethod(method.value)} className="min-w-28">{method.label}</Pill>)}
        </Track>
        {fulfillmentMethod === 'pickup' && pickupHours}
        {fulfillmentMethod === 'delivery' && <div className="grid gap-4 sm:grid-cols-6">
          <div className="grid gap-2 sm:col-span-6"><Label htmlFor="line1">Address</Label><Input id="line1" name="line1" autoComplete="address-line1" required className={inputClass} /></div>
          <div className="grid gap-2 sm:col-span-6"><Label htmlFor="line2">Apartment, suite (optional)</Label><Input id="line2" name="line2" autoComplete="address-line2" className={inputClass} /></div>
          <div className="grid gap-2 sm:col-span-3"><Label htmlFor="city">City</Label><Input id="city" name="city" autoComplete="address-level2" required className={inputClass} /></div>
          <div className="grid gap-2 sm:col-span-1"><Label htmlFor="region">State</Label><Input id="region" name="region" autoComplete="address-level1" className={inputClass} /></div>
          <div className="grid gap-2 sm:col-span-2"><Label htmlFor="postalCode">ZIP code</Label><Input id="postalCode" name="postalCode" autoComplete="postal-code" inputMode="numeric" required className={inputClass} /></div>
        </div>}
      </Step>

      <Step number={3} title="Payment">
        {available.length
          ? <Track label="Payment method">
            {available.map((provider) => <Pill key={provider.code} active={selectedCode === provider.code} onClick={() => setProviderCode(provider.code)}>{provider.name}</Pill>)}
          </Track>
          : <Notice>Delivery orders are paid online, and card payment is not set up at this pharmacy. Choose pickup.</Notice>}
      </Step>

      <label className="flex items-start gap-3 rounded-xl bg-muted px-4 py-3.5 text-sm"><input type="checkbox" name="consent" required className="mt-0.5 size-4 accent-[var(--primary)]" /><span>{CHECKOUT_PRIVACY_STATEMENT} <Link href="/privacy" target="_blank" className="font-medium text-primary underline underline-offset-4">Privacy notice</Link></span></label>
    </fieldset>

    {card && stripeKey
      ? <Step number={4} title="Card">
        <StripeCardStep publishableKey={stripeKey} clientSecret={card.clientSecret} returnUrl={`${window.location.origin}/checkout`} totalLabel={totalLabel} onBeforeConfirm={() => { if (inputRef.current) sessionStorage.setItem(PENDING_CARD_KEY, JSON.stringify({ ...inputRef.current, paymentSessionId: card.paymentSessionId })) }} onPaid={finishCard} />
      </Step>
      : null}

    {error && <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
    {!card && <button type="submit" disabled={pending || !available.length} className={`${buttonClass} min-h-12 w-full`}>{pending ? 'Placing order…' : available.find((provider) => provider.code === selectedCode)?.payAtPickup ? 'Place order' : 'Continue to payment'}</button>}
    {card && pending && <p role="status" className="text-sm text-muted-foreground">Placing order…</p>}
  </form>
}
