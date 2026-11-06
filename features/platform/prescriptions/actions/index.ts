'use server'

import { revalidatePath } from 'next/cache'
import { platformRequest } from '@/features/platform/lib/request'
import { ActionError, guardAction } from '@/features/platform/lib/action-result'

function result<T>(response: Awaited<ReturnType<typeof platformRequest<T>>>, path: string) {
  if (!response.success) throw new ActionError(response.error)
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

const prescriptionResultFields = 'success reused prescriptionId reviewId approvalId orderId orderNumber receiptItemTitle paymentId labelId status totalAmount cashReceivedAmount changeDueAmount currencyCode tenderMethod'

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
  return guardAction(async () => {
  const response = await platformRequest<{ intakePharmacyPrescription: PrescriptionActionResult }>(`mutation Intake($organizationId: ID!, $locationId: ID!, $patientId: ID!, $prescriberId: ID!, $prescriptionNumber: String!, $source: String!, $writtenAt: String!, $expiresAt: String!, $items: [PharmacyPrescriptionIntakeItemInput!]!, $reason: String!, $attested: Boolean!) { intakePharmacyPrescription(organizationId: $organizationId, locationId: $locationId, patientId: $patientId, prescriberId: $prescriberId, prescriptionNumber: $prescriptionNumber, source: $source, writtenAt: $writtenAt, expiresAt: $expiresAt, items: $items, reason: $reason, attested: $attested) { ${prescriptionResultFields} } }`, input)
  return result(response, '/dashboard/platform/prescriptions').intakePharmacyPrescription
  })
}

export async function reviewPrescriptionAction(input: { prescriptionId: string; decision: string; reason: string; attested: boolean }) {
  return guardAction(async () => {
  const response = await platformRequest<{ recordPrescriptionReview: PrescriptionActionResult }>(`mutation Review($prescriptionId: ID!, $decision: String!, $reason: String!, $attested: Boolean!) { recordPrescriptionReview(prescriptionId: $prescriptionId, decision: $decision, reason: $reason, attested: $attested) { ${prescriptionResultFields} } }`, input)
  return result(response, `/dashboard/platform/prescriptions/${input.prescriptionId}`).recordPrescriptionReview
  })
}

export async function authorizeDispensingAction(input: { prescriptionId: string; reason: string; attested: boolean }) {
  return guardAction(async () => {
  const response = await platformRequest<{ authorizePrescriptionDispensing: PrescriptionActionResult }>(`mutation Authorize($prescriptionId: ID!, $reason: String!, $attested: Boolean!) { authorizePrescriptionDispensing(prescriptionId: $prescriptionId, reason: $reason, attested: $attested) { ${prescriptionResultFields} } }`, input)
  return result(response, `/dashboard/platform/prescriptions/${input.prescriptionId}`).authorizePrescriptionDispensing
  })
}

export async function dispensePrescriptionAction(input: { prescriptionId: string; prescriptionItemId: string; lotId: string; quantity: number; cashReceivedAmount: number; auxiliaryWarnings: string[]; counselingOutcome: string; idempotencyKey: string; reason: string; attested: boolean; fillId?: string | null; expectedFillVersion?: number | null; hold?: boolean }) {
  return guardAction(async () => {
  const response = await platformRequest<{ recordPrescriptionDispensing: PrescriptionActionResult }>(`mutation Dispense($prescriptionId: ID!, $prescriptionItemId: ID!, $lotId: ID!, $quantity: Int!, $cashReceivedAmount: Int!, $auxiliaryWarnings: [String!]!, $counselingOutcome: String!, $idempotencyKey: String!, $reason: String!, $attested: Boolean!, $fillId: ID, $expectedFillVersion: Int, $hold: Boolean) { recordPrescriptionDispensing(prescriptionId: $prescriptionId, prescriptionItemId: $prescriptionItemId, lotId: $lotId, quantity: $quantity, cashReceivedAmount: $cashReceivedAmount, auxiliaryWarnings: $auxiliaryWarnings, counselingOutcome: $counselingOutcome, idempotencyKey: $idempotencyKey, reason: $reason, attested: $attested, fillId: $fillId, expectedFillVersion: $expectedFillVersion, hold: $hold) { ${prescriptionResultFields} } }`, input)
  return result(response, `/dashboard/platform/prescriptions/${input.prescriptionId}`).recordPrescriptionDispensing
  })
}

export async function pickupPrescriptionFillAction(input: { prescriptionId: string; fillId: string; expectedFillVersion: number; cashReceivedAmount: number; idempotencyKey: string; reason: string; attested: boolean; tenderMethod?: 'cash' | 'card'; paymentIntentId?: string | null }) {
  return guardAction(async () => {
  const response = await platformRequest<{ pickupPrescriptionFill: PrescriptionActionResult }>(`mutation Pickup($prescriptionId: ID!, $fillId: ID!, $expectedFillVersion: Int!, $cashReceivedAmount: Int!, $idempotencyKey: String!, $reason: String!, $attested: Boolean!, $tenderMethod: String, $paymentIntentId: String) { pickupPrescriptionFill(prescriptionId: $prescriptionId, fillId: $fillId, expectedFillVersion: $expectedFillVersion, cashReceivedAmount: $cashReceivedAmount, idempotencyKey: $idempotencyKey, reason: $reason, attested: $attested, tenderMethod: $tenderMethod, paymentIntentId: $paymentIntentId) { ${prescriptionResultFields} } }`, input)
  revalidatePath('/account')
  return result(response, `/dashboard/platform/prescriptions/${input.prescriptionId}`).pickupPrescriptionFill
  })
}

export async function returnFillToStockAction(input: { prescriptionId: string; fillId: string; expectedFillVersion: number; cause: string; idempotencyKey: string; reason: string; attested: boolean }) {
  return guardAction(async () => {
  const response = await platformRequest<{ returnPrescriptionFillToStock: { success: boolean; reused: boolean; fillId: string; status: string; version: number } }>(`mutation ReturnToStock($prescriptionId: ID!, $fillId: ID!, $expectedFillVersion: Int!, $cause: String!, $idempotencyKey: String!, $reason: String!, $attested: Boolean!) { returnPrescriptionFillToStock(prescriptionId: $prescriptionId, fillId: $fillId, expectedFillVersion: $expectedFillVersion, cause: $cause, idempotencyKey: $idempotencyKey, reason: $reason, attested: $attested) { success reused fillId status version } }`, input)
  revalidatePath('/account')
  return result(response, `/dashboard/platform/prescriptions/${input.prescriptionId}`).returnPrescriptionFillToStock
  })
}

export async function recordClinicalSafetyReviewAction(input: { prescriptionId: string; outcome: string; allergiesReviewed: boolean; medicationHistoryReviewed: boolean; interactionsReviewed: boolean; duplicateTherapyReviewed: boolean; contraindicationsReviewed: boolean; doseReviewed: boolean; counselingPlanReviewed: boolean; reviewReference: string; notes?: string; overrideReason?: string; idempotencyKey: string; reason: string; attested: boolean; fillId?: string | null; expectedFillVersion?: number | null }) {
  return guardAction(async () => {
  const response = await platformRequest<{ recordPrescriptionClinicalSafetyReview: { success: boolean; reused: boolean; reviewId: string; prescriptionId: string; outcome: string; approvalId: string } }>(`mutation SafetyReview($prescriptionId: ID!, $outcome: String!, $allergiesReviewed: Boolean!, $medicationHistoryReviewed: Boolean!, $interactionsReviewed: Boolean!, $duplicateTherapyReviewed: Boolean!, $contraindicationsReviewed: Boolean!, $doseReviewed: Boolean!, $counselingPlanReviewed: Boolean!, $reviewReference: String!, $notes: String, $overrideReason: String, $idempotencyKey: String!, $reason: String!, $attested: Boolean!, $fillId: ID, $expectedFillVersion: Int) { recordPrescriptionClinicalSafetyReview(prescriptionId: $prescriptionId, outcome: $outcome, allergiesReviewed: $allergiesReviewed, medicationHistoryReviewed: $medicationHistoryReviewed, interactionsReviewed: $interactionsReviewed, duplicateTherapyReviewed: $duplicateTherapyReviewed, contraindicationsReviewed: $contraindicationsReviewed, doseReviewed: $doseReviewed, counselingPlanReviewed: $counselingPlanReviewed, reviewReference: $reviewReference, notes: $notes, overrideReason: $overrideReason, idempotencyKey: $idempotencyKey, reason: $reason, attested: $attested, fillId: $fillId, expectedFillVersion: $expectedFillVersion) { success reused reviewId prescriptionId outcome approvalId } }`, input)
  return result(response, `/dashboard/platform/prescriptions/${input.prescriptionId}`).recordPrescriptionClinicalSafetyReview
  })
}

export async function holdPrescriptionForClinicalReReviewAction(input: { prescriptionId: string; reason: string; attested: boolean }) {
  return guardAction(async () => {
  const response = await platformRequest<{ holdPrescriptionForClinicalReReview: { success: boolean; reused: boolean; prescriptionId: string; status: string; approvalId: string } }>(`mutation HoldForClinicalReview($prescriptionId: ID!, $reason: String!, $attested: Boolean!) { holdPrescriptionForClinicalReReview(prescriptionId: $prescriptionId, reason: $reason, attested: $attested) { success reused prescriptionId status approvalId } }`, input)
  return result(response, `/dashboard/platform/prescriptions/${input.prescriptionId}`).holdPrescriptionForClinicalReReview
  })
}

export async function resolveRefillAction(input: { refillRequestId: string; prescriptionId: string; decision: string; reason: string; attested: boolean; expectedFillVersion?: number | null }) {
  return guardAction(async () => {
  const response = await platformRequest<{ resolvePrescriptionRefill: { success: boolean; reused: boolean; refillRequestId: string; status: string; approvalId?: string | null } }>(`mutation ResolveRefill($refillRequestId: ID!, $decision: String!, $reason: String!, $attested: Boolean!, $expectedFillVersion: Int) { resolvePrescriptionRefill(refillRequestId: $refillRequestId, decision: $decision, reason: $reason, attested: $attested, expectedFillVersion: $expectedFillVersion) { success reused refillRequestId status approvalId } }`, input)
  return result(response, `/dashboard/platform/prescriptions/${input.prescriptionId}`).resolvePrescriptionRefill
  })
}

export async function approveTransferAction(input: { transferId: string; prescriptionId: string; reason: string; attested: boolean }) {
  return guardAction(async () => {
  const response = await platformRequest<{ approvePrescriptionTransfer: { success: boolean; reused: boolean; transferId: string; status: string; approvalId?: string | null } }>(`mutation ApproveTransfer($transferId: ID!, $reason: String!, $attested: Boolean!) { approvePrescriptionTransfer(transferId: $transferId, reason: $reason, attested: $attested) { success reused transferId status approvalId } }`, input)
  return result(response, `/dashboard/platform/prescriptions/${input.prescriptionId}`).approvePrescriptionTransfer
  })
}

export async function requestRefillAction(input: { prescriptionId: string; prescriptionItemId: string; patientId: string; locationId: string; note?: string; idempotencyKey: string; expectedItemVersion?: string | null }) {
  return guardAction(async () => {
  const response = await platformRequest<{ requestPrescriptionRefill: { success: boolean; reused?: boolean | null; refillRequestId: string; status: string } }>(`mutation Refill($prescriptionId: ID!, $prescriptionItemId: ID!, $patientId: ID!, $locationId: ID!, $note: String, $idempotencyKey: String!, $expectedItemVersion: String) { requestPrescriptionRefill(prescriptionId: $prescriptionId, prescriptionItemId: $prescriptionItemId, patientId: $patientId, locationId: $locationId, note: $note, idempotencyKey: $idempotencyKey, expectedItemVersion: $expectedItemVersion) { success reused refillRequestId status } }`, input)
  return result(response, '/account').requestPrescriptionRefill
  })
}

export async function requestTransferOutAction(input: { prescriptionId: string; patientId: string; counterpartyName: string; counterpartyPhone: string; consentAccepted: boolean; idempotencyKey: string }) {
  return guardAction(async () => {
  const { TRANSFER_CONSENT } = await import('@/features/keystone/mutations/patientWorkflows')
  const response = await platformRequest<{ requestPrescriptionTransfer: { success: boolean } }>(
    'mutation TransferOut($prescriptionId: ID!, $patientId: ID!, $direction: String!, $counterpartyName: String!, $counterpartyPhone: String, $consentAccepted: Boolean!, $policyVersion: String!, $statementKey: String!, $idempotencyKey: String!) { requestPrescriptionTransfer(prescriptionId: $prescriptionId, patientId: $patientId, direction: $direction, counterpartyName: $counterpartyName, counterpartyPhone: $counterpartyPhone, consentAccepted: $consentAccepted, policyVersion: $policyVersion, statementKey: $statementKey, idempotencyKey: $idempotencyKey) { success } }',
    { ...input, direction: 'outbound', ...TRANSFER_CONSENT },
  )
  if (!response.success) return { success: false as const, error: response.error }
  revalidatePath(`/dashboard/platform/prescriptions/${input.prescriptionId}`)
  return { success: true as const }
  })
}

export async function openPickupCardPaymentAction(input: { prescriptionId: string; fillId: string; idempotencyKey: string }) {
  return guardAction(async () => {
    const response = await platformRequest<{ openPrescriptionPickupCardPayment: { clientSecret: string; paymentIntentId: string; amount: number; currencyCode: string } }>(`mutation PickupCard($prescriptionId: ID!, $fillId: ID!, $idempotencyKey: String!) { openPrescriptionPickupCardPayment(prescriptionId: $prescriptionId, fillId: $fillId, idempotencyKey: $idempotencyKey) { clientSecret paymentIntentId amount currencyCode } }`, input)
    if (!response.success) throw new ActionError(response.error)
    return response.data.openPrescriptionPickupCardPayment
  })
}
