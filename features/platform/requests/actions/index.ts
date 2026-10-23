'use server'

import { revalidatePath } from 'next/cache'
import { keystoneClient } from '@/features/dashboard/lib/keystoneClient'

export async function resolvePrescriptionRequestAction(input: { requestId: string; status: 'in_review' | 'completed' | 'declined'; note: string }) {
  const response = await keystoneClient<{ resolvePharmacyPrescriptionRequest: { id: string; status: string } }>(
    'mutation Resolve($requestId: ID!, $status: String!, $note: String) { resolvePharmacyPrescriptionRequest(requestId: $requestId, status: $status, note: $note) { id status } }',
    input,
  )
  if (!response.success) return { success: false as const, error: response.error }
  revalidatePath('/dashboard/platform/requests')
  return { success: true as const, status: response.data.resolvePharmacyPrescriptionRequest.status }
}
