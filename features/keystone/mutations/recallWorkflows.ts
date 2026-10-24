import { createHash } from 'node:crypto'
import type { Context } from '.keystone/types'
import { assessRecallExposureReconciliation, recallExposureMovementWhere } from '../workflows/recall-exposure'
import { requirePermission, requireTenantMembership } from './lib/authorization'
import { createHumanApproval, recordAuditAndOutbox } from './lib/evidence'
import { withDomainTransaction } from './lib/transaction'
import { DomainError } from './lib/errors'

async function reconcileRecallExposures(context: Context, recallId: string) {
  return withDomainTransaction(context, [`recall-exposures:${recallId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const recall = await sudo.query.Recall.findOne({ where: { id: recallId }, query: 'id status recallNumber classification sourceValidationReference organization { id } location { id } lots { id } approval { id }' })
    if (!recall?.organization?.id) throw new DomainError('Recall exposure reconciliation scope is incomplete')
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: recall.organization.id, locationId: recall.location?.id, organizationWide: !recall.location?.id })
    const lotIds = (recall.lots || []).map((lot: any) => lot.id)
    const candidateWhere = recallExposureMovementWhere(lotIds)
    const [candidateMovementCount, candidateMovements] = await Promise.all([
      sudo.query.InventoryMovement.count({ where: candidateWhere }),
      sudo.query.InventoryMovement.findMany({ where: candidateWhere, orderBy: { occurredAt: 'asc' }, take: 10_000, query: 'id quantityDelta patient { id } prescription { id } order { id } location { id }' }),
    ])
    const candidateMovementIds = candidateMovements.map((movement: any) => movement.id)
    const initialLinks = candidateMovementIds.length ? await sudo.query.RecallExposure.findMany({ where: { recall: { id: { equals: recall.id } }, movement: { id: { in: candidateMovementIds } } }, take: 10_000, query: 'id movement { id }' }) : []
    const alreadyLinkedMovementIds = new Set((initialLinks as any[]).map((entry) => entry.movement?.id).filter(Boolean))
    if (recall.status !== 'closed') {
      for (const movement of candidateMovements as any[]) {
        if (!movement.patient?.id || !movement.location?.id || alreadyLinkedMovementIds.has(movement.id)) continue
        const exposureKey = `${recall.id}:${movement.id}`
        await sudo.query.RecallExposure.createOne({
          data: {
            exposureKey,
            status: 'outreach_required',
            quantityDispensed: Math.abs(movement.quantityDelta),
            organization: { connect: { id: recall.organization.id } },
            location: { connect: { id: movement.location.id } },
            recall: { connect: { id: recall.id } },
            movement: { connect: { id: movement.id } },
            patient: { connect: { id: movement.patient.id } },
            prescription: movement.prescription?.id ? { connect: { id: movement.prescription.id } } : undefined,
            order: movement.order?.id ? { connect: { id: movement.order.id } } : undefined,
          },
        })
      }
    }
    const linkedRows = candidateMovementIds.length ? await sudo.query.RecallExposure.findMany({ where: { recall: { id: { equals: recall.id } }, movement: { id: { in: candidateMovementIds } } }, take: 10_000, query: 'id movement { id }' }) : []
    const linkedMovementIds = (linkedRows as any[]).map((entry) => entry.movement?.id).filter(Boolean)
    const exposureCount = await sudo.query.RecallExposure.count({ where: { recall: { id: { equals: recall.id } } } })
    const reconciliation = assessRecallExposureReconciliation({ candidateMovementCount, linkedMovementIds, exposureCount, linkedExposureCount: linkedRows.length })
    const { unlinkedExposureCount, exposureReconciliationComplete } = reconciliation
    if (recall.status !== 'closed') {
      await recordAuditAndOutbox(transactionContext, {
        eventKey: `recall.opened:${recall.organization.id}:${recall.recallNumber}`,
        organizationId: recall.organization.id,
        locationId: recall.location?.id,
        actorId: userId,
        eventType: 'recall.opened_and_quarantined',
        resourceType: 'Recall',
        resourceId: recall.id,
        metadata: { recallNumber: recall.recallNumber, classification: recall.classification, sourceReference: recall.sourceValidationReference, lotIds, exposureReconciliationStatus: 'pending', approvalId: recall.approval?.id },
      })
      await recordAuditAndOutbox(transactionContext, {
        eventKey: `recall.exposure_reconciliation:${recall.id}:${candidateMovementCount}:${reconciliation.linkedMovementCount}:${exposureCount}:${exposureReconciliationComplete}`,
        organizationId: recall.organization.id,
        locationId: recall.location?.id,
        actorId: userId,
        eventType: 'recall.exposure_reconciliation_recorded',
        resourceType: 'Recall',
        resourceId: recall.id,
        metadata: { candidateMovementCount, linkedMovementCount: reconciliation.linkedMovementCount, exposureCount, unlinkedExposureCount, complete: exposureReconciliationComplete },
      })
    }
    return { candidateMovementCount, linkedMovementCount: reconciliation.linkedMovementCount, exposureCount, unlinkedExposureCount, exposureReconciliationComplete }
  })
}

export async function openPharmacyRecall(
  _root: unknown,
  args: {
    organizationId: string
    locationId?: string | null
    recallNumber: string
    classification: string
    reason: string
    source: string
    sourceReference: string
    lotIds: string[]
    attested: boolean
  },
  context: Context,
) {
  requirePermission(context, 'canManageRecalls')
  if (!['class_i', 'class_ii', 'class_iii', 'market_withdrawal'].includes(args.classification)) throw new DomainError('Recall classification is invalid')
  if (!args.recallNumber?.trim() || !args.reason?.trim() || !args.source?.trim() || !args.sourceReference?.trim() || !args.lotIds.length) throw new DomainError('Recall number, reason, source, source reference, and affected lots are required')
  const requestFingerprint = createHash('sha256').update(JSON.stringify({ organizationId: args.organizationId, locationId: args.locationId || null, recallNumber: args.recallNumber.trim(), classification: args.classification, reason: args.reason.trim(), source: args.source.trim(), sourceReference: args.sourceReference.trim(), lotIds: [...new Set(args.lotIds)].sort(), attested: args.attested })).digest('hex')
  const holdResult = await withDomainTransaction(context, [`recall-number:${args.recallNumber.trim()}`, ...args.lotIds.map((id) => `lot:${id}`)], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const existing = await sudo.query.Recall.findOne({ where: { recallNumber: args.recallNumber.trim() }, query: 'id status organization { id } location { id } lots { id } approval { id evidence }' })
    if (existing) {
      if (!existing.organization?.id) throw new DomainError('Recall replay scope is incomplete; operator reconciliation is required')
      await requireTenantMembership(transactionContext, { organizationId: existing.organization.id, locationId: existing.location?.id, organizationWide: !existing.location?.id })
      if (existing.approval?.evidence?.requestFingerprint !== requestFingerprint) throw new DomainError('Recall number was reused with different input')
      return { success: true, reused: true, recallId: existing.id, status: existing.status, lotCount: existing.lots.length, approvalId: existing.approval?.id }
    }
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: args.organizationId, locationId: args.locationId, organizationWide: !args.locationId })
    const lots = await sudo.query.InventoryLot.findMany({
      where: { id: { in: [...new Set(args.lotIds)] } },
      query: 'id quantityAvailable product { id organization { id } } location { id }',
    })
    if (lots.length !== new Set(args.lotIds).size || lots.some((lot: any) => lot.product?.organization?.id !== args.organizationId || args.locationId && lot.location?.id !== args.locationId)) {
      throw new DomainError('Every affected lot must belong to this pharmacy')
    }
    const approval = await createHumanApproval(transactionContext, {
      organizationId: args.organizationId,
      locationId: args.locationId,
      actorId: userId,
      actionType: 'recall_disposition',
      reason: args.reason,
      attested: args.attested,
      evidence: { action: 'open', recallNumber: args.recallNumber.trim(), classification: args.classification, lotIds: lots.map((lot: any) => lot.id), requestFingerprint },
    })
    const recall = await sudo.query.Recall.createOne({
      data: {
        recallNumber: args.recallNumber.trim(),
        classification: args.classification,
        status: 'active',
        reason: args.reason.trim(),
        source: args.source.trim(),
        sourceValidationReference: args.sourceReference.trim(),
        organization: { connect: { id: args.organizationId } },
        location: args.locationId ? { connect: { id: args.locationId } } : undefined,
        lots: { connect: lots.map((lot: any) => ({ id: lot.id })) },
        approval: { connect: { id: approval.id } },
      },
      query: 'id status',
    })
    for (const lot of lots as any[]) {
      await sudo.query.InventoryLot.updateOne({
        where: { id: lot.id },
        data: { status: 'recalled', quantityQuarantined: lot.quantityAvailable },
      })
      await sudo.query.InventoryMovement.createOne({
        data: {
          movementType: 'recall',
          quantityDelta: 0,
          reason: args.reason.trim(),
          idempotencyKey: `recall:${recall.id}:lot:${lot.id}`,
          organization: { connect: { id: args.organizationId } },
          location: { connect: { id: lot.location.id } },
          product: { connect: { id: lot.product.id } },
          lot: { connect: { id: lot.id } },
          actor: { connect: { id: userId } },
          approval: { connect: { id: approval.id } },
        },
      })
    }
    await sudo.query.Recall.updateOne({ where: { id: recall.id }, data: { status: 'quarantined' } })
    return { success: true, reused: false, recallId: recall.id, status: 'quarantined', lotCount: lots.length, approvalId: approval.id }
  })
  try {
    const reconciliation = await reconcileRecallExposures(context, holdResult.recallId)
    return { ...holdResult, unlinkedExposureCount: reconciliation.unlinkedExposureCount }
  } catch {
    throw new DomainError(`Recall hold ${holdResult.recallId} is committed, but exposure reconciliation did not complete. Verify the recall task and retry the same recall input; do not assume the hold failed.`)
  }
}

export async function recordRecallExposureAction(
  _root: unknown,
  args: { exposureId: string; status: string; contactMethod: string; outcome: string; notes?: string | null; reason: string; attested: boolean },
  context: Context,
) {
  requirePermission(context, 'canManageRecalls')
  if (!['contacted', 'returned', 'resolved', 'unable_to_reach'].includes(args.status)) throw new DomainError('Recall exposure status is invalid')
  if (!args.contactMethod?.trim() || !args.outcome?.trim()) throw new DomainError('Contact method and outcome are required')
  const requestFingerprint = createHash('sha256').update(JSON.stringify({ exposureId: args.exposureId, status: args.status, contactMethod: args.contactMethod.trim(), outcome: args.outcome.trim(), notes: args.notes?.trim() || null, reason: args.reason?.trim(), attested: args.attested })).digest('hex')
  return withDomainTransaction(context, [`recall-exposure:${args.exposureId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const exposure = await sudo.query.RecallExposure.findOne({ where: { id: args.exposureId }, query: 'id status organization { id } location { id } recall { id status } patient { id } approval { id evidence }' })
    if (!exposure || !['quarantined', 'resolved'].includes(exposure.recall?.status)) throw new DomainError('Recall exposure is not actionable')
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: exposure.organization.id, locationId: exposure.location.id })
    if (exposure.status === args.status && exposure.approval?.id && exposure.approval.evidence?.requestFingerprint !== requestFingerprint) throw new DomainError('Recall exposure replay input does not match the recorded action')
    if (exposure.status === args.status && exposure.approval?.id) return { success: true, reused: true, exposureId: exposure.id, status: exposure.status, approvalId: exposure.approval.id }
    if (['returned', 'resolved', 'unable_to_reach'].includes(exposure.status)) throw new DomainError('Recall exposure is already resolved')
    const approval = await createHumanApproval(transactionContext, { organizationId: exposure.organization.id, locationId: exposure.location.id, actorId: userId, actionType: 'recall_disposition', reason: args.reason, attested: args.attested, evidence: { exposureId: exposure.id, status: args.status, contactMethod: args.contactMethod.trim(), outcome: args.outcome.trim(), requestFingerprint, custodyClaimed: false } })
    const resolved = ['returned', 'resolved', 'unable_to_reach'].includes(args.status)
    await (transactionContext.prisma as any).recallExposure.update({ where: { id: exposure.id }, data: { status: args.status, contactMethod: args.contactMethod.trim(), outcome: args.outcome.trim(), notes: args.notes?.trim() || null, lastActionAt: new Date(), resolvedAt: resolved ? new Date() : null, lastActorId: userId, approvalId: approval.id } })
    await recordAuditAndOutbox(transactionContext, { eventKey: `recall.exposure_${args.status}:${exposure.id}:${approval.id}`, organizationId: exposure.organization.id, locationId: exposure.location.id, actorId: userId, patientId: exposure.patient.id, eventType: `recall.exposure_${args.status}`, resourceType: 'RecallExposure', resourceId: exposure.id, metadata: { recallId: exposure.recall.id, approvalId: approval.id, contactMethod: args.contactMethod.trim(), custodyClaimed: false } })
    return { success: true, reused: false, exposureId: exposure.id, status: args.status, approvalId: approval.id }
  })
}

export async function disposeRecallLot(
  _root: unknown,
  args: { recallId: string; lotId: string; quantity: number; dispositionReference: string; idempotencyKey: string; reason: string; attested: boolean },
  context: Context,
) {
  requirePermission(context, 'canManageRecalls')
  if (!Number.isInteger(args.quantity) || args.quantity < 1 || !args.dispositionReference?.trim() || !args.idempotencyKey?.trim()) throw new DomainError('Quantity, disposition reference, and idempotency key are required')
  const requestFingerprint = createHash('sha256').update(JSON.stringify({ recallId: args.recallId, lotId: args.lotId, quantity: args.quantity, dispositionReference: args.dispositionReference.trim(), reason: args.reason?.trim(), attested: args.attested })).digest('hex')
  return withDomainTransaction(context, [`recall:${args.recallId}`, `lot:${args.lotId}`, `recall-disposition:${args.idempotencyKey}`], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const recall = await sudo.query.Recall.findOne({ where: { id: args.recallId }, query: 'id status organization { id } location { id } lots { id quantityAvailable quantityQuarantined product { id } location { id } }' })
    const lot = recall?.lots?.find((entry: any) => entry.id === args.lotId)
    if (!recall || !recall.organization?.id || !lot?.location?.id) throw new DomainError('Recall disposition scope is incomplete; operator reconciliation is required')
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: recall.organization.id, locationId: lot.location.id })
    const existing = await sudo.query.InventoryMovement.findOne({ where: { idempotencyKey: `recall-disposition:${args.idempotencyKey}` }, query: 'id requestFingerprint lot { id }' })
    if (existing) {
      if (existing.lot?.id !== args.lotId || existing.requestFingerprint !== requestFingerprint) throw new DomainError('Disposition idempotency key was reused with different input')
      return { success: true, reused: true, recallId: args.recallId, lotId: args.lotId, movementId: existing.id, status: 'disposed' }
    }
    if (recall.status !== 'quarantined') throw new DomainError('Quarantined recall lot not found')
    if (args.quantity !== lot.quantityQuarantined || args.quantity > lot.quantityAvailable) throw new DomainError('Bounded recall disposition must dispose the complete quarantined quantity')
    const approval = await createHumanApproval(transactionContext, { organizationId: recall.organization.id, locationId: lot.location.id, actorId: userId, actionType: 'recall_disposition', reason: args.reason, attested: args.attested, evidence: { recallId: recall.id, lotId: lot.id, quantity: args.quantity, dispositionReference: args.dispositionReference.trim(), physicalDispositionRecorded: true } })
    await sudo.query.InventoryLot.updateOne({ where: { id: lot.id }, data: { quantityAvailable: lot.quantityAvailable - args.quantity, quantityQuarantined: 0, status: lot.quantityAvailable - args.quantity === 0 ? 'depleted' : 'recalled' } })
    const movement = await sudo.query.InventoryMovement.createOne({ data: { movementType: 'destroy', quantityDelta: -args.quantity, reason: args.reason, idempotencyKey: `recall-disposition:${args.idempotencyKey}`, requestFingerprint, organization: { connect: { id: recall.organization.id } }, location: { connect: { id: lot.location.id } }, product: { connect: { id: lot.product.id } }, lot: { connect: { id: lot.id } }, actor: { connect: { id: userId } }, approval: { connect: { id: approval.id } } }, query: 'id' })
    await recordAuditAndOutbox(transactionContext, { eventKey: `recall.lot_disposed:${args.idempotencyKey}`, organizationId: recall.organization.id, locationId: lot.location.id, actorId: userId, eventType: 'recall.lot_disposed', resourceType: 'InventoryLot', resourceId: lot.id, metadata: { recallId: recall.id, movementId: movement.id, quantity: args.quantity, dispositionReference: args.dispositionReference.trim(), approvalId: approval.id } })
    return { success: true, reused: false, recallId: recall.id, lotId: lot.id, movementId: movement.id, status: 'disposed' }
  })
}

export async function closePharmacyRecall(
  _root: unknown,
  args: { recallId: string; reason: string; attested: boolean },
  context: Context,
) {
  requirePermission(context, 'canManageRecalls')
  return withDomainTransaction(context, [`recall:${args.recallId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const recall = await sudo.query.Recall.findOne({ where: { id: args.recallId }, query: 'id status organization { id } location { id } closedAt approval { id reason actionType } lots { id quantityQuarantined } exposures(take: 10000) { id status }' })
    if (!recall) throw new DomainError('Recall not found')
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: recall.organization.id, locationId: recall.location?.id, organizationWide: !recall.location?.id })
    const candidateWhere = recallExposureMovementWhere((recall.lots || []).map((lot: any) => lot.id))
    const [candidateMovementCount, candidateMovements, exposureCount] = await Promise.all([
      sudo.query.InventoryMovement.count({ where: candidateWhere }),
      sudo.query.InventoryMovement.findMany({ where: candidateWhere, orderBy: { occurredAt: 'asc' }, take: 10_000, query: 'id' }),
      sudo.query.RecallExposure.count({ where: { recall: { id: { equals: recall.id } } } }),
    ])
    const candidateMovementIds = candidateMovements.map((movement: any) => movement.id)
    const linkedRows = candidateMovementIds.length ? await sudo.query.RecallExposure.findMany({ where: { recall: { id: { equals: recall.id } }, movement: { id: { in: candidateMovementIds } } }, take: 10_000, query: 'id movement { id }' }) : []
    const linkedMovementIds = (linkedRows as any[]).map((entry) => entry.movement?.id).filter(Boolean)
    const reconciliation = assessRecallExposureReconciliation({ candidateMovementCount, linkedMovementIds, exposureCount, linkedExposureCount: linkedRows.length })
    const exposureReconciliationComplete = reconciliation.exposureReconciliationComplete && exposureCount === (recall.exposures || []).length
    if (recall.status === 'closed' && !exposureReconciliationComplete) throw new DomainError('Recall exposure reconciliation is incomplete; closure evidence requires operator review')
    if (recall.status === 'closed' && (recall.approval?.actionType !== 'recall_disposition' || recall.approval?.reason !== args.reason)) throw new DomainError('Recall closure replay does not match the recorded reason')
    if (recall.status === 'closed') return { success: true, reused: true, recallId: recall.id, status: recall.status, approvalId: recall.approval?.id }
    if (!['quarantined', 'resolved'].includes(recall.status)) throw new DomainError('Recall is not ready for closure')
    if (!exposureReconciliationComplete) throw new DomainError('Every sale/dispense movement must have a recorded exposure before recall closure')
    if (recall.lots.some((lot: any) => lot.quantityQuarantined > 0)) throw new DomainError('All quarantined lot quantities require recorded disposition before closure')
    if (recall.exposures.some((exposure: any) => !['returned', 'resolved', 'unable_to_reach'].includes(exposure.status))) throw new DomainError('Every dispensed exposure requires a resolved outreach record before closure')
    const approval = await createHumanApproval(transactionContext, { organizationId: recall.organization.id, locationId: recall.location?.id, actorId: userId, actionType: 'recall_disposition', reason: args.reason, attested: args.attested, evidence: { recallId: recall.id, lotCount: recall.lots.length, exposureCount: recall.exposures.length, allDispositionRecorded: true } })
    await sudo.query.Recall.updateOne({ where: { id: recall.id }, data: { status: 'closed', closedAt: new Date().toISOString(), approval: { connect: { id: approval.id } } } })
    await recordAuditAndOutbox(transactionContext, { eventKey: `recall.closed:${recall.id}:${approval.id}`, organizationId: recall.organization.id, locationId: recall.location?.id, actorId: userId, eventType: 'recall.closed', resourceType: 'Recall', resourceId: recall.id, metadata: { approvalId: approval.id, lotCount: recall.lots.length, exposureCount: recall.exposures.length } })
    return { success: true, reused: false, recallId: recall.id, status: 'closed', approvalId: approval.id }
  })
}
