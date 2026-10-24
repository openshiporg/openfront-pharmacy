'use server'

import { revalidatePath } from 'next/cache'
import { platformRequest } from '@/features/platform/lib/request'
import { ActionError, guardAction } from '@/features/platform/lib/action-result'
import type { PharmacyProductOptionWorklistProjection } from '@/features/pharmacy/contracts'

function result<T>(response: Awaited<ReturnType<typeof platformRequest<T>>>, path: string) {
  if (!response.success) throw new ActionError(response.error)
  revalidatePath(path)
  return response.data
}

type InventoryActionResult = { success: boolean; reused?: boolean | null; movementId?: string | null; lotId?: string | null; quantityAvailable?: number | null; recallId?: string | null; lotCount?: number | null; unlinkedExposureCount?: number | null; approvalId?: string | null; status?: string | null }

export async function loadInventoryReceiptProductPageAction(input: { locationId: string; first?: number; after?: string | null; status?: string | null }) {
  return guardAction(async () => {
  const response = await platformRequest<{ pharmacyInventoryReceiptProductWorklist: PharmacyProductOptionWorklistProjection }>(
    `query ReceiptProductWorklist($locationId: ID!, $first: Int, $after: String, $status: String) { pharmacyInventoryReceiptProductWorklist(locationId: $locationId, first: $first, after: $after, status: $status) { items { id label scopeId detail } totalCount hasMore nextCursor } }`,
    input,
  )
  if (!response.success) throw new ActionError(response.error)
  return response.data.pharmacyInventoryReceiptProductWorklist
  })
}

export async function receiveInventoryAction(input: {
  productId: string
  locationId: string
  supplierId?: string
  lotNumber: string
  serialNumber?: string
  expirationDate: string
  quantity: number
  coldChainRequired: boolean
  minimumTemperatureC?: number
  maximumTemperatureC?: number
  coldChainEvidenceComplete: boolean
  reason: string
  idempotencyKey: string
  attested: boolean
}) {
  return guardAction(async () => {
  const response = await platformRequest<{ receivePharmacyInventoryLot: InventoryActionResult }>(`mutation Receive($productId: ID!, $locationId: ID!, $supplierId: ID, $lotNumber: String!, $serialNumber: String, $expirationDate: String!, $quantity: Int!, $coldChainRequired: Boolean!, $minimumTemperatureC: Float, $maximumTemperatureC: Float, $coldChainEvidenceComplete: Boolean!, $reason: String!, $idempotencyKey: String!, $attested: Boolean!) { receivePharmacyInventoryLot(productId: $productId, locationId: $locationId, supplierId: $supplierId, lotNumber: $lotNumber, serialNumber: $serialNumber, expirationDate: $expirationDate, quantity: $quantity, coldChainRequired: $coldChainRequired, minimumTemperatureC: $minimumTemperatureC, maximumTemperatureC: $maximumTemperatureC, coldChainEvidenceComplete: $coldChainEvidenceComplete, reason: $reason, idempotencyKey: $idempotencyKey, attested: $attested) { success reused movementId lotId quantityAvailable approvalId status } }`, input)
  return result(response, '/dashboard/platform/inventory').receivePharmacyInventoryLot
  })
}

export async function adjustInventoryAction(input: { lotId: string; targetQuantity: number; reason: string; idempotencyKey: string; attested: boolean }) {
  return guardAction(async () => {
  const response = await platformRequest<{ adjustPharmacyInventoryLot: InventoryActionResult }>(`mutation Adjust($lotId: ID!, $targetQuantity: Int!, $reason: String!, $idempotencyKey: String!, $attested: Boolean!) { adjustPharmacyInventoryLot(lotId: $lotId, targetQuantity: $targetQuantity, reason: $reason, idempotencyKey: $idempotencyKey, attested: $attested) { success reused movementId lotId quantityAvailable approvalId status } }`, input)
  return result(response, `/dashboard/platform/inventory/${input.lotId}`).adjustPharmacyInventoryLot
  })
}
