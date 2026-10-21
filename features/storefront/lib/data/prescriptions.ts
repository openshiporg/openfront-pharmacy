'use server'

import { revalidatePath } from 'next/cache'

import { storefrontRequest, type StorefrontResult } from '../storefront-client'

export type RefillRequestInput = { prescriptionId: string; prescriptionItemId: string; patientId: string; locationId: string; note?: string; idempotencyKey: string; expectedItemVersion?: string | null }

export async function requestRefill(input: RefillRequestInput): Promise<StorefrontResult<{ status: string }>> {
  const response = await storefrontRequest<{ requestPrescriptionRefill: { status: string } }>(
    'mutation StorefrontRequestRefill($prescriptionId: ID!, $prescriptionItemId: ID!, $patientId: ID!, $locationId: ID!, $note: String, $idempotencyKey: String!, $expectedItemVersion: String) { requestPrescriptionRefill(prescriptionId: $prescriptionId, prescriptionItemId: $prescriptionItemId, patientId: $patientId, locationId: $locationId, note: $note, idempotencyKey: $idempotencyKey, expectedItemVersion: $expectedItemVersion) { status } }',
    input,
    'Refill request failed. Try again.',
  )
  if (!response.success) return response
  revalidatePath('/account')
  return { success: true, data: { status: response.data.requestPrescriptionRefill.status } }
}
