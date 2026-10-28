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

// Stripe styles its iframe from plain colour values, so read the store's tokens (oklch, hue set at
// runtime from the operator's brand) off the page and hand them over as rgb.
function tokenColor(host: HTMLElement, token: string, fallback: string) {
  const probe = document.createElement('span')
  probe.style.color = `var(${token})`
  host.appendChild(probe)
  const computed = getComputedStyle(probe).color
  probe.remove()
  const context = document.createElement('canvas').getContext('2d')
  if (!context) return fallback
  context.fillStyle = fallback
  context.fillStyle = computed
  context.fillRect(0, 0, 1, 1)
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data
  return `rgb(${r}, ${g}, ${b})`
}

/** The storefront's dark cabinet palette, Hanken Grotesk and 4px corners for the Payment Element. */
function storeAppearance(host: HTMLElement) {
  const color = (token: string, fallback: string) => tokenColor(host, token, fallback)
  const text = color('--foreground', '#f3efe6')
  const muted = color('--muted-foreground', '#bdb7aa')
  const primary = color('--primary', '#d3b06b')
  const field = color('--card', '#151b18')
  const stroke = color('--input', '#3b4540')
  const rule = color('--rx-rule', '#333c37')
  return {
    theme: 'night',
    variables: {
      colorPrimary: primary,
      colorBackground: field,
      colorText: text,
      colorTextSecondary: muted,
      colorTextPlaceholder: muted,
      colorIcon: muted,
      colorDanger: color('--destructive', '#f0705c'),
      fontFamily: '"Hanken Grotesk", ui-sans-serif, system-ui, sans-serif',
      fontSizeBase: '15px',
      borderRadius: '4px',
      spacingUnit: '4px',
    },
    rules: {
      '.Label': { color: muted, fontSize: '13px', fontWeight: '600' },
      '.Input': { border: `1px solid ${stroke}`, boxShadow: 'none' },
      '.Input:focus': { borderColor: primary, boxShadow: `0 0 0 1px ${primary}` },
      '.Tab': { border: `1px solid ${rule}`, boxShadow: 'none' },
      '.Tab:hover': { color: text },
      '.Tab--selected': { borderColor: primary, color: text, boxShadow: `0 0 0 1px ${primary}` },
      '.Tab--selected:hover': { color: text },
      '.TabIcon--selected': { fill: primary },
      '.TabLabel--selected': { color: text },
    },
  }
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
      const elements = stripe.elements({ clientSecret, appearance: storeAppearance(mountRef.current), fonts: [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&display=swap' }] })
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

  return <div className="grid w-full min-w-0 gap-4">
    <div ref={mountRef} className="min-h-24 w-full min-w-0" aria-busy={!ready} />
    {error && <p role="alert" className="rounded-[4px] bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
    <button type="button" onClick={pay} disabled={!ready || pending} className={`${buttonClass} min-h-12 w-full`}>{pending ? 'Paying…' : `Pay ${totalLabel}`}</button>
  </div>
}
