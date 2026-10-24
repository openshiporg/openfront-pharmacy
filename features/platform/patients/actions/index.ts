'use server'

import { revalidatePath } from 'next/cache'
import { keystoneClient } from '@/features/dashboard/lib/keystoneClient'

function result<T>(response: Awaited<ReturnType<typeof keystoneClient<T>>>, path: string) {
  if (!response.success) throw new Error(response.error)
  revalidatePath(path)
  return response.data
}

export async function createPatientAction(input: { organizationId: string; patientNumber: string; firstName: string; lastName: string; dateOfBirth: string; email?: string; phone?: string; preferredContactMethod: string; address?: Record<string, unknown>; identityMethod: string; identityReference: string; reason: string; attested: boolean }) {
  const response = await keystoneClient<{ createPharmacyPatient: { success: boolean; reused: boolean; patientId: string; patientNumber: string; status: string } }>(`mutation CreatePatient($organizationId: ID!, $patientNumber: String!, $firstName: String!, $lastName: String!, $dateOfBirth: String!, $email: String, $phone: String, $preferredContactMethod: String!, $address: JSON, $identityMethod: String!, $identityReference: String!, $reason: String!, $attested: Boolean!) { createPharmacyPatient(organizationId: $organizationId, patientNumber: $patientNumber, firstName: $firstName, lastName: $lastName, dateOfBirth: $dateOfBirth, email: $email, phone: $phone, preferredContactMethod: $preferredContactMethod, address: $address, identityMethod: $identityMethod, identityReference: $identityReference, reason: $reason, attested: $attested) { success reused patientId patientNumber status } }`, input)
  return result(response, '/dashboard/platform/patients').createPharmacyPatient
}

export async function recordPatientAllergyAction(input: { patientId: string; allergen: string; reaction: string; severity: string; source: string; sourceReference: string; idempotencyKey: string; reason: string; attested: boolean }) {
  const response = await keystoneClient<{ recordPharmacyPatientAllergy: { success: boolean; reused: boolean; recordId: string; status: string } }>(`mutation Allergy($patientId: ID!, $allergen: String!, $reaction: String!, $severity: String!, $source: String!, $sourceReference: String!, $idempotencyKey: String!, $reason: String!, $attested: Boolean!) { recordPharmacyPatientAllergy(patientId: $patientId, allergen: $allergen, reaction: $reaction, severity: $severity, source: $source, sourceReference: $sourceReference, idempotencyKey: $idempotencyKey, reason: $reason, attested: $attested) { success reused recordId status } }`, input)
  return result(response, `/dashboard/platform/patients/${input.patientId}`).recordPharmacyPatientAllergy
}

export async function recordPatientMedicationAction(input: { patientId: string; medicationName: string; directions?: string; source: string; sourceReference: string; idempotencyKey: string; reason: string; attested: boolean }) {
  const response = await keystoneClient<{ recordPharmacyPatientMedication: { success: boolean; reused: boolean; recordId: string; status: string } }>(`mutation Medication($patientId: ID!, $medicationName: String!, $directions: String, $source: String!, $sourceReference: String!, $idempotencyKey: String!, $reason: String!, $attested: Boolean!) { recordPharmacyPatientMedication(patientId: $patientId, medicationName: $medicationName, directions: $directions, source: $source, sourceReference: $sourceReference, idempotencyKey: $idempotencyKey, reason: $reason, attested: $attested) { success reused recordId status } }`, input)
  return result(response, `/dashboard/platform/patients/${input.patientId}`).recordPharmacyPatientMedication
}

export async function linkPatientAccountAction(input: { patientId: string; userId: string }) {
  const response = await keystoneClient<{ linkPharmacyPatientAccount: { success: boolean; reused?: boolean | null; patientId: string; userId: string } }>(`mutation Link($patientId: ID!, $userId: ID!) { linkPharmacyPatientAccount(patientId: $patientId, userId: $userId) { success reused patientId userId } }`, input)
  return result(response, `/dashboard/platform/patients/${input.patientId}`).linkPharmacyPatientAccount
}

export async function updatePatientContactAction(input: { patientId: string; email: string; phone: string; preferredContactMethod: string; address: Record<string, string> | null; idempotencyKey: string; reason: string; attested: boolean }) {
  const response = await keystoneClient<{ updatePharmacyPatientContact: { success: boolean } }>(
    'mutation PatientContact($patientId: ID!, $email: String, $phone: String, $preferredContactMethod: String!, $address: JSON, $idempotencyKey: String!, $reason: String!, $attested: Boolean!) { updatePharmacyPatientContact(patientId: $patientId, email: $email, phone: $phone, preferredContactMethod: $preferredContactMethod, address: $address, idempotencyKey: $idempotencyKey, reason: $reason, attested: $attested) { success } }',
    input,
  )
  if (!response.success) return { success: false as const, error: response.error }
  revalidatePath(`/dashboard/platform/patients/${input.patientId}`)
  return { success: true as const }
}
