'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { PharmacyPaymentProviderOption } from '@/features/pharmacy/contracts'
import { placeOrder } from '../lib/data/checkout'

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

  if (!providers.length) return <p className="rounded-xl bg-muted p-4 text-sm">Online payment is unavailable at this location. Call the pharmacy to place an order.</p>
  if (!methods.length) return <p className="rounded-xl bg-muted p-4 text-sm">Online ordering is unavailable at this location. Call the pharmacy to place an order.</p>

  return <form onSubmit={submit} className="space-y-6">
    <fieldset className="space-y-4">
      <legend className="mb-2 text-lg font-semibold">Contact</legend>
      <div className="space-y-2"><Label htmlFor="checkout-email">Email</Label><Input id="checkout-email" name="email" type="email" autoComplete="email" defaultValue={defaultEmail || ''} maxLength={254} required /></div>
      <div className="space-y-2"><Label htmlFor="checkout-phone">Phone</Label><Input id="checkout-phone" name="phone" type="tel" autoComplete="tel" maxLength={40} required /></div>
    </fieldset>

    <fieldset className="space-y-3">
      <legend className="mb-2 text-lg font-semibold">Fulfillment</legend>
      {methods.map((method) => <label key={method.value} className="flex min-h-11 items-center gap-3 rounded-xl border border-border bg-card px-4"><input type="radio" name="fulfillmentMethod" value={method.value} checked={fulfillmentMethod === method.value} onChange={() => setFulfillmentMethod(method.value)} />{method.label}</label>)}
      {fulfillmentMethod === 'delivery' && <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="line1">Address</Label><Input id="line1" name="line1" autoComplete="address-line1" required /></div>
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="line2">Apartment, suite (optional)</Label><Input id="line2" name="line2" autoComplete="address-line2" /></div>
        <div className="space-y-2"><Label htmlFor="city">City</Label><Input id="city" name="city" autoComplete="address-level2" required /></div>
        <div className="space-y-2"><Label htmlFor="region">State</Label><Input id="region" name="region" autoComplete="address-level1" /></div>
        <div className="space-y-2"><Label htmlFor="postalCode">ZIP code</Label><Input id="postalCode" name="postalCode" autoComplete="postal-code" required /></div>
      </div>}
    </fieldset>

    <fieldset className="space-y-3">
      <legend className="mb-2 text-lg font-semibold">Payment</legend>
      {providers.map((provider) => <label key={provider.code} className="flex min-h-11 items-center gap-3 rounded-xl border border-border bg-card px-4"><input type="radio" name="providerCode" value={provider.code} checked={providerCode === provider.code} onChange={() => setProviderCode(provider.code)} />{provider.name}</label>)}
    </fieldset>

    <label className="flex items-start gap-3 text-sm text-muted-foreground"><input type="checkbox" name="consent" required className="mt-1" /><span>The pharmacy may use my contact details to process this order and contact me about it.</span></label>
    {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    <Button type="submit" disabled={pending} className="h-12 w-full rounded-full">{pending ? 'Placing order…' : 'Place order'}</Button>
  </form>
}
