import { createHash } from 'node:crypto'
import type { Context } from '.keystone/types'
import { permissions } from '../access'
import { requireTenantMembership } from './lib/authorization'
import { createHumanApproval, recordAuditAndOutbox } from './lib/evidence'
import { withDomainTransaction } from './lib/transaction'
import { assertItemFillLedger, assertFillBinding, appendFillEvent, casFill, currentFillPermission, FILL_QUERY, fillStore, loadFillPrescription, reserveFillInTransaction } from './fillWorkflows'
import { FILL_LINEAGE, fillHash } from '../workflows/fill-entitlement'

export const TRANSFER_CONSENT = {
  policyVersion: '2026-07-18',
  statementKey: 'openfront_pharmacy_prescription_transfer_consent_v1',
} as const

async function patientAccess(context: Context, patientId: string, organizationId: string, locationId: string) {
  const patient = await context.sudo().query.PatientProfile.findOne({ where: { id: patientId }, query: 'id status user { id } organizations { id }' })
  const location = await context.sudo().query.PharmacyLocation.findOne({ where: { id: locationId }, query: 'id status organization { id status }' })
  if (!location || location.status !== 'active' || location.organization?.id !== organizationId || location.organization.status !== 'active') throw new Error('An active location is required')
  if (!patient || patient.status !== 'active' || !patient.organizations.some((organization: any) => organization.id === organizationId)) throw new Error('Patient not found in this organization')
  if (patient.user?.id === context.session?.itemId) return { patient, actorId: context.session.itemId }
  if (!permissions.canManagePrescriptions({ session: context.session as any })) throw new Error('You do not have access to this patient workflow')
  await currentFillPermission(context, 'canManagePrescriptions')
  const { userId } = await requireTenantMembership(context, { organizationId, locationId })
  return { patient, actorId: userId }
}

export async function linkPharmacyPatientAccount(
  _root: unknown,
  args: { patientId: string; userId: string },
  context: Context,
) {
  if (!permissions.canManagePatients({ session: context.session as any })) throw new Error('Permission required: canManagePatients')
  return withDomainTransaction(context, [`patient:${args.patientId}`, `user:${args.userId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const [patient, user] = await Promise.all([
      sudo.query.PatientProfile.findOne({ where: { id: args.patientId }, query: 'id user { id } organizations { id }' }),
      sudo.query.User.findOne({ where: { id: args.userId }, query: 'id patientProfile { id } memberships(where: { status: { equals: "active" } }) { organization { id } }' }),
    ])
    if (!patient?.organizations?.length || !user) throw new Error('Patient or user not found')
    const organizationId = patient.organizations[0].id
    const { userId: actorId } = await requireTenantMembership(transactionContext, { organizationId })
    if (!user.memberships?.some((membership: any) => membership.organization?.id === organizationId)) throw new Error('User is not available in the patient organization')
    if (patient.user?.id === user.id && user.patientProfile?.id === patient.id) return { success: true, reused: true, patientId: patient.id, userId: user.id }
    if (patient.user?.id || user.patientProfile?.id) throw new Error('Patient or user is already linked to another account')
    await sudo.query.PatientProfile.updateOne({ where: { id: patient.id }, data: { user: { connect: { id: user.id } } } })
    await recordAuditAndOutbox(transactionContext, {
      eventKey: `patient.account_linked:${patient.id}:${user.id}`,
      organizationId,
      actorId,
      patientId: patient.id,
      eventType: 'patient.account_linked',
      resourceType: 'PatientProfile',
      resourceId: patient.id,
      metadata: { userId: user.id },
    })
    return { success: true, reused: false, patientId: patient.id, userId: user.id }
  })
}

export async function requestPrescriptionRefill(
  _root: unknown,
  args: { prescriptionId: string; prescriptionItemId: string; patientId: string; locationId: string; note?: string | null; idempotencyKey: string; expectedItemVersion?: string | null },
  context: Context,
) {
  if (!context.session?.itemId) throw new Error('Authentication required')
  if (!args.idempotencyKey?.trim()) throw new Error('Idempotency key is required')
  return withDomainTransaction(context, [`refill-idempotency:${args.idempotencyKey}`, `prescription:${args.prescriptionId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const existing = await sudo.query.RefillRequest.findOne({
      where: { idempotencyKey: args.idempotencyKey },
      query: 'id status requestFingerprint patient { id } prescription { id } prescriptionItem { id } location { id }',
    })
    const prescription = await sudo.query.Prescription.findOne({
      where: { id: args.prescriptionId },
      query: 'id status organization { id } location { id } patient { id } items { id fillLineage refillsRemaining refillsReserved }',
    })
    if (!prescription || prescription.patient.id !== args.patientId || prescription.location.id !== args.locationId) throw new Error('Prescription not found')
    const { actorId } = await patientAccess(transactionContext, args.patientId, prescription.organization.id, prescription.location.id)
    const item = prescription.items.find((entry: any) => entry.id === args.prescriptionItemId)
    if (!item) throw new Error('Prescription item does not belong to this prescription')
    const requestFingerprint = createHash('sha256').update(JSON.stringify({
      organizationId: prescription.organization.id,
      actorId,
      prescriptionId: prescription.id,
      prescriptionItemId: item.id,
      patientId: args.patientId,
      locationId: args.locationId,
      note: args.note?.trim() || '',
      ...(item.fillLineage === FILL_LINEAGE ? { expectedItemVersion: args.expectedItemVersion } : {}),
    })).digest('hex')
    if (existing) {
      if (!existing.requestFingerprint || existing.requestFingerprint !== requestFingerprint) {
        throw new Error('Refill idempotency key is already bound to another request')
      }
      if (item.fillLineage === FILL_LINEAGE) {
        const current = await loadFillPrescription(transactionContext, prescription.id)
        const fill = await fillStore(transactionContext).PrescriptionFill.findOne({ where: { reservationKey: `refill:${args.idempotencyKey}` }, query: FILL_QUERY })
        if (!fill) throw new Error('Refill lineage is missing')
        assertFillBinding(fill, current, current.items.find((entry: any) => entry.id === item.id))
      }
      return { success: true, reused: true, refillRequestId: existing.id, status: existing.status }
    }
    if (item.fillLineage !== FILL_LINEAGE) throw new Error('Legacy refill authority requires explicit reconciliation; no historical counter conversion is inferred')
    if (!['dispensed', 'fill_closed'].includes(prescription.status)) throw new Error('Current authorized fill must be completely dispensed before requesting a refill')
    if (item.refillsRemaining - item.refillsReserved < 1) throw new Error('No unreserved refills remain for this prescription item')
    const openRequestKey = `refill:${item.id}`
    const openRequest = await sudo.query.RefillRequest.findOne({ where: { openRequestKey }, query: 'id status' })
    if (openRequest) throw new Error('An open refill request already owns this entitlement; recover that request')
    const refill = await sudo.query.RefillRequest.createOne({
      data: {
        idempotencyKey: args.idempotencyKey,
        requestFingerprint,
        openRequestKey,
        patient: { connect: { id: args.patientId } },
        prescription: { connect: { id: prescription.id } },
        prescriptionItem: { connect: { id: item.id } },
        location: { connect: { id: args.locationId } },
        requestNote: args.note?.trim() || undefined,
        status: 'requested',
      },
      query: 'id status requestedAt',
    })
    const current = await loadFillPrescription(transactionContext, prescription.id)
    const currentItem = current.items.find((entry: any) => entry.id === item.id)
    await reserveFillInTransaction(transactionContext, current, currentItem, { kind: 'refill', actorId, key: `refill:${args.idempotencyKey}`, fingerprint: requestFingerprint, expectedItemVersion: args.expectedItemVersion || undefined, refillRequestId: refill.id })
    await recordAuditAndOutbox(transactionContext, {
      eventKey: `refill.requested:${args.idempotencyKey}`,
      organizationId: prescription.organization.id,
      locationId: args.locationId,
      actorId,
      patientId: args.patientId,
      eventType: 'refill.requested',
      resourceType: 'RefillRequest',
      resourceId: refill.id,
      metadata: { prescriptionId: prescription.id, prescriptionItemId: item.id, reservedRefills: item.refillsReserved + 1 },
    })
    return { success: true, reused: false, refillRequestId: refill.id, status: refill.status }
  })
}

export async function resolvePrescriptionRefill(
  _root: unknown,
  args: { refillRequestId: string; decision: string; reason: string; attested: boolean; expectedFillVersion?: number | null },
  context: Context,
) {
  if (!permissions.canReviewPrescriptions({ session: context.session as any })) throw new Error('Permission required: canReviewPrescriptions')
  if (!['approved', 'rejected'].includes(args.decision)) throw new Error('Refill decision must be approved or rejected')
  await currentFillPermission(context, 'canReviewPrescriptions')
  const identity = await context.sudo().query.RefillRequest.findOne({ where: { id: args.refillRequestId }, query: 'id prescription { id }' })
  if (!identity?.prescription?.id) throw new Error('Refill request not found')
  return withDomainTransaction(context, [`refill:${args.refillRequestId}`, `prescription:${identity.prescription.id}`], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const refill = await sudo.query.RefillRequest.findOne({
      where: { id: args.refillRequestId },
      query: 'id status patient { id } location { id } prescriptionItem { id fillLineage refillsRemaining refillsReserved } prescription { id status organization { id } location { id } } approval { id reason }',
    })
    if (!refill?.prescriptionItem || !refill.prescription) throw new Error('Refill request not found')
    const { userId } = await requireTenantMembership(transactionContext, {
      organizationId: refill.prescription.organization.id,
      locationId: refill.prescription.location.id,
      pharmacist: true,
    })
    if (refill.prescription.id !== identity.prescription.id || refill.patient.id !== (await loadFillPrescription(transactionContext, identity.prescription.id)).patient.id || refill.location?.id !== refill.prescription.location.id) throw new Error('Refill scope changed')
    await currentFillPermission(transactionContext, 'canReviewPrescriptions')
    if (refill.prescriptionItem.fillLineage === FILL_LINEAGE) {
      const q = fillStore(transactionContext), p = await loadFillPrescription(transactionContext, refill.prescription.id)
      const fill = (await q.PrescriptionFill.findMany({ where: { refillRequest: { id: { equals: refill.id } } }, take: 2, query: FILL_QUERY }))[0]
      const item = p.items.find((i: any) => i.id === refill.prescriptionItem.id)
      if (!fill || !item) throw new Error('Refill fill lineage is missing')
      assertFillBinding(fill, p, item, args.decision === 'approved')
      await assertItemFillLedger(transactionContext, p, item)
      const fingerprint = fillHash({ ...args, actorId: userId }), eventKey = `fill.resolve:${refill.id}`
      const prior = await q.PrescriptionFillEvent.findOne({ where: { eventKey }, query: 'commandFingerprint result' })
      if (prior) {
        if (prior.commandFingerprint !== fingerprint) throw new Error('Refill decision replay differs from the original intent')
        return { ...prior.result, reused: true }
      }
      if (refill.status !== 'requested' || fill.status !== 'requested' || fill.version !== args.expectedFillVersion) throw new Error('Refill state/version changed; refresh the workbench')
      if (item.refillsReserved < 1 || item.refillsRemaining < 1) throw new Error('Refill reservation evidence is missing')
      if (args.decision === 'approved' && new Date(fill.expiresAt).getTime() <= Date.now()) throw new Error('Refill reservation expired; record an authorized release')
      const approval = await createHumanApproval(transactionContext, { organizationId: p.organization.id, locationId: p.location.id, actorId: userId,
        actionType: 'prescription_review', reason: args.reason, attested: args.attested, evidence: { refillRequestId: refill.id, fillId: fill.id, itemVersion: fill.itemVersion, authorityVersion: fill.authorityVersion, decision: args.decision } })
      const approved = args.decision === 'approved'
      if (!approved) await sudo.query.PrescriptionItem.updateOne({ where: { id: item.id }, data: { refillsReserved: item.refillsReserved - 1 } })
      const updated = await casFill(transactionContext, fill, { status: approved ? 'approved' : 'released', version: fill.version + 1,
        ...(approved ? {} : { creditState: 'released', quantityReleased: fill.authorizedQuantity, openKey: null }) })
      await sudo.query.RefillRequest.updateOne({ where: { id: refill.id }, data: { status: args.decision, ...(approved ? {} : { openRequestKey: null }), resolutionNote: args.reason, resolvedAt: new Date().toISOString(), approval: { connect: { id: approval.id } } } })
      if (approved) await sudo.query.Prescription.updateOne({ where: { id: p.id }, data: { status: 'approved', approval: { connect: { id: approval.id } } } })
      const result = { success: true, reused: false, refillRequestId: refill.id, status: args.decision, approvalId: approval.id }
      await appendFillEvent(transactionContext, updated, { eventKey, fingerprint, action: args.decision, actorId: userId, approvalId: approval.id, result, evidence: { refillRequestId: refill.id, refillsRemaining: item.refillsRemaining, refillsReserved: item.refillsReserved - (approved ? 0 : 1) } })
      return result
    }
    if (['approved', 'rejected'].includes(refill.status)) {
      if (refill.status !== args.decision || refill.approval?.reason !== args.reason) throw new Error('Refill resolution replay does not match the recorded decision and reason')
      return { success: true, reused: true, refillRequestId: refill.id, status: refill.status, approvalId: refill.approval?.id }
    }
    if (args.decision === 'approved') throw new Error('Legacy refill approval requires explicit lineage reconciliation')
    if (refill.prescriptionItem.refillsReserved < 1) throw new Error('Refill reservation evidence is missing')
    const approval = await createHumanApproval(transactionContext, {
      organizationId: refill.prescription.organization.id,
      locationId: refill.prescription.location.id,
      actorId: userId,
      actionType: 'prescription_review',
      reason: args.reason,
      attested: args.attested,
      evidence: { refillRequestId: refill.id, prescriptionItemId: refill.prescriptionItem.id, decision: args.decision },
    })
    await sudo.query.PrescriptionItem.updateOne({
      where: { id: refill.prescriptionItem.id },
      data: {
        refillsReserved: refill.prescriptionItem.refillsReserved - 1,
      },
    })
    await sudo.query.RefillRequest.updateOne({
      where: { id: refill.id },
      data: { status: args.decision, openRequestKey: null, resolutionNote: args.reason, resolvedAt: new Date().toISOString(), approval: { connect: { id: approval.id } } },
    })
    await recordAuditAndOutbox(transactionContext, {
      eventKey: `refill.${args.decision}:${refill.id}`,
      organizationId: refill.prescription.organization.id,
      locationId: refill.prescription.location.id,
      actorId: userId,
      patientId: refill.patient.id,
      eventType: `refill.${args.decision}`,
      resourceType: 'RefillRequest',
      resourceId: refill.id,
      metadata: { prescriptionId: refill.prescription.id, prescriptionItemId: refill.prescriptionItem.id, approvalId: approval.id },
    })
    return { success: true, reused: false, refillRequestId: refill.id, status: args.decision, approvalId: approval.id }
  })
}

export async function requestPrescriptionTransfer(
  _root: unknown,
  args: {
    prescriptionId: string
    patientId: string
    direction: string
    counterpartyName: string
    counterpartyPhone?: string | null
    consentAccepted: boolean
    policyVersion: string
    statementKey: string
    idempotencyKey: string
  },
  context: Context,
) {
  if (!context.session?.itemId) throw new Error('Authentication required')
  if (!args.idempotencyKey?.trim()) throw new Error('Idempotency key is required')
  if (!args.consentAccepted || args.policyVersion !== TRANSFER_CONSENT.policyVersion || args.statementKey !== TRANSFER_CONSENT.statementKey) {
    throw new Error('Current prescription transfer consent is required')
  }
  if (!['inbound', 'outbound'].includes(args.direction)) throw new Error('Invalid transfer direction')
  const requestFingerprint = createHash('sha256').update(JSON.stringify({ prescriptionId: args.prescriptionId, patientId: args.patientId, direction: args.direction, counterpartyName: args.counterpartyName?.trim(), counterpartyPhone: args.counterpartyPhone?.trim() || null, consentAccepted: args.consentAccepted, policyVersion: args.policyVersion, statementKey: args.statementKey })).digest('hex')
  return withDomainTransaction(context, [`prescription:${args.prescriptionId}`, `transfer-idempotency:${args.idempotencyKey}`], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const existing = await sudo.query.PrescriptionTransfer.findOne({ where: { idempotencyKey: args.idempotencyKey }, query: 'id status patient { id } prescription { id organization { id } location { id } patient { id } } consent { evidence }' })
    if (existing) {
      if (existing.prescription?.id !== args.prescriptionId || existing.patient?.id !== args.patientId || existing.prescription.patient?.id !== args.patientId || !existing.prescription.organization?.id || !existing.prescription.location?.id) throw new Error('Transfer replay scope is incomplete or does not match')
      await patientAccess(transactionContext, existing.patient.id, existing.prescription.organization.id, existing.prescription.location.id)
      if (existing.consent?.evidence?.requestFingerprint !== requestFingerprint) throw new Error('Transfer idempotency key was reused with different input')
      return { success: true, reused: true, transferId: existing.id, status: existing.status }
    }
    const prescription = await sudo.query.Prescription.findOne({
      where: { id: args.prescriptionId },
      query: 'id organization { id } location { id } patient { id }',
    })
    if (!prescription || prescription.patient.id !== args.patientId) throw new Error('Prescription not found')
    const { actorId } = await patientAccess(transactionContext, args.patientId, prescription.organization.id, prescription.location.id)
    const transfer = await sudo.query.PrescriptionTransfer.createOne({
      data: {
        idempotencyKey: args.idempotencyKey,
        direction: args.direction,
        status: 'requested',
        counterpartyName: args.counterpartyName.trim(),
        counterpartyPhone: args.counterpartyPhone?.trim() || undefined,
        patient: { connect: { id: args.patientId } },
        prescription: { connect: { id: prescription.id } },
      },
      query: 'id status',
    })
    const consent = await sudo.query.ConsentRecord.createOne({
      data: {
        consentType: 'prescription_transfer',
        policyVersion: args.policyVersion,
        statementKey: args.statementKey,
        accepted: true,
        captureMethod: 'authenticated_transfer_request',
        patient: { connect: { id: args.patientId } },
        actor: { connect: { id: actorId } },
        transfer: { connect: { id: transfer.id } },
        evidence: { direction: args.direction, idempotencyKey: args.idempotencyKey, requestFingerprint },
      },
      query: 'id',
    })
    await sudo.query.PrescriptionTransfer.updateOne({ where: { id: transfer.id }, data: { status: 'consent_recorded', consent: { connect: { id: consent.id } } } })
    await recordAuditAndOutbox(transactionContext, {
      eventKey: `prescription_transfer.requested:${args.idempotencyKey}`,
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      actorId,
      patientId: args.patientId,
      eventType: 'prescription_transfer.requested',
      resourceType: 'PrescriptionTransfer',
      resourceId: transfer.id,
      metadata: { consentId: consent.id, direction: args.direction },
    })
    return { success: true, reused: false, transferId: transfer.id, status: 'consent_recorded' }
  })
}

export async function approvePrescriptionTransfer(
  _root: unknown,
  args: { transferId: string; reason: string; attested: boolean },
  context: Context,
) {
  if (!permissions.canReviewPrescriptions({ session: context.session as any })) throw new Error('Permission required: canReviewPrescriptions')
  return withDomainTransaction(context, [`transfer:${args.transferId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const transfer = await sudo.query.PrescriptionTransfer.findOne({
      where: { id: args.transferId },
      query: 'id status patient { id } consent { id accepted } approval { id reason actionType } prescription { id organization { id } location { id } }',
    })
    if (!transfer) throw new Error('Transfer is not ready for authorized review')
    const { userId } = await requireTenantMembership(transactionContext, {
      organizationId: transfer.prescription.organization.id,
      locationId: transfer.prescription.location.id,
      pharmacist: true,
    })
    if (transfer.status === 'accepted' && transfer.approval?.id && (transfer.approval.actionType !== 'transfer' || transfer.approval.reason !== args.reason)) throw new Error('Transfer approval replay does not match the recorded reason')
    if (transfer.status === 'accepted' && transfer.approval?.id) {
      return { success: true, reused: true, transferId: transfer.id, status: transfer.status, approvalId: transfer.approval.id }
    }
    if (transfer.status !== 'consent_recorded' || !transfer.consent?.accepted) throw new Error('Transfer is not ready for authorized review')
    const approval = await createHumanApproval(transactionContext, {
      organizationId: transfer.prescription.organization.id,
      locationId: transfer.prescription.location.id,
      actorId: userId,
      actionType: 'transfer',
      reason: args.reason,
      attested: args.attested,
      evidence: { transferId: transfer.id, consentId: transfer.consent.id },
    })
    await sudo.query.PrescriptionTransfer.updateOne({
      where: { id: transfer.id },
      data: { status: 'accepted', approval: { connect: { id: approval.id } } },
    })
    await recordAuditAndOutbox(transactionContext, {
      eventKey: `prescription_transfer.accepted:${transfer.id}`,
      organizationId: transfer.prescription.organization.id,
      locationId: transfer.prescription.location.id,
      actorId: userId,
      patientId: transfer.patient.id,
      eventType: 'prescription_transfer.accepted',
      resourceType: 'PrescriptionTransfer',
      resourceId: transfer.id,
      metadata: { consentId: transfer.consent.id, approvalId: approval.id },
    })
    return { success: true, reused: false, transferId: transfer.id, status: 'accepted', approvalId: approval.id }
  })
}
