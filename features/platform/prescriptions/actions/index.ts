'use server'

import { revalidatePath } from 'next/cache'
import { keystoneClient } from '@/features/dashboard/lib/keystoneClient'

function result<T>(response: Awaited<ReturnType<typeof keystoneClient<T>>>, path: string) {
  if (!response.success) throw new Error(response.error)
  revalidatePath(path)
  return response.data
}

type PrescriptionActionResult = {
  success: boolean
  reused?: boolean | null
  prescriptionId?: string | null
  reviewId?: string | null
  approvalId?: string | null
  orderId?: string | null
  orderNumber?: string | null
  receiptItemTitle?: string | null
  paymentId?: string | null
  labelId?: string | null
  status?: string | null
  totalAmount?: number | null
  cashReceivedAmount?: number | null
  changeDueAmount?: number | null
  currencyCode?: string | null
}

const prescriptionResultFields = 'success reused prescriptionId reviewId approvalId orderId orderNumber receiptItemTitle paymentId labelId status totalAmount cashReceivedAmount changeDueAmount currencyCode'

export async function intakePrescriptionAction(input: {
  organizationId: string
  locationId: string
  patientId: string
  prescriberId: string
  prescriptionNumber: string
  source: string
  writtenAt: string
  expiresAt: string
  items: Array<{ productId: string; medicationName: string; sig: string; quantity: number; daysSupply?: number; refillsAuthorized: number; substitutionAllowed: boolean }>
  reason: string
  attested: boolean
}) {
  const response = await keystoneClient<{ intakePharmacyPrescription: PrescriptionActionResult }>(`mutation Intake($organizationId: ID!, $locationId: ID!, $patientId: ID!, $prescriberId: ID!, $prescriptionNumber: String!, $source: String!, $writtenAt: String!, $expiresAt: String!, $items: [PharmacyPrescriptionIntakeItemInput!]!, $reason: String!, $attested: Boolean!) { intakePharmacyPrescription(organizationId: $organizationId, locationId: $locationId, patientId: $patientId, prescriberId: $prescriberId, prescriptionNumber: $prescriptionNumber, source: $source, writtenAt: $writtenAt, expiresAt: $expiresAt, items: $items, reason: $reason, attested: $attested) { ${prescriptionResultFields} } }`, input)
  return result(response, '/dashboard/platform/prescriptions').intakePharmacyPrescription
}

export async function reviewPrescriptionAction(input: { prescriptionId: string; decision: string; reason: string; attested: boolean }) {
  const response = await keystoneClient<{ recordPrescriptionReview: PrescriptionActionResult }>(`mutation Review($prescriptionId: ID!, $decision: String!, $reason: String!, $attested: Boolean!) { recordPrescriptionReview(prescriptionId: $prescriptionId, decision: $decision, reason: $reason, attested: $attested) { ${prescriptionResultFields} } }`, input)
  return result(response, `/dashboard/platform/prescriptions/${input.prescriptionId}`).recordPrescriptionReview
}

export async function authorizeDispensingAction(input: { prescriptionId: string; reason: string; attested: boolean }) {
  const response = await keystoneClient<{ authorizePrescriptionDispensing: PrescriptionActionResult }>(`mutation Authorize($prescriptionId: ID!, $reason: String!, $attested: Boolean!) { authorizePrescriptionDispensing(prescriptionId: $prescriptionId, reason: $reason, attested: $attested) { ${prescriptionResultFields} } }`, input)
  return result(response, `/dashboard/platform/prescriptions/${input.prescriptionId}`).authorizePrescriptionDispensing
}

export async function dispensePrescriptionAction(input: { prescriptionId: string; prescriptionItemId: string; lotId: string; quantity: number; cashReceivedAmount: number; auxiliaryWarnings: string[]; counselingOutcome: string; idempotencyKey: string; reason: string; attested: boolean; fillId?: string | null; expectedFillVersion?: number | null }) {
  const response = await keystoneClient<{ recordPrescriptionDispensing: PrescriptionActionResult }>(`mutation Dispense($prescriptionId: ID!, $prescriptionItemId: ID!, $lotId: ID!, $quantity: Int!, $cashReceivedAmount: Int!, $auxiliaryWarnings: [String!]!, $counselingOutcome: String!, $idempotencyKey: String!, $reason: String!, $attested: Boolean!, $fillId: ID, $expectedFillVersion: Int) { recordPrescriptionDispensing(prescriptionId: $prescriptionId, prescriptionItemId: $prescriptionItemId, lotId: $lotId, quantity: $quantity, cashReceivedAmount: $cashReceivedAmount, auxiliaryWarnings: $auxiliaryWarnings, counselingOutcome: $counselingOutcome, idempotencyKey: $idempotencyKey, reason: $reason, attested: $attested, fillId: $fillId, expectedFillVersion: $expectedFillVersion) { ${prescriptionResultFields} } }`, input)
  return result(response, `/dashboard/platform/prescriptions/${input.prescriptionId}`).recordPrescriptionDispensing
}

export async function recordClinicalSafetyReviewAction(input: { prescriptionId: string; outcome: string; allergiesReviewed: boolean; medicationHistoryReviewed: boolean; interactionsReviewed: boolean; duplicateTherapyReviewed: boolean; contraindicationsReviewed: boolean; doseReviewed: boolean; counselingPlanReviewed: boolean; reviewReference: string; notes?: string; overrideReason?: string; idempotencyKey: string; reason: string; attested: boolean; fillId?: string | null; expectedFillVersion?: number | null }) {
  const response = await keystoneClient<{ recordPrescriptionClinicalSafetyReview: { success: boolean; reused: boolean; reviewId: string; prescriptionId: string; outcome: string; approvalId: string } }>(`mutation SafetyReview($prescriptionId: ID!, $outcome: String!, $allergiesReviewed: Boolean!, $medicationHistoryReviewed: Boolean!, $interactionsReviewed: Boolean!, $duplicateTherapyReviewed: Boolean!, $contraindicationsReviewed: Boolean!, $doseReviewed: Boolean!, $counselingPlanReviewed: Boolean!, $reviewReference: String!, $notes: String, $overrideReason: String, $idempotencyKey: String!, $reason: String!, $attested: Boolean!, $fillId: ID, $expectedFillVersion: Int) { recordPrescriptionClinicalSafetyReview(prescriptionId: $prescriptionId, outcome: $outcome, allergiesReviewed: $allergiesReviewed, medicationHistoryReviewed: $medicationHistoryReviewed, interactionsReviewed: $interactionsReviewed, duplicateTherapyReviewed: $duplicateTherapyReviewed, contraindicationsReviewed: $contraindicationsReviewed, doseReviewed: $doseReviewed, counselingPlanReviewed: $counselingPlanReviewed, reviewReference: $reviewReference, notes: $notes, overrideReason: $overrideReason, idempotencyKey: $idempotencyKey, reason: $reason, attested: $attested, fillId: $fillId, expectedFillVersion: $expectedFillVersion) { success reused reviewId prescriptionId outcome approvalId } }`, input)
  return result(response, `/dashboard/platform/prescriptions/${input.prescriptionId}`).recordPrescriptionClinicalSafetyReview
}

export async function holdPrescriptionForClinicalReReviewAction(input: { prescriptionId: string; reason: string; attested: boolean }) {
  const response = await keystoneClient<{ holdPrescriptionForClinicalReReview: { success: boolean; reused: boolean; prescriptionId: string; status: string; approvalId: string } }>(`mutation HoldForClinicalReview($prescriptionId: ID!, $reason: String!, $attested: Boolean!) { holdPrescriptionForClinicalReReview(prescriptionId: $prescriptionId, reason: $reason, attested: $attested) { success reused prescriptionId status approvalId } }`, input)
  return result(response, `/dashboard/platform/prescriptions/${input.prescriptionId}`).holdPrescriptionForClinicalReReview
}

export async function resolveRefillAction(input: { refillRequestId: string; prescriptionId: string; decision: string; reason: string; attested: boolean; expectedFillVersion?: number | null }) {
  const response = await keystoneClient<{ resolvePrescriptionRefill: { success: boolean; reused: boolean; refillRequestId: string; status: string; approvalId?: string | null } }>(`mutation ResolveRefill($refillRequestId: ID!, $decision: String!, $reason: String!, $attested: Boolean!, $expectedFillVersion: Int) { resolvePrescriptionRefill(refillRequestId: $refillRequestId, decision: $decision, reason: $reason, attested: $attested, expectedFillVersion: $expectedFillVersion) { success reused refillRequestId status approvalId } }`, input)
  return result(response, `/dashboard/platform/prescriptions/${input.prescriptionId}`).resolvePrescriptionRefill
}

export async function approveTransferAction(input: { transferId: string; prescriptionId: string; reason: string; attested: boolean }) {
  const response = await keystoneClient<{ approvePrescriptionTransfer: { success: boolean; reused: boolean; transferId: string; status: string; approvalId?: string | null } }>(`mutation ApproveTransfer($transferId: ID!, $reason: String!, $attested: Boolean!) { approvePrescriptionTransfer(transferId: $transferId, reason: $reason, attested: $attested) { success reused transferId status approvalId } }`, input)
  return result(response, `/dashboard/platform/prescriptions/${input.prescriptionId}`).approvePrescriptionTransfer
}

export async function requestRefillAction(input: { prescriptionId: string; prescriptionItemId: string; patientId: string; locationId: string; note?: string; idempotencyKey: string; expectedItemVersion?: string | null }) {
  const response = await keystoneClient<{ requestPrescriptionRefill: { success: boolean; reused?: boolean | null; refillRequestId: string; status: string } }>(`mutation Refill($prescriptionId: ID!, $prescriptionItemId: ID!, $patientId: ID!, $locationId: ID!, $note: String, $idempotencyKey: String!, $expectedItemVersion: String) { requestPrescriptionRefill(prescriptionId: $prescriptionId, prescriptionItemId: $prescriptionItemId, patientId: $patientId, locationId: $locationId, note: $note, idempotencyKey: $idempotencyKey, expectedItemVersion: $expectedItemVersion) { success reused refillRequestId status } }`, input)
  return result(response, '/account').requestPrescriptionRefill
}
