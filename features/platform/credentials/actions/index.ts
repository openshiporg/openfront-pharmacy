'use server'

import { revalidatePath } from 'next/cache'
import { keystoneClient } from '@/features/dashboard/lib/keystoneClient'

function result<T>(response: Awaited<ReturnType<typeof keystoneClient<T>>>, path: string) {
  if (!response.success) throw new Error(response.error)
  revalidatePath(path)
  return response.data
}

type CredentialReviewInput = { credentialType: string; jurisdiction: string; identifier: string; expiresAt: string; verificationReference: string; reason: string; attested: boolean }

export async function recordStaffCredentialReviewAction(input: CredentialReviewInput & { membershipId: string }) {
  const response = await keystoneClient<{ recordPharmacyStaffCredentialReview: { success: boolean; membershipId: string; status: string; expiresAt: string; approvalId: string } }>(`mutation ReviewStaffCredential($membershipId: ID!, $credentialType: String!, $jurisdiction: String!, $identifier: String!, $expiresAt: String!, $verificationReference: String!, $reason: String!, $attested: Boolean!) { recordPharmacyStaffCredentialReview(membershipId: $membershipId, credentialType: $credentialType, jurisdiction: $jurisdiction, identifier: $identifier, expiresAt: $expiresAt, verificationReference: $verificationReference, reason: $reason, attested: $attested) { success membershipId status expiresAt approvalId } }`, input)
  return result(response, '/dashboard/platform/credentials').recordPharmacyStaffCredentialReview
}

export async function recordPrescriberCredentialReviewAction(input: CredentialReviewInput & { prescriberId: string }) {
  const response = await keystoneClient<{ recordPharmacyPrescriberCredentialReview: { success: boolean; prescriberId: string; status: string; expiresAt: string; approvalId: string } }>(`mutation ReviewPrescriberCredential($prescriberId: ID!, $credentialType: String!, $jurisdiction: String!, $identifier: String!, $expiresAt: String!, $verificationReference: String!, $reason: String!, $attested: Boolean!) { recordPharmacyPrescriberCredentialReview(prescriberId: $prescriberId, credentialType: $credentialType, jurisdiction: $jurisdiction, identifier: $identifier, expiresAt: $expiresAt, verificationReference: $verificationReference, reason: $reason, attested: $attested) { success prescriberId status expiresAt approvalId } }`, input)
  return result(response, '/dashboard/platform/credentials').recordPharmacyPrescriberCredentialReview
}

export async function recordDrugReferenceReviewAction(input: { organizationId: string; drugReferenceId: string; marketingStatus: string; controlledSchedule: string; sourceName: string; sourceVersion: string; sourceReference: string; reason: string; attested: boolean }) {
  const response = await keystoneClient<{ recordPharmacyDrugReferenceReview: { success: boolean; reused: boolean; reviewId: string; status: string; approvalId: string } }>(`mutation ReviewDrug($organizationId: ID!, $drugReferenceId: ID!, $marketingStatus: String!, $controlledSchedule: String!, $sourceName: String!, $sourceVersion: String!, $sourceReference: String!, $reason: String!, $attested: Boolean!) { recordPharmacyDrugReferenceReview(organizationId: $organizationId, drugReferenceId: $drugReferenceId, marketingStatus: $marketingStatus, controlledSchedule: $controlledSchedule, sourceName: $sourceName, sourceVersion: $sourceVersion, sourceReference: $sourceReference, reason: $reason, attested: $attested) { success reused reviewId status approvalId } }`, input)
  return result(response, '/dashboard/platform/credentials').recordPharmacyDrugReferenceReview
}

export async function recordCashPolicyAction(input: { organizationId: string; taxRateBps: number; policyReference: string; reason: string; attested: boolean }) {
  const response = await keystoneClient<{ recordPharmacyCashPolicy: { success: boolean; organizationId: string; status: string; taxRateBps: number; approvalId: string } }>(`mutation CashPolicy($organizationId: ID!, $taxRateBps: Int!, $policyReference: String!, $reason: String!, $attested: Boolean!) { recordPharmacyCashPolicy(organizationId: $organizationId, taxRateBps: $taxRateBps, policyReference: $policyReference, reason: $reason, attested: $attested) { success organizationId status taxRateBps approvalId } }`, input)
  return result(response, '/dashboard/platform/credentials').recordPharmacyCashPolicy
}
