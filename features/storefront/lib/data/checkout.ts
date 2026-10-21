'use server'

import { revalidatePath } from 'next/cache'

import type { PharmacyPaymentProviderOption, PharmacyPaymentSessionResult, SubmitPharmacyOrderProjection } from '@/features/pharmacy/contracts'
import { CHECKOUT_POLICY } from '../constants'
import { storefrontRequest, type StorefrontResult } from '../storefront-client'
import { getStoredCart, removeStoredCart } from './cookies'

export async function getPaymentProviders(locationId: string): Promise<PharmacyPaymentProviderOption[]> {
  const response = await storefrontRequest<{ activePharmacyPaymentProviders: PharmacyPaymentProviderOption[] }>(
    'query StorefrontPaymentProviders($locationId: ID!) { activePharmacyPaymentProviders(locationId: $locationId) { code name } }',
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

export async function placeOrder(input: PlaceOrderInput): Promise<StorefrontResult<Pick<SubmitPharmacyOrderProjection, 'orderId' | 'orderNumber' | 'guestOrderToken'>>> {
  const stored = await getStoredCart()
  if (!stored) return { success: false, error: 'Your cart has expired. Add your items again.' }
  if (!input.consentAccepted) return { success: false, error: 'Confirm that the pharmacy may use your details for this order.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) return { success: false, error: 'Enter a valid email address.' }
  if (!input.phone.trim()) return { success: false, error: 'Enter a phone number.' }

  const session = await storefrontRequest<{ initiatePharmacyPaymentSession: PharmacyPaymentSessionResult }>(
    'mutation StorefrontPayment($cartId: ID!, $guestToken: String, $providerCode: String!) { initiatePharmacyPaymentSession(cartId: $cartId, guestToken: $guestToken, providerCode: $providerCode) { id status } }',
    { ...stored, providerCode: input.providerCode },
    'Payment could not be started. Please try again.',
  )
  if (!session.success) return session
  const payment = session.data.initiatePharmacyPaymentSession
  if (payment.status === 'requires_action') return { success: false, error: 'Card payment is not available online yet. Choose another payment option.' }
  if (payment.status === 'failed') return { success: false, error: 'Payment failed. Choose another payment option or try again.' }

  const order = await storefrontRequest<{ submitPharmacyOrder: SubmitPharmacyOrderProjection }>(
    'mutation StorefrontSubmitOrder($input: SubmitPharmacyOrderInput!) { submitPharmacyOrder(input: $input) { orderId orderNumber guestOrderToken } }',
    {
      input: {
        cartId: stored.cartId,
        guestToken: stored.guestToken,
        paymentSessionId: payment.id,
        idempotencyKey: `checkout:${stored.cartId}:${payment.id}`,
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
  return { success: true, data: { orderId, orderNumber, guestOrderToken } }
}
