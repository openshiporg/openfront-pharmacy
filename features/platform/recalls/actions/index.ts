'use server'

import { revalidatePath } from 'next/cache'
import { platformRequest } from '@/features/platform/lib/request'
import { ActionError, guardAction } from '@/features/platform/lib/action-result'

function result<T>(response: Awaited<ReturnType<typeof platformRequest<T>>>, path: string) {
  if (!response.success) throw new ActionError(response.error)
  revalidatePath(path)
  return response.data
}

export async function openRecallAction(input: { organizationId: string; locationId?: string; recallNumber: string; classification: string; reason: string; source: string; sourceReference: string; lotIds: string[]; attested: boolean }) {
  return guardAction(async () => {
  const response = await platformRequest<{ openPharmacyRecall: { success: boolean; reused: boolean; recallId: string; lotCount: number; unlinkedExposureCount: number; approvalId?: string | null; status: string } }>(`mutation OpenRecall($organizationId: ID!, $locationId: ID, $recallNumber: String!, $classification: String!, $reason: String!, $source: String!, $sourceReference: String!, $lotIds: [ID!]!, $attested: Boolean!) { openPharmacyRecall(organizationId: $organizationId, locationId: $locationId, recallNumber: $recallNumber, classification: $classification, reason: $reason, source: $source, sourceReference: $sourceReference, lotIds: $lotIds, attested: $attested) { success reused recallId lotCount unlinkedExposureCount approvalId status } }`, input)
  return result(response, '/dashboard/platform/recalls').openPharmacyRecall
  })
}

export async function recordRecallExposureAction(input: { recallId: string; exposureId: string; status: string; contactMethod: string; outcome: string; notes?: string; reason: string; attested: boolean }) {
  return guardAction(async () => {
  const response = await platformRequest<{ recordRecallExposureAction: { success: boolean; reused: boolean; exposureId: string; status: string; approvalId: string } }>(`mutation Exposure($exposureId: ID!, $status: String!, $contactMethod: String!, $outcome: String!, $notes: String, $reason: String!, $attested: Boolean!) { recordRecallExposureAction(exposureId: $exposureId, status: $status, contactMethod: $contactMethod, outcome: $outcome, notes: $notes, reason: $reason, attested: $attested) { success reused exposureId status approvalId } }`, input)
  return result(response, `/dashboard/platform/recalls/${input.recallId}`).recordRecallExposureAction
  })
}

export async function disposeRecallLotAction(input: { recallId: string; lotId: string; quantity: number; dispositionReference: string; idempotencyKey: string; reason: string; attested: boolean }) {
  return guardAction(async () => {
  const response = await platformRequest<{ disposeRecallLot: { success: boolean; reused: boolean; recallId: string; lotId: string; movementId: string; status: string } }>(`mutation DisposeRecallLot($recallId: ID!, $lotId: ID!, $quantity: Int!, $dispositionReference: String!, $idempotencyKey: String!, $reason: String!, $attested: Boolean!) { disposeRecallLot(recallId: $recallId, lotId: $lotId, quantity: $quantity, dispositionReference: $dispositionReference, idempotencyKey: $idempotencyKey, reason: $reason, attested: $attested) { success reused recallId lotId movementId status } }`, input)
  return result(response, `/dashboard/platform/recalls/${input.recallId}`).disposeRecallLot
  })
}

export async function closeRecallAction(input: { recallId: string; reason: string; attested: boolean }) {
  return guardAction(async () => {
  const response = await platformRequest<{ closePharmacyRecall: { success: boolean; reused: boolean; recallId: string; status: string; approvalId: string } }>(`mutation CloseRecall($recallId: ID!, $reason: String!, $attested: Boolean!) { closePharmacyRecall(recallId: $recallId, reason: $reason, attested: $attested) { success reused recallId status approvalId } }`, input)
  return result(response, `/dashboard/platform/recalls/${input.recallId}`).closePharmacyRecall
  })
}

export async function quarantineRecallAction(input: { recallId: string; reason: string; attested: boolean }) {
  return guardAction(async () => {
  const response = await platformRequest<{ quarantineRecallLots: { success: boolean; reused?: boolean | null; recallId: string; lotCount: number; approvalId?: string | null; status: string } }>(`mutation Quarantine($recallId: ID!, $reason: String!, $attested: Boolean!) { quarantineRecallLots(recallId: $recallId, reason: $reason, attested: $attested) { success reused recallId lotCount approvalId status } }`, input)
  return result(response, `/dashboard/platform/recalls/${input.recallId}`).quarantineRecallLots
  })
}
