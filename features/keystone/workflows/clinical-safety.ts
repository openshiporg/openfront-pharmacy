export type DrugReferenceEvidence = {
  sourceVerified?: boolean | null
  marketingStatus?: string | null
  controlledSchedule?: string | null
  sourceName?: string | null
  sourceVersion?: string | null
  sourceReference?: string | null
  reviewedAt?: string | Date | null
}

export type SafetyReviewEvidence = {
  fillNumber?: number | null
  outcome?: string | null
  allergiesReviewed?: boolean | null
  medicationHistoryReviewed?: boolean | null
  interactionsReviewed?: boolean | null
  duplicateTherapyReviewed?: boolean | null
  contraindicationsReviewed?: boolean | null
  doseReviewed?: boolean | null
  counselingPlanReviewed?: boolean | null
  reviewReference?: string | null
  overrideReason?: string | null
  reviewedAt?: string | Date | null
}

export function assertDrugReferenceEligibleForBoundedDispensing(input: DrugReferenceEvidence) {
  if (input.sourceVerified !== true || input.marketingStatus !== 'active' || input.controlledSchedule !== 'none') {
    throw new Error('A current operator-reviewed, active, non-controlled drug reference is required')
  }
  if (!input.sourceName?.trim() || !input.sourceVersion?.trim() || !input.sourceReference?.trim() || !input.reviewedAt || Number.isNaN(new Date(input.reviewedAt).getTime())) {
    throw new Error('Drug reference provenance evidence is incomplete')
  }
}

export function isHumanSafetyReviewStale(input: SafetyReviewEvidence | null | undefined, expectedFillNumber: number, latestEvidenceChange?: string | Date | null) {
  if (!input || input.fillNumber !== expectedFillNumber || !['clear', 'override'].includes(input.outcome || '') || !input.reviewedAt || !latestEvidenceChange) return false
  const reviewedAt = new Date(input.reviewedAt).getTime()
  const evidenceChangedAt = new Date(latestEvidenceChange).getTime()
  return Number.isFinite(reviewedAt) && Number.isFinite(evidenceChangedAt) && evidenceChangedAt > reviewedAt
}

export function assertCurrentHumanSafetyReview(input: SafetyReviewEvidence | null | undefined, expectedFillNumber: number, latestPatientRecordChange?: string | Date | null) {
  if (!input || input.fillNumber !== expectedFillNumber || !['clear', 'override'].includes(input.outcome || '')) throw new Error('A current human clinical safety review is required for this fill')
  for (const [name, value] of Object.entries({
    allergies: input.allergiesReviewed,
    medicationHistory: input.medicationHistoryReviewed,
    interactions: input.interactionsReviewed,
    duplicateTherapy: input.duplicateTherapyReviewed,
    contraindications: input.contraindicationsReviewed,
    dose: input.doseReviewed,
    counselingPlan: input.counselingPlanReviewed,
  })) {
    if (value !== true) throw new Error(`${name} review evidence is incomplete`)
  }
  if (!input.reviewReference?.trim() || !input.reviewedAt || Number.isNaN(new Date(input.reviewedAt).getTime())) throw new Error('Clinical safety review source evidence is incomplete')
  if (input.outcome === 'override' && (!input.overrideReason || input.overrideReason.trim().length < 8)) throw new Error('A meaningful human override reason is required')
  if (latestPatientRecordChange && new Date(latestPatientRecordChange).getTime() > new Date(input.reviewedAt).getTime()) {
    throw new Error('Patient identity, allergy, or medication history changed after the safety review')
  }
}

export function assertPrescriptionItemProductIdentity(input: { drugReference?: { id?: string | null } | null; product?: { id?: string | null; drugReference?: { id?: string | null } | null } | null }) {
  const reviewedDrugReferenceId = input.drugReference?.id
  const productDrugReferenceId = input.product?.drugReference?.id
  if (!input.product?.id || !reviewedDrugReferenceId || !productDrugReferenceId || reviewedDrugReferenceId !== productDrugReferenceId) {
    throw new Error('Prescription product identity does not match the drug reference reviewed at intake; dispensing is blocked')
  }
}

export function currentFillNumber(item: { activeFillNumber?: number | null; refillsAuthorized?: number | null; refillsRemaining?: number | null }) {
  if (Number.isSafeInteger(item.activeFillNumber) && Number(item.activeFillNumber) > 0) return Number(item.activeFillNumber)
  return 1 + Math.max(0, Number(item.refillsAuthorized || 0) - Number(item.refillsRemaining || 0))
}
