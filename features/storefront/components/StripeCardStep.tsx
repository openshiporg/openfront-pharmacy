'use client'

import { useEffect, useRef, useState } from 'react'

import { buttonClass } from './rx-ui'

// Stripe.js v3 loaded from Stripe, as @stripe/stripe-js does; Stripe requires it to be served from js.stripe.com.
type StripeElement = { mount: (node: HTMLElement) => void; destroy: () => void }
type StripeElements = { create: (type: 'payment', options?: Record<string, unknown>) => StripeElement; submit: () => Promise<{ error?: { message?: string } }> }
type StripeInstance = {
  elements: (options: Record<string, unknown>) => StripeElements
  confirmPayment: (options: Record<string, unknown>) => Promise<{ error?: { message?: string }; paymentIntent?: { status: string } }>
}

declare global {
  interface Window { Stripe?: (key: string) => StripeInstance }
}

let stripeScript: Promise<void> | null = null

function loadStripeJs() {
  if (window.Stripe) return Promise.resolve()
  stripeScript ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://js.stripe.com/v3'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => { stripeScript = null; reject(new Error('Stripe could not be loaded')) }
    document.head.appendChild(script)
  })
  return stripeScript
}

/** Payment Element for a PaymentIntent; calls onPaid once Stripe reports the payment succeeded. */
export function StripeCardStep({ publishableKey, clientSecret, returnUrl, totalLabel, onBeforeConfirm, onPaid }: { publishableKey: string; clientSecret: string; returnUrl: string; totalLabel: string; onBeforeConfirm: () => void; onPaid: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null)
  const stripeRef = useRef<{ stripe: StripeInstance; elements: StripeElements } | null>(null)
  const [ready, setReady] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let element: StripeElement | null = null
    let cancelled = false
    loadStripeJs().then(() => {
      if (cancelled || !mountRef.current || !window.Stripe) return
      const stripe = window.Stripe(publishableKey)
      const elements = stripe.elements({ clientSecret, appearance: { theme: 'stripe', variables: { borderRadius: '12px' } } })
      element = elements.create('payment', { layout: 'tabs' })
      element.mount(mountRef.current)
      stripeRef.current = { stripe, elements }
      setReady(true)
    }).catch(() => setError('Card payment could not be loaded. Check your connection and try again.'))
    return () => { cancelled = true; element?.destroy() }
  }, [clientSecret, publishableKey])

  async function pay() {
    const current = stripeRef.current
    if (!current) return
    setError('')
    setPending(true)
    const submitted = await current.elements.submit()
    if (submitted.error) { setPending(false); return setError(submitted.error.message || 'Check your card details.') }
    onBeforeConfirm()
    const result = await current.stripe.confirmPayment({ elements: current.elements, redirect: 'if_required', confirmParams: { return_url: returnUrl } })
    setPending(false)
    if (result.error) return setError(result.error.message || 'Your card was not charged. Try again.')
    if (result.paymentIntent?.status === 'succeeded') return onPaid()
    setError(result.paymentIntent?.status === 'processing' ? 'Your payment is processing. Check the order status shortly.' : 'Your card was not charged. Try again.')
  }

  return <div className="grid gap-4">
    <div ref={mountRef} className="min-h-24" aria-busy={!ready} />
    {error && <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
    <button type="button" onClick={pay} disabled={!ready || pending} className={`${buttonClass} min-h-12 w-full`}>{pending ? 'Paying…' : `Pay ${totalLabel}`}</button>
  </div>
}
