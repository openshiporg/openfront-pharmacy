'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

import type { PharmacyPaymentProviderOption, PharmacyPaymentSessionResult, SubmitPharmacyOrderProjection } from '@/features/pharmacy/contracts'
import { CHECKOUT_POLICY } from '../constants'
import { storefrontRequest, type StorefrontResult } from '../storefront-client'
import { sendOrderConfirmationEmail } from '@/features/keystone/lib/mail'
import { getStoredCart, removeStoredCart } from './cookies'
import { getStorefront } from './store'

export async function getPaymentProviders(locationId: string): Promise<PharmacyPaymentProviderOption[]> {
  const response = await storefrontRequest<{ activePharmacyPaymentProviders: PharmacyPaymentProviderOption[] }>(
    'query StorefrontPaymentProviders($locationId: ID!) { activePharmacyPaymentProviders(locationId: $locationId) { code name payAtPickup } }',
    { locationId },
  )
  return response.success ? response.data.activePharmacyPaymentProviders : []
}

export type PlaceOrderInput = {
  providerCode: string
  email: string
  phone: string
  fulfillmentMethod: 'pickup' | 'delivery'
  shippingAddress?: { line1: string; line2?: string; city: string; region?: string; postalCode: string } | null
  consentAccepted: boolean
}

type PlacedOrder = Pick<SubmitPharmacyOrderProjection, 'orderId' | 'orderNumber' | 'guestOrderToken'>

/** The outcome of starting checkout: the order was placed, or a card must be confirmed in the browser first. */
export type CheckoutStep =
  | { kind: 'placed'; order: PlacedOrder }
  | { kind: 'card'; paymentSessionId: string; clientSecret: string }

function validate(input: PlaceOrderInput) {
  if (!input.consentAccepted) return 'Confirm that the pharmacy may use your details for this order.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) return 'Enter a valid email address.'
  if (!input.phone.trim()) return 'Enter a phone number.'
  return null
}

async function submit(input: PlaceOrderInput, paymentSessionId: string): Promise<StorefrontResult<PlacedOrder>> {
  const stored = await getStoredCart()
  if (!stored) return { success: false, error: 'Your cart has expired. Add your items again.' }
  const order = await storefrontRequest<{ submitPharmacyOrder: SubmitPharmacyOrderProjection }>(
    'mutation StorefrontSubmitOrder($input: SubmitPharmacyOrderInput!) { submitPharmacyOrder(input: $input) { orderId orderNumber guestOrderToken } }',
    {
      input: {
        cartId: stored.cartId,
        guestToken: stored.guestToken,
        paymentSessionId,
        idempotencyKey: `checkout:${stored.cartId}:${paymentSessionId}`,
        email: input.email.trim(),
        phone: input.phone.trim(),
        fulfillmentMethod: input.fulfillmentMethod,
        shippingAddress: input.fulfillmentMethod === 'delivery' ? input.shippingAddress ?? null : null,
        privacyConsentAccepted: true,
        ...CHECKOUT_POLICY,
      },
    },
    'Your order could not be placed. Please try again.',
  )
  if (!order.success) return order
  await removeStoredCart()
  revalidatePath('/', 'layout')
  const { orderId, orderNumber, guestOrderToken } = order.data.submitPharmacyOrder
  await sendConfirmation(input.email.trim(), { orderId, orderNumber, guestOrderToken })
  return { success: true, data: { orderId, orderNumber, guestOrderToken } }
}

/** Best effort: emails the order number and tracking link when the store has email set up. */
async function sendConfirmation(to: string, order: PlacedOrder) {
  try {
    const requestHeaders = await headers()
    const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host')
    if (!host) return
    const protocol = requestHeaders.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')
    const params = new URLSearchParams({ orderId: order.orderId, token: order.guestOrderToken || '' })
    const storefront = await getStorefront()
    await sendOrderConfirmationEmail({ to, orderNumber: order.orderNumber, storeName: storefront?.brand.displayName || 'Pharmacy', url: `${protocol}://${host}/order-status?${params}` })
  } catch {
    console.error('Order confirmation email failed')
  }
}

export async function startCheckout(input: PlaceOrderInput): Promise<StorefrontResult<CheckoutStep>> {
  const stored = await getStoredCart()
  if (!stored) return { success: false, error: 'Your cart has expired. Add your items again.' }
  const invalid = validate(input)
  if (invalid) return { success: false, error: invalid }

  const session = await storefrontRequest<{ initiatePharmacyPaymentSession: PharmacyPaymentSessionResult }>(
    'mutation StorefrontPayment($cartId: ID!, $guestToken: String, $providerCode: String!) { initiatePharmacyPaymentSession(cartId: $cartId, guestToken: $guestToken, providerCode: $providerCode) { id status clientSecret } }',
    { ...stored, providerCode: input.providerCode },
    'Payment could not be started. Please try again.',
  )
  if (!session.success) return session
  const payment = session.data.initiatePharmacyPaymentSession
  if (payment.status === 'failed') return { success: false, error: 'Payment failed. Choose another payment option or try again.' }
  if (payment.status === 'requires_action') {
    if (!payment.clientSecret) return { success: false, error: 'Card payment could not be started. Choose another payment option.' }
    return { success: true, data: { kind: 'card', paymentSessionId: payment.id, clientSecret: payment.clientSecret } }
  }
  const placed = await submit(input, payment.id)
  return placed.success ? { success: true, data: { kind: 'placed', order: placed.data } } : placed
}

/** Places the order after the browser confirmed the card with Stripe; the server re-checks the payment status. */
export async function completeCardCheckout(input: PlaceOrderInput & { paymentSessionId: string }): Promise<StorefrontResult<PlacedOrder>> {
  const invalid = validate(input)
  if (invalid) return { success: false, error: invalid }
  return submit(input, input.paymentSessionId)
}
