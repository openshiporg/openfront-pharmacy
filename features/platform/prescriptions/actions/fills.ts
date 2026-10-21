'use server'
import { revalidatePath } from 'next/cache'
import { keystoneClient } from '@/features/dashboard/lib/keystoneClient'
import { fillWorkbenchSelection, type PharmacyFillWorkbench } from '@/features/pharmacy/fills'

type Result = { success: boolean; reused: boolean; fillId?: string | null; status: string; version?: number | null }
const fields = 'success reused fillId status version'
async function readResult(response: any, prescriptionId: string, operation: string): Promise<Result> {
  if (!response.success) throw new Error(response.error)
  revalidatePath('/account')
  revalidatePath('/dashboard/platform/prescriptions')
  revalidatePath('/dashboard/platform/credentials')
  if (prescriptionId) revalidatePath(`/dashboard/platform/prescriptions/${prescriptionId}`)
  return response.data[operation]
}
export async function reserveFillAction(input: { prescriptionId: string; prescriptionItemId: string; expectedItemVersion: string; idempotencyKey: string; reason: string; attested: boolean }) {
  const operation = 'reservePharmacyPrescriptionFill'
  return readResult(await keystoneClient(`mutation ReserveFill($prescriptionId: ID!, $prescriptionItemId: ID!, $expectedItemVersion: String!, $idempotencyKey: String!, $reason: String!, $attested: Boolean!) { reservePharmacyPrescriptionFill(prescriptionId: $prescriptionId, prescriptionItemId: $prescriptionItemId, expectedItemVersion: $expectedItemVersion, idempotencyKey: $idempotencyKey, reason: $reason, attested: $attested) { ${fields} } }`, input), input.prescriptionId, operation)
}
export async function releaseFillAction(input: { prescriptionId: string; fillId: string; expectedVersion: number; cause: string; idempotencyKey: string; reason: string; attested: boolean }) {
  const operation = 'releasePharmacyPrescriptionFill'
  return readResult(await keystoneClient(`mutation ReleaseFill($prescriptionId: ID!, $fillId: ID!, $expectedVersion: Int!, $cause: String!, $idempotencyKey: String!, $reason: String!, $attested: Boolean!) { releasePharmacyPrescriptionFill(prescriptionId: $prescriptionId, fillId: $fillId, expectedVersion: $expectedVersion, cause: $cause, idempotencyKey: $idempotencyKey, reason: $reason, attested: $attested) { ${fields} } }`, input), input.prescriptionId, operation)
}
export async function recordFillPolicyAction(input: { prescriptionId: string; organizationId: string; policy: { version: string; reference: string; consumeOn: string; allowPartial: boolean; reservationMinutes: number; releaseReasons: string[] }; idempotencyKey: string; reason: string; attested: boolean }) {
  const operation = 'recordPharmacyFillPolicy'
  return readResult(await keystoneClient(`mutation FillPolicy($organizationId: ID!, $policy: JSON!, $idempotencyKey: String!, $reason: String!, $attested: Boolean!) { recordPharmacyFillPolicy(organizationId: $organizationId, policy: $policy, idempotencyKey: $idempotencyKey, reason: $reason, attested: $attested) { ${fields} } }`, input), input.prescriptionId, operation)
}
export async function loadFillPolicyAction(organizationId: string) {
  const response = await keystoneClient<{ pharmacyFillPolicy: { organizationId: string; configured: boolean; version?: string | null } }>(`query FillPolicyReadback($organizationId: ID!) { pharmacyFillPolicy(organizationId: $organizationId) { organizationId configured version } }`, { organizationId })
  if (!response.success) throw new Error(response.error)
  return response.data.pharmacyFillPolicy
}
export async function loadFillPageAction(input: { prescriptionId: string; after?: string | null }) {
  const response = await keystoneClient<{ pharmacyFillWorkbench: PharmacyFillWorkbench }>(`query Fills($prescriptionId: ID!, $after: String) { pharmacyFillWorkbench(prescriptionId: $prescriptionId, after: $after) { ${fillWorkbenchSelection} } }`, input)
  if (!response.success) throw new Error(response.error)
  return response.data.pharmacyFillWorkbench
}
