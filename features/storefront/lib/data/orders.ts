'use server'

import type { GuestPharmacyOrderProjection } from '@/features/pharmacy/contracts'
import { storefrontRequest } from '../storefront-client'
import { normalizePublicOrderLookupInput, publicOrderLookupFailure, type PublicOrderLookupResult } from '../public-order-lookup'

export type CustomerOrder = { id: string; orderNumber: string; status: string; totalAmount: number; currencyCode: string; createdAt: string; lineItems: Array<{ title: string; quantity: number; unitPriceAmount: number }> }

export async function lookupGuestOrder(input: { orderId: string; guestOrderToken: string }): Promise<PublicOrderLookupResult> {
  const credentials = normalizePublicOrderLookupInput(input)
  if (!credentials) return publicOrderLookupFailure()
  const response = await storefrontRequest<{ guestPharmacyOrder: GuestPharmacyOrderProjection | null }>(
    'query StorefrontGuestOrder($orderId: ID!, $guestOrderToken: String!) { guestPharmacyOrder(orderId: $orderId, guestOrderToken: $guestOrderToken) { id orderNumber status fulfillmentMethod subtotalAmount taxAmount deliveryAmount totalAmount currencyCode pickupAt deliveryWindow createdAt locationName locationTimezone lines { id title quantity unitPriceAmount lineTotalAmount imageUrl prescriptionRequirement } fulfillment { method status readyAt handedOffAt } } }',
    credentials,
  )
  if (!response.success || !response.data.guestPharmacyOrder) return publicOrderLookupFailure()
  return { ok: true, order: response.data.guestPharmacyOrder }
}

export async function lookupOrderByNumber(input: { orderNumber: string; email: string }): Promise<PublicOrderLookupResult> {
  const orderNumber = input.orderNumber.trim()
  const email = input.email.trim()
  if (!orderNumber || !email || orderNumber.length > 64 || email.length > 254) return publicOrderLookupFailure()
  const response = await storefrontRequest<{ lookupPharmacyOrder: GuestPharmacyOrderProjection | null }>(
    'query StorefrontOrderLookup($orderNumber: String!, $email: String!) { lookupPharmacyOrder(orderNumber: $orderNumber, email: $email) { id orderNumber status fulfillmentMethod subtotalAmount taxAmount deliveryAmount totalAmount currencyCode pickupAt deliveryWindow createdAt locationName locationTimezone lines { id title quantity unitPriceAmount lineTotalAmount imageUrl prescriptionRequirement } fulfillment { method status readyAt handedOffAt } } }',
    { orderNumber, email },
  )
  if (!response.success || !response.data.lookupPharmacyOrder) return publicOrderLookupFailure()
  return { ok: true, order: response.data.lookupPharmacyOrder }
}

/** The signed-in customer's own order, or null when it does not exist for them. */
export async function getCustomerOrder(orderId: string): Promise<CustomerOrder | null> {
  const response = await storefrontRequest<{ pharmacyCustomerOrder: CustomerOrder }>(
    'query StorefrontCustomerOrder($orderId: ID!) { pharmacyCustomerOrder(orderId: $orderId) { id orderNumber status totalAmount currencyCode createdAt lineItems { title quantity unitPriceAmount } } }',
    { orderId },
  )
  return response.success ? response.data.pharmacyCustomerOrder : null
}

/** The signed-in customer's order with tracking detail (method, progress, times, totals), or null. */
export async function getCustomerOrderDetails(orderId: string): Promise<GuestPharmacyOrderProjection | null> {
  const response = await storefrontRequest<{ pharmacyCustomerOrderDetails: GuestPharmacyOrderProjection }>(
    'query StorefrontCustomerOrderDetails($orderId: ID!) { pharmacyCustomerOrderDetails(orderId: $orderId) { id orderNumber status fulfillmentMethod subtotalAmount taxAmount deliveryAmount totalAmount currencyCode pickupAt deliveryWindow createdAt locationName locationTimezone lines { id title quantity unitPriceAmount lineTotalAmount imageUrl prescriptionRequirement } fulfillment { method status readyAt handedOffAt } } }',
    { orderId },
  )
  return response.success ? response.data.pharmacyCustomerOrderDetails : null
}
