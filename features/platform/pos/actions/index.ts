'use server'

import { keystoneClient } from '@/features/dashboard/lib/keystoneClient'
import type { PharmacyCatalogProductProjection, PharmacyOperatorLocationProjection } from '@/features/pharmacy/contracts'

function unwrap<T>(response: Awaited<ReturnType<typeof keystoneClient<T>>>) {
  if (!response.success) throw new Error(response.error)
  return response.data
}

export async function getPharmacyPosStorefront() {
  const locations = unwrap(await keystoneClient<{ pharmacyOperatorLocations: PharmacyOperatorLocationProjection[] }>(`query { pharmacyOperatorLocations { id name code pickupEnabled deliveryEnabled operatorDisplayName operatorPhone cashSalesEnabled cashTaxRateBps } }`)).pharmacyOperatorLocations
  const location = locations[0]
  if (!location) return { location: null, products: [] as PharmacyCatalogProductProjection[], customers: [] as Array<{ id: string; label: string }> }
  const products = unwrap(await keystoneClient<{ pharmacyPosCatalog: PharmacyCatalogProductProjection[] }>(`query PosCatalog($locationId: ID!) { pharmacyPosCatalog(locationId: $locationId) { id title handle sku description category priceAmount currencyCode taxable imageUrl prescriptionRequirement availableQuantity inStock } }`, { locationId: location.id })).pharmacyPosCatalog
  const customers = unwrap(await keystoneClient<{ pharmacyPosCustomers: Array<{ id: string; label: string }> }>(`query PosCustomers($locationId: ID!) { pharmacyPosCustomers(locationId: $locationId) { id label } }`, { locationId: location.id })).pharmacyPosCustomers
  return { location, products, customers }
}

export type PharmacyPosCashReceipt = {
  success: boolean
  reused: boolean
  orderId: string
  orderNumber: string
  status: string
  recordedAt: string
  lines: Array<{ title: string; sku: string; quantity: number; unitPriceAmount: number; lineTotalAmount: number }>
  subtotalAmount: number
  taxAmount: number
  totalAmount: number
  currencyCode: string
  paymentId: string
  paymentStatus: string
  cashReceivedAmount: number
  changeDueAmount: number
}

export async function submitPosOrder(input: { locationId: string; customerCartId?: string | null; fulfillmentMethod?: string | null; items: Array<{ productId: string; quantity: number }>; cashReceivedAmount: number; reason: string; attested: boolean; idempotencyKey: string }): Promise<PharmacyPosCashReceipt> {
  return unwrap(await keystoneClient<{ submitPharmacyPosCashOrder: PharmacyPosCashReceipt }>(`mutation PosCash($locationId: ID!, $customerCartId: ID, $fulfillmentMethod: String, $items: [PharmacyPosCashItemInput!]!, $cashReceivedAmount: Int!, $idempotencyKey: String!, $reason: String!, $attested: Boolean!) { submitPharmacyPosCashOrder(locationId: $locationId, customerCartId: $customerCartId, fulfillmentMethod: $fulfillmentMethod, items: $items, cashReceivedAmount: $cashReceivedAmount, idempotencyKey: $idempotencyKey, reason: $reason, attested: $attested) { success reused orderId orderNumber status recordedAt lines { title sku quantity unitPriceAmount lineTotalAmount } subtotalAmount taxAmount totalAmount currencyCode paymentId paymentStatus cashReceivedAmount changeDueAmount } }`, input)).submitPharmacyPosCashOrder
}

export async function recoverPosOrder(idempotencyKey: string): Promise<PharmacyPosCashReceipt | null> {
  return unwrap(await keystoneClient<{ pharmacyPosCashReceipt: PharmacyPosCashReceipt | null }>(`query PosReceipt($idempotencyKey: String!) { pharmacyPosCashReceipt(idempotencyKey: $idempotencyKey) { success reused orderId orderNumber status recordedAt lines { title sku quantity unitPriceAmount lineTotalAmount } subtotalAmount taxAmount totalAmount currencyCode paymentId paymentStatus cashReceivedAmount changeDueAmount } }`, { idempotencyKey })).pharmacyPosCashReceipt
}
