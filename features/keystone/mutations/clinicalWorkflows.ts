import { createHash } from 'node:crypto'
import type { Context } from '.keystone/types'
import { assertCurrentHumanSafetyReview, assertDrugReferenceEligibleForBoundedDispensing, currentFillNumber, isHumanSafetyReviewStale } from '../workflows/clinical-safety'
import { requirePermission, requireTenantMembership } from './lib/authorization'
import { createHumanApproval, recordAuditAndOutbox } from './lib/evidence'
import { withDomainTransaction } from './lib/transaction'
import { FILL_LINEAGE } from '../workflows/fill-entitlement'
import { appendFillEvent, assertFillBinding, assertItemFillLedger, currentFillPermission, loadFillPrescription, fillStore, FILL_QUERY } from './fillWorkflows'

export async function recordPharmacyDrugReferenceReview(
  _root: unknown,
  args: { organizationId: string; drugReferenceId: string; marketingStatus: string; controlledSchedule: string; sourceName: string; sourceVersion: string; sourceReference: string; reason: string; attested: boolean },
  context: Context,
) {
  requirePermission(context, 'canManageCatalog')
  requirePermission(context, 'canApproveConsequentialActions')
  if (!['active', 'inactive'].includes(args.marketingStatus)) throw new Error('Marketing status is invalid')
  if (!['none', 'controlled_or_unsupported'].includes(args.controlledSchedule)) throw new Error('Controlled schedule review is invalid')
  if (![args.sourceName, args.sourceVersion, args.sourceReference].every((value) => value?.trim())) throw new Error('Drug source name, version, and reference are required')
  return withDomainTransaction(context, [`drug-reference:${args.drugReferenceId}`, `drug-reference-review:${args.organizationId}:${args.drugReferenceId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const [drugReference, existing] = await Promise.all([
      sudo.query.DrugReference.findOne({ where: { id: args.drugReferenceId }, query: 'id ndc11' }),
      (sudo.query.DrugReferenceReview.findMany({ where: { reviewKey: { equals: `${args.organizationId}:${args.drugReferenceId}` } }, take: 1, query: 'id status marketingStatusSnapshot controlledScheduleSnapshot sourceName sourceVersion sourceReference approval { id }' })).then((records) => records[0]),
    ])
    if (!drugReference) throw new Error('Drug reference not found')
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: args.organizationId, pharmacist: true })
    if (existing && existing.status === 'active' && existing.marketingStatusSnapshot === args.marketingStatus && existing.controlledScheduleSnapshot === args.controlledSchedule && existing.sourceName === args.sourceName.trim() && existing.sourceVersion === args.sourceVersion.trim() && existing.sourceReference === args.sourceReference.trim()) {
      return { success: true, reused: true, reviewId: existing.id, status: existing.status, approvalId: existing.approval?.id }
    }
    const approval = await createHumanApproval(transactionContext, { organizationId: args.organizationId, actorId: userId, actionType: 'drug_reference_review', reason: args.reason, attested: args.attested, evidence: { drugReferenceId: drugReference.id, ndc11: drugReference.ndc11, marketingStatus: args.marketingStatus, controlledSchedule: args.controlledSchedule, sourceName: args.sourceName.trim(), sourceVersion: args.sourceVersion.trim(), sourceReference: args.sourceReference.trim(), softwareValidationPerformed: false } })
    const prisma = transactionContext.prisma as any
    const now = new Date()
    const data = { status: 'active', marketingStatusSnapshot: args.marketingStatus, controlledScheduleSnapshot: args.controlledSchedule, sourceName: args.sourceName.trim(), sourceVersion: args.sourceVersion.trim(), sourceReference: args.sourceReference.trim(), reviewedAt: now, organizationId: args.organizationId, drugReferenceId: drugReference.id, reviewedById: userId, approvalId: approval.id }
    const review = existing
      ? await prisma.drugReferenceReview.update({ where: { id: existing.id }, data, select: { id: true, status: true } })
      : await prisma.drugReferenceReview.create({ data: { reviewKey: `${args.organizationId}:${drugReference.id}`, ...data }, select: { id: true, status: true } })
    await recordAuditAndOutbox(transactionContext, { eventKey: `drug_reference.reviewed:${review.id}:${approval.id}`, organizationId: args.organizationId, actorId: userId, eventType: 'drug_reference.review_recorded', resourceType: 'DrugReferenceReview', resourceId: review.id, metadata: { drugReferenceId: drugReference.id, approvalId: approval.id, marketingStatus: args.marketingStatus, controlledSchedule: args.controlledSchedule, softwareValidationPerformed: false } })
    return { success: true, reused: false, reviewId: review.id, status: review.status, approvalId: approval.id }
  })
}

export function clinicalSafetyReviewRequestFingerprint(input: {
  organizationId: string
  locationId: string
  actorId: string
  prescriptionId: string
  fillId?: string | null
  expectedFillVersion?: number | null
  outcome: string
  allergiesReviewed: boolean
  medicationHistoryReviewed: boolean
  interactionsReviewed: boolean
  duplicateTherapyReviewed: boolean
  contraindicationsReviewed: boolean
  doseReviewed: boolean
  counselingPlanReviewed: boolean
  reviewReference: string
  notes?: string | null
  overrideReason?: string | null
  reason: string
  attested: boolean
}) {
  return createHash('sha256').update(JSON.stringify({
    ...input,
    reviewReference: input.reviewReference?.trim(),
    notes: input.notes?.trim() || null,
    overrideReason: input.overrideReason?.trim() || null,
    reason: input.reason?.trim(),
  })).digest('hex')
}

export async function recordPrescriptionClinicalSafetyReview(
  _root: unknown,
  args: { prescriptionId: string; outcome: string; allergiesReviewed: boolean; medicationHistoryReviewed: boolean; interactionsReviewed: boolean; duplicateTherapyReviewed: boolean; contraindicationsReviewed: boolean; doseReviewed: boolean; counselingPlanReviewed: boolean; reviewReference: string; notes?: string | null; overrideReason?: string | null; idempotencyKey: string; reason: string; attested: boolean; fillId?: string | null; expectedFillVersion?: number | null },
  context: Context,
) {
  requirePermission(context, 'canReviewPrescriptions')
  if (!['clear', 'override', 'rejected'].includes(args.outcome)) throw new Error('Clinical safety review outcome is invalid')
  if (!args.idempotencyKey?.trim()) throw new Error('Idempotency key is required')
  const candidate = {
    fillNumber: 1,
    ...args,
    reviewedAt: new Date().toISOString(),
  }
  if (args.outcome !== 'rejected') assertCurrentHumanSafetyReview(candidate, 1)
  return withDomainTransaction(context, [`prescription:${args.prescriptionId}`, `clinical-review:${args.idempotencyKey}`], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const prescription = await sudo.query.Prescription.findOne({
      where: { id: args.prescriptionId },
      query: 'id status organization { id } location { id } patient { id identityVerificationStatus identityReference identityVerifiedAt identityVerifiedBy { id } allergies(where: { status: { equals: "active" } }) { id updatedAt } medications(where: { status: { equals: "current" } }) { id updatedAt } } items { id fillLineage activeFillNumber refillsAuthorized refillsRemaining drugReference { id } }',
    })
    if (!prescription || !['pending_review', 'needs_information', 'approved'].includes(prescription.status)) throw new Error('Prescription is not available for clinical safety review')
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: prescription.organization.id, locationId: prescription.location.id, pharmacist: true })
    let fill: any = null
    if (prescription.items.some((item: any) => item.fillLineage === FILL_LINEAGE)) {
      await currentFillPermission(transactionContext, 'canReviewPrescriptions')
      const current = await loadFillPrescription(transactionContext, prescription.id)
      if (args.fillId) {
        fill = await fillStore(transactionContext).PrescriptionFill.findOne({ where: { id: args.fillId }, query: FILL_QUERY })
        const item = current.items.find((entry: any) => entry.id === fill?.prescriptionItem?.id)
        if (!fill || !item || fill.version !== args.expectedFillVersion || !['approved', 'partially_dispensed'].includes(fill.status) || new Date(fill.expiresAt).getTime() <= Date.now()) throw new Error('A current fill identity/version is required for safety review')
        assertFillBinding(fill, current, item)
        await assertItemFillLedger(transactionContext, current, item)
      } else if (!['pending_review', 'needs_information'].includes(prescription.status)) throw new Error('Exact fill reservation is required; an intake review does not clear a new reservation')
    }
    const requestFingerprint = clinicalSafetyReviewRequestFingerprint({
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      actorId: userId,
      prescriptionId: prescription.id,
      ...(fill ? { fillId: fill.id, expectedFillVersion: args.expectedFillVersion } : {}),
      outcome: args.outcome,
      allergiesReviewed: args.allergiesReviewed,
      medicationHistoryReviewed: args.medicationHistoryReviewed,
      interactionsReviewed: args.interactionsReviewed,
      duplicateTherapyReviewed: args.duplicateTherapyReviewed,
      contraindicationsReviewed: args.contraindicationsReviewed,
      doseReviewed: args.doseReviewed,
      counselingPlanReviewed: args.counselingPlanReviewed,
      reviewReference: args.reviewReference,
      notes: args.notes,
      overrideReason: args.overrideReason,
      reason: args.reason,
      attested: args.attested,
    })
    if (prescription.patient.identityVerificationStatus !== 'confirmed' || !prescription.patient.identityReference?.trim() || !prescription.patient.identityVerifiedAt || !prescription.patient.identityVerifiedBy?.id) throw new Error('Current operator-recorded patient identity evidence is required before clinical review')
    if (!prescription.patient.allergies?.length || !prescription.patient.medications?.length) throw new Error('Explicit allergy and medication history evidence is required; record no-known/no-current entries when applicable')
    const fillNumbers = prescription.items.map((item: any) => currentFillNumber(item))
    const fillNumber = Math.max(...fillNumbers)
    if (!fillNumbers.length || fillNumbers.some((value: number) => value !== fillNumber)) throw new Error('Prescription items are not aligned to one fill review')
    if (args.outcome !== 'rejected') assertCurrentHumanSafetyReview({ ...candidate, fillNumber }, fillNumber)
    const reviewKey = `${prescription.id}:${fillNumber}:${args.idempotencyKey.trim()}`
    const existing = (await sudo.query.ClinicalSafetyReview.findMany({ where: { reviewKey: { equals: reviewKey } }, take: 1, query: 'id outcome evidenceSnapshot approval { id }' }))[0]
    if (existing && existing.evidenceSnapshot?.requestFingerprint !== requestFingerprint) throw new Error('Clinical safety review idempotency key was reused with different input')
    if (existing) return { success: true, reused: true, reviewId: existing.id, prescriptionId: prescription.id, outcome: existing.outcome, approvalId: existing.approval?.id }
    const drugReferenceIds = [...new Set(prescription.items.map((item: any) => item.drugReference?.id).filter(Boolean))] as string[]
    const drugReviews = await sudo.query.DrugReferenceReview.findMany({
      where: { organization: { id: { equals: prescription.organization.id } }, drugReference: { id: { in: drugReferenceIds } }, status: { equals: 'active' } },
      take: 100,
      query: 'id drugReference { id } status marketingStatusSnapshot controlledScheduleSnapshot sourceName sourceVersion sourceReference reviewedAt',
    })
    if (!drugReferenceIds.length || drugReviews.length !== drugReferenceIds.length) throw new Error('Every prescription item requires drug reference review evidence')
    for (const review of drugReviews) assertDrugReferenceEligibleForBoundedDispensing({ sourceVerified: review.status === 'active', marketingStatus: review.marketingStatusSnapshot, controlledSchedule: review.controlledScheduleSnapshot, sourceName: review.sourceName, sourceVersion: review.sourceVersion, sourceReference: review.sourceReference, reviewedAt: review.reviewedAt })
    const approval = await createHumanApproval(transactionContext, { organizationId: prescription.organization.id, locationId: prescription.location.id, actorId: userId, actionType: 'clinical_safety_review', reason: args.reason, attested: args.attested, evidence: { prescriptionId: prescription.id, fillId: fill?.id || null, itemVersion: fill?.itemVersion || null, authorityVersion: fill?.authorityVersion || null, fillNumber, outcome: args.outcome, reviewReference: args.reviewReference.trim(), softwareClinicalDecisionPerformed: false } })
    const review = await sudo.query.ClinicalSafetyReview.createOne({
      data: {
        reviewKey,
        fillNumber,
        outcome: args.outcome,
        allergiesReviewed: args.allergiesReviewed,
        medicationHistoryReviewed: args.medicationHistoryReviewed,
        interactionsReviewed: args.interactionsReviewed,
        duplicateTherapyReviewed: args.duplicateTherapyReviewed,
        contraindicationsReviewed: args.contraindicationsReviewed,
        doseReviewed: args.doseReviewed,
        counselingPlanReviewed: args.counselingPlanReviewed,
        reviewReference: args.reviewReference.trim(),
        notes: args.notes?.trim() || undefined,
        overrideReason: args.overrideReason?.trim() || undefined,
        evidenceSnapshot: { ...(fill ? { fillId: fill.id, fillVersion: fill.version, itemVersion: fill.itemVersion, authorityVersion: fill.authorityVersion } : {}), allergyRecordIds: prescription.patient.allergies.map((entry: any) => entry.id), medicationRecordIds: prescription.patient.medications.map((entry: any) => entry.id), drugReferenceReviewIds: drugReviews.map((entry: any) => entry.id), requestFingerprint, recordedAt: new Date().toISOString(), softwareClinicalDecisionPerformed: false },
        organization: { connect: { id: prescription.organization.id } },
        location: { connect: { id: prescription.location.id } },
        patient: { connect: { id: prescription.patient.id } },
        prescription: { connect: { id: prescription.id } },
        pharmacist: { connect: { id: userId } },
        approval: { connect: { id: approval.id } },
      },
      query: 'id outcome reviewedAt',
    })
    if (fill) await appendFillEvent(transactionContext, fill, { eventKey: `fill.clinical:${review.id}`, fingerprint: requestFingerprint, action: 'clinical_reviewed', actorId: userId, approvalId: approval.id, result: { reviewId: review.id, outcome: review.outcome }, evidence: { clinicalSafetyReviewId: review.id, outcome: args.outcome, fillVersion: fill.version } })
    await recordAuditAndOutbox(transactionContext, { eventKey: `prescription.clinical_safety_reviewed:${review.id}`, organizationId: prescription.organization.id, locationId: prescription.location.id, actorId: userId, patientId: prescription.patient.id, eventType: 'prescription.clinical_safety_review_recorded', resourceType: 'ClinicalSafetyReview', resourceId: review.id, metadata: { prescriptionId: prescription.id, fillNumber, outcome: args.outcome, approvalId: approval.id, softwareClinicalDecisionPerformed: false } })
    return { success: true, reused: false, reviewId: review.id, prescriptionId: prescription.id, outcome: review.outcome, approvalId: approval.id }
  })
}

export async function holdPrescriptionForClinicalReReview(
  _root: unknown,
  args: { prescriptionId: string; reason: string; attested: boolean },
  context: Context,
) {
  requirePermission(context, 'canReviewPrescriptions')
  if (!args.reason?.trim()) throw new Error('A reason for the clinical safety hold is required')
  return withDomainTransaction(context, [`prescription:${args.prescriptionId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const prescription = await sudo.query.Prescription.findOne({
      where: { id: args.prescriptionId },
      query: 'id status approval { id actionType reason evidence } organization { id } location { id } patient { id identityVerifiedAt allergies(where: { status: { equals: "active" } }) { id updatedAt } medications(where: { status: { equals: "current" } }) { id updatedAt } } items { id fillLineage activeFillNumber refillsAuthorized refillsRemaining drugReference { id } } safetyReviews(orderBy: { reviewedAt: desc }, take: 1) { id fillNumber outcome reviewedAt }',
    })
    if (!prescription) throw new Error('Prescription not found')
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: prescription.organization.id, locationId: prescription.location.id, pharmacist: true })
    const fillNumbers = prescription.items.map((item: any) => currentFillNumber(item))
    const fillNumber = fillNumbers.length ? Math.max(...fillNumbers) : 0
    const latestReview = prescription.safetyReviews?.[0]
    const drugReferenceIds = [...new Set(prescription.items.map((item: any) => item.drugReference?.id).filter(Boolean))] as string[]
    const drugReviews = await sudo.query.DrugReferenceReview.findMany({
      where: { organization: { id: { equals: prescription.organization.id } }, drugReference: { id: { in: drugReferenceIds } }, status: { equals: 'active' } },
      take: 100,
      query: 'id reviewedAt',
    })
    const evidenceChanges = [prescription.patient?.identityVerifiedAt, ...(prescription.patient?.allergies || []).map((entry: any) => entry.updatedAt), ...(prescription.patient?.medications || []).map((entry: any) => entry.updatedAt), ...drugReviews.map((entry: any) => entry.reviewedAt)].filter(Boolean)
    const latestEvidenceChange = evidenceChanges.sort((a: string, b: string) => new Date(a).getTime() - new Date(b).getTime()).at(-1)
    const requestFingerprint = createHash('sha256').update(JSON.stringify({ prescriptionId: prescription.id, organizationId: prescription.organization.id, locationId: prescription.location.id, actorId: userId, reason: args.reason.trim(), attested: args.attested, safetyReviewId: latestReview?.id || null, latestEvidenceChange: latestEvidenceChange || null })).digest('hex')
    if (prescription.status === 'approved' && prescription.approval?.actionType === 'clinical_safety_hold') {
      if (prescription.approval.evidence?.requestFingerprint !== requestFingerprint) throw new Error('Clinical safety hold replay does not match the recorded action')
      return { success: true, reused: true, prescriptionId: prescription.id, status: 'approved', approvalId: prescription.approval.id }
    }
    if (!['ready_to_dispense', 'partially_dispensed'].includes(prescription.status) || !latestReview || !isHumanSafetyReviewStale(latestReview, fillNumber, latestEvidenceChange)) {
      throw new Error('A clinical safety re-review hold is available only when new patient or drug-reference evidence invalidates the current fill review')
    }
    const approval = await createHumanApproval(transactionContext, {
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      actorId: userId,
      actionType: 'clinical_safety_hold',
      reason: args.reason,
      attested: args.attested,
      evidence: { prescriptionId: prescription.id, safetyReviewId: latestReview.id, latestEvidenceChange, requestFingerprint, softwareClinicalDecisionPerformed: false },
    })
    await sudo.query.Prescription.updateOne({ where: { id: prescription.id }, data: { status: 'approved', approval: { connect: { id: approval.id } } } })
    await recordAuditAndOutbox(transactionContext, {
      eventKey: `prescription.clinical_safety_hold:${prescription.id}:${approval.id}`,
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      actorId: userId,
      patientId: prescription.patient.id,
      eventType: 'prescription.clinical_safety_hold_recorded',
      resourceType: 'Prescription',
      resourceId: prescription.id,
      metadata: { safetyReviewId: latestReview.id, latestEvidenceChange, approvalId: approval.id, requestFingerprint },
    })
    return { success: true, reused: false, prescriptionId: prescription.id, status: 'approved', approvalId: approval.id }
  })
}
