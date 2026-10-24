'use server'
import { platformRequest } from '@/features/platform/lib/request'
import { ActionError, guardAction } from '@/features/platform/lib/action-result'
import type { PharmacyFill } from '@/features/pharmacy/fills'
export async function loadFillHistoryAction(input: { prescriptionId: string; fillId: string; after?: string | null }) {
  return guardAction(async () => {
  const response = await platformRequest<{ pharmacyFillHistory: { events: PharmacyFill['events']; hasMore: boolean; nextCursor?: string | null } }>(`query FillHistory($prescriptionId: ID!, $fillId: ID!, $after: String) { pharmacyFillHistory(prescriptionId: $prescriptionId, fillId: $fillId, after: $after) { events { id action version quantity occurredAt actorName reason orderId orderNumber } hasMore nextCursor } }`, input)
  if (!response.success) throw new ActionError(response.error)
  return response.data.pharmacyFillHistory
  })
}
