import { createHash } from 'node:crypto'
import type { Context } from '.keystone/types'
import { assertDrugReferenceEligibleForBoundedDispensing } from '../workflows/clinical-safety'
import { assertPrescriptionClinicallyEligible } from '../workflows/prescription-eligibility'
import { requirePermission, requireTenantMembership } from './lib/authorization'
import { createHumanApproval, recordAuditAndOutbox } from './lib/evidence'
import { withDomainTransaction } from './lib/transaction'
import { FILL_LINEAGE, parseFillPolicy } from '../workflows/fill-entitlement'

type IntakeItem = {
  productId: string
  medicationName: string
  sig: string
  quantity: number
  daysSupply?: number | null
  refillsAuthorized: number
  substitutionAllowed: boolean
}

export async function intakePharmacyPrescription(
  _root: unknown,
  args: {
    organizationId: string
    locationId: string
    patientId: string
    prescriberId: string
    prescriptionNumber: string
    source: string
    externalReference?: string | null
    writtenAt: string
    expiresAt: string
    items: IntakeItem[]
    reason: string
    attested: boolean
  },
  context: Context,
) {
  requirePermission(context, 'canManagePrescriptions')
  if (!['paper', 'phone'].includes(args.source)) {
    throw new Error('Bounded launch intake supports only operator-reviewed paper or phone sources; eRx, transfer conversion, and generic manual intake require their dedicated authority and evidence workflows')
  }
  if (!args.prescriptionNumber?.trim() || !args.items.length) throw new Error('Prescription number and at least one item are required')
  if (args.items.length !== 1) throw new Error('Enter one prescription item per prescription')
  const writtenAt = new Date(args.writtenAt)
  const expiresAt = new Date(args.expiresAt)
  if (Number.isNaN(writtenAt.getTime()) || Number.isNaN(expiresAt.getTime()) || writtenAt.getTime() > Date.now() || expiresAt.getTime() <= writtenAt.getTime()) {
    throw new Error('Prescription written and expiration dates are invalid')
  }
  for (const item of args.items) {
    if (!item.productId || !item.medicationName?.trim() || !item.sig?.trim() || !Number.isInteger(item.quantity) || item.quantity < 1 || !Number.isInteger(item.refillsAuthorized) || item.refillsAuthorized < 0) {
      throw new Error('Prescription item is invalid')
    }
  }
  const requestFingerprint = createHash('sha256').update(JSON.stringify({ organizationId: args.organizationId, locationId: args.locationId, patientId: args.patientId, prescriberId: args.prescriberId, prescriptionNumber: args.prescriptionNumber.trim(), source: args.source, externalReference: args.externalReference?.trim() || null, writtenAt: writtenAt.toISOString(), expiresAt: expiresAt.toISOString(), items: args.items, reason: args.reason?.trim(), attested: args.attested })).digest('hex')
  return withDomainTransaction(context, [`prescription-number:${args.prescriptionNumber.trim()}`], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const existing = await sudo.query.Prescription.findOne({ where: { prescriptionNumber: args.prescriptionNumber.trim() }, query: 'id status intakeRequestFingerprint organization { id } location { id } approval { id }' })
    if (existing) {
      if (!existing.organization?.id || !existing.location?.id) throw new Error('Prescription replay scope is incomplete; operator reconciliation is required')
      await requireTenantMembership(transactionContext, { organizationId: existing.organization.id, locationId: existing.location.id, pharmacist: true })
      if (!existing.intakeRequestFingerprint || existing.intakeRequestFingerprint !== requestFingerprint) throw new Error('Prescription number is already bound to different or legacy intake evidence; do not replay it')
      return { success: true, reused: true, prescriptionId: existing.id, status: existing.status, approvalId: existing.approval?.id }
    }
    const { userId } = await requireTenantMembership(transactionContext, {
      organizationId: args.organizationId,
      locationId: args.locationId,
      pharmacist: true,
    })
    const organization: any = await sudo.query.Organization.findOne({ where: { id: args.organizationId }, query: 'id prescriptionFillPolicy' })
    parseFillPolicy(organization?.prescriptionFillPolicy)
    if (!organization?.prescriptionFillPolicy?.approvalId) throw new Error('Fill policy requires recorded pharmacist approval before intake')
    const [products, patient, prescriber] = await Promise.all([
      sudo.query.Product.findMany({
        where: { id: { in: [...new Set(args.items.map((item) => item.productId))] } },
        query: 'id title organization { id } location { id } drugReference { id }',
      }),
      sudo.query.PatientProfile.findOne({ where: { id: args.patientId }, query: 'id status organizations { id }' }),
      sudo.query.Prescriber.findOne({ where: { id: args.prescriberId }, query: 'id npi verificationStatus externalValidationComplete verificationMethod credentialType credentialJurisdiction credentialIdentifier credentialExpiresAt validationReference verifiedBy { id } organization { id }' }),
    ])
    if (!patient || patient.status !== 'active' || !patient.organizations?.some((organization: any) => organization.id === args.organizationId)) throw new Error('Active patient is not in the prescription organization')
    if (!prescriber || prescriber.organization?.id !== args.organizationId) throw new Error('Prescriber is not in the prescription organization')
    assertPrescriptionClinicallyEligible({ sourceVerificationStatus: 'human_verified', writtenAt, expiresAt, prescriber })
    if (products.length !== new Set(args.items.map((item) => item.productId)).size || products.some((product: any) => product.organization?.id !== args.organizationId || product.location?.id !== args.locationId || !product.drugReference?.id)) {
      throw new Error('Every prescription item must use an NDC-linked product from this pharmacy')
    }
    const drugReferenceIds = [...new Set(products.map((product: any) => product.drugReference.id))] as string[]
    const drugReviews = await sudo.query.DrugReferenceReview.findMany({ where: { organization: { id: { equals: args.organizationId } }, drugReference: { id: { in: drugReferenceIds } }, status: { equals: 'active' } }, take: 100, query: 'id status marketingStatusSnapshot controlledScheduleSnapshot sourceName sourceVersion sourceReference reviewedAt drugReference { id }' })
    if (drugReviews.length !== drugReferenceIds.length) throw new Error('Every prescription item requires drug reference review evidence')
    for (const review of drugReviews) assertDrugReferenceEligibleForBoundedDispensing({ sourceVerified: review.status === 'active', marketingStatus: review.marketingStatusSnapshot, controlledSchedule: review.controlledScheduleSnapshot, sourceName: review.sourceName, sourceVersion: review.sourceVersion, sourceReference: review.sourceReference, reviewedAt: review.reviewedAt })
    const approval = await createHumanApproval(transactionContext, {
      organizationId: args.organizationId,
      locationId: args.locationId,
      actorId: userId,
      actionType: 'prescription_review',
      reason: args.reason,
      attested: args.attested,
      evidence: { stage: 'source_verification', source: args.source, externalReference: args.externalReference || null, requestFingerprint },
    })
    const prescription = await sudo.query.Prescription.createOne({
      data: {
        prescriptionNumber: args.prescriptionNumber.trim(),
        intakeRequestFingerprint: requestFingerprint,
        source: args.source,
        sourceVerificationStatus: 'human_verified',
        externalReference: args.externalReference?.trim() || undefined,
        status: 'pending_review',
        writtenAt: writtenAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        organization: { connect: { id: args.organizationId } },
        location: { connect: { id: args.locationId } },
        patient: { connect: { id: args.patientId } },
        prescriber: { connect: { id: args.prescriberId } },
        approval: { connect: { id: approval.id } },
      },
      query: 'id status',
    })
    for (const item of args.items) {
      const product = products.find((entry: any) => entry.id === item.productId)
      if (!product) throw new Error('Prescription product disappeared during intake')
      await sudo.query.PrescriptionItem.createOne({
        data: {
          medicationNameSnapshot: item.medicationName.trim(),
          sig: item.sig.trim(),
          fillLineage: FILL_LINEAGE,
          quantityPrescribed: item.quantity,
          daysSupply: item.daysSupply || undefined,
          refillsAuthorized: item.refillsAuthorized,
          refillsRemaining: item.refillsAuthorized,
          substitutionAllowed: item.substitutionAllowed,
          prescription: { connect: { id: prescription.id } },
          product: { connect: { id: product.id } },
          drugReference: product.drugReference?.id ? { connect: { id: product.drugReference.id } } : undefined,
        },
      })
    }
    await recordAuditAndOutbox(transactionContext, {
      eventKey: `prescription.intake:${args.organizationId}:${args.prescriptionNumber.trim()}`,
      organizationId: args.organizationId,
      locationId: args.locationId,
      actorId: userId,
      patientId: args.patientId,
      eventType: 'prescription.intake_recorded',
      resourceType: 'Prescription',
      resourceId: prescription.id,
      metadata: { source: args.source, itemCount: args.items.length, approvalId: approval.id },
    })
    return { success: true, reused: false, prescriptionId: prescription.id, status: prescription.status, approvalId: approval.id }
  })
}
