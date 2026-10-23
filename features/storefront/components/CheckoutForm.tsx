'use client'

import { useState, useTransition, type FormEvent, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { PharmacyPaymentProviderOption } from '@/features/pharmacy/contracts'
import { placeOrder } from '../lib/data/checkout'
import { Notice, Pill, Track, buttonClass } from './rx-ui'

const inputClass = 'h-11 rounded-xl bg-card'

function Step({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return <fieldset className="grid gap-4 border-t border-border pt-6 first:border-t-0 first:pt-0">
    <legend className="flex items-baseline gap-3 text-lg font-semibold tracking-tight"><span className="rx-num text-xs font-normal text-muted-foreground">{String(number).padStart(2, '0')}</span>{title}</legend>
    {children}
  </fieldset>
}

export function CheckoutForm({ providers, pickupEnabled, deliveryEnabled, defaultEmail }: { providers: PharmacyPaymentProviderOption[]; pickupEnabled: boolean; deliveryEnabled: boolean; defaultEmail?: string | null }) {
  const router = useRouter()
  const methods = [pickupEnabled && { value: 'pickup' as const, label: 'Pickup' }, deliveryEnabled && { value: 'delivery' as const, label: 'Delivery' }].filter((method): method is { value: 'pickup' | 'delivery'; label: string } => Boolean(method))
  const [fulfillmentMethod, setFulfillmentMethod] = useState(methods[0]?.value ?? 'pickup')
  const [providerCode, setProviderCode] = useState(providers[0]?.code ?? '')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setError('')
    startTransition(async () => {
      const result = await placeOrder({
        providerCode,
        email: String(form.get('email') || ''),
        phone: String(form.get('phone') || ''),
        fulfillmentMethod,
        shippingAddress: fulfillmentMethod === 'delivery' ? { line1: String(form.get('line1') || ''), line2: String(form.get('line2') || ''), city: String(form.get('city') || ''), region: String(form.get('region') || ''), postalCode: String(form.get('postalCode') || '') } : null,
        consentAccepted: form.get('consent') === 'on',
      })
      if (!result.success) return setError(result.error)
      const params = new URLSearchParams({ orderId: result.data.orderId, token: result.data.guestOrderToken || '', placed: '1' })
      router.push(`/order-status?${params}`)
    })
  }

  if (!providers.length) return <Notice>Online payment is unavailable at this pharmacy. Call to place an order.</Notice>
  if (!methods.length) return <Notice>Online ordering is unavailable at this pharmacy. Call to place an order.</Notice>

  return <form onSubmit={submit} className="grid gap-8">
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
      {fulfillmentMethod === 'delivery' && <div className="grid gap-4 sm:grid-cols-6">
        <div className="grid gap-2 sm:col-span-6"><Label htmlFor="line1">Address</Label><Input id="line1" name="line1" autoComplete="address-line1" required className={inputClass} /></div>
        <div className="grid gap-2 sm:col-span-6"><Label htmlFor="line2">Apartment, suite (optional)</Label><Input id="line2" name="line2" autoComplete="address-line2" className={inputClass} /></div>
        <div className="grid gap-2 sm:col-span-3"><Label htmlFor="city">City</Label><Input id="city" name="city" autoComplete="address-level2" required className={inputClass} /></div>
        <div className="grid gap-2 sm:col-span-1"><Label htmlFor="region">State</Label><Input id="region" name="region" autoComplete="address-level1" className={inputClass} /></div>
        <div className="grid gap-2 sm:col-span-2"><Label htmlFor="postalCode">ZIP code</Label><Input id="postalCode" name="postalCode" autoComplete="postal-code" inputMode="numeric" required className={inputClass} /></div>
      </div>}
    </Step>

    <Step number={3} title="Payment">
      <Track label="Payment method">
        {providers.map((provider) => <Pill key={provider.code} active={providerCode === provider.code} onClick={() => setProviderCode(provider.code)}>{provider.name}</Pill>)}
      </Track>
    </Step>

    <label className="flex items-start gap-3 rounded-xl bg-muted px-4 py-3.5 text-sm"><input type="checkbox" name="consent" required className="mt-0.5 size-4 accent-[var(--primary)]" /><span>The pharmacy may use my contact details to process this order and contact me about it.</span></label>
    {error && <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
    <button type="submit" disabled={pending} className={`${buttonClass} min-h-12 w-full`}>{pending ? 'Placing order…' : 'Place order'}</button>
  </form>
}
