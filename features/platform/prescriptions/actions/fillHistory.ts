'use server'
import { keystoneClient } from '@/features/dashboard/lib/keystoneClient'
import type { PharmacyFill } from '@/features/pharmacy/fills'
export async function loadFillHistoryAction(input: { prescriptionId: string; fillId: string; after?: string | null }) {
  const response = await keystoneClient<{ pharmacyFillHistory: { events: PharmacyFill['events']; hasMore: boolean; nextCursor?: string | null } }>(`query FillHistory($prescriptionId: ID!, $fillId: ID!, $after: String) { pharmacyFillHistory(prescriptionId: $prescriptionId, fillId: $fillId, after: $after) { events { id action version quantity occurredAt actorName reason orderId orderNumber } hasMore nextCursor } }`, input)
  if (!response.success) throw new Error(response.error)
  return response.data.pharmacyFillHistory
}
