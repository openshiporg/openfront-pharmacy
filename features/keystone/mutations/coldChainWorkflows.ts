import type { Context } from '.keystone/types'
import { requirePermission, requireTenantMembership } from './lib/authorization'
import { createHumanApproval, recordAuditAndOutbox } from './lib/evidence'
import { withDomainTransaction } from './lib/transaction'

export async function recordTemperatureExcursion(
  _root: unknown,
  args: {
    lotId: string
    observedMinimumC: number
    observedMaximumC: number
    startedAt: string
    endedAt?: string | null
    reason: string
    idempotencyKey: string
    attested: boolean
  },
  context: Context,
) {
  requirePermission(context, 'canManageInventory')
  if (!args.idempotencyKey?.trim() || !args.reason?.trim()) throw new Error('Idempotency key and reason are required')
  if (!Number.isFinite(args.observedMinimumC) || !Number.isFinite(args.observedMaximumC) || args.observedMinimumC > args.observedMaximumC) {
    throw new Error('Observed temperature range is invalid')
  }
  return withDomainTransaction(context, [`excursion-idempotency:${args.idempotencyKey}`, `lot:${args.lotId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const existing = await sudo.query.TemperatureExcursion.findOne({ where: { idempotencyKey: args.idempotencyKey }, query: 'id status lot { id } approval { id }' })
    if (existing) {
      if (existing.lot?.id !== args.lotId) throw new Error('Excursion idempotency key belongs to another lot')
      return { success: true, reused: true, excursionId: existing.id, lotId: existing.lot.id, status: existing.status, approvalId: existing.approval?.id }
    }
    const lot = await sudo.query.InventoryLot.findOne({
      where: { id: args.lotId },
      query: 'id quantityAvailable product { id organization { id } } location { id } coldChainRequired',
    })
    if (!lot?.coldChainRequired) throw new Error('Cold-chain inventory lot not found')
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: lot.product.organization.id, locationId: lot.location.id })
    const approval = await createHumanApproval(transactionContext, {
      organizationId: lot.product.organization.id,
      locationId: lot.location.id,
      actorId: userId,
      actionType: 'cold_chain_disposition',
      reason: args.reason,
      attested: args.attested,
      evidence: { action: 'quarantine_excursion', lotId: lot.id, observedMinimumC: args.observedMinimumC, observedMaximumC: args.observedMaximumC },
    })
    const excursion = await sudo.query.TemperatureExcursion.createOne({
      data: {
        idempotencyKey: args.idempotencyKey,
        observedMinimumC: args.observedMinimumC,
        observedMaximumC: args.observedMaximumC,
        startedAt: new Date(args.startedAt).toISOString(),
        endedAt: args.endedAt ? new Date(args.endedAt).toISOString() : undefined,
        status: 'open',
        dispositionReason: args.reason,
        organization: { connect: { id: lot.product.organization.id } },
        location: { connect: { id: lot.location.id } },
        lot: { connect: { id: lot.id } },
        reviewedBy: { connect: { id: userId } },
        approval: { connect: { id: approval.id } },
      },
      query: 'id status',
    })
    await sudo.query.InventoryLot.updateOne({ where: { id: lot.id }, data: { status: 'quarantined', quantityQuarantined: lot.quantityAvailable, coldChainEvidenceComplete: false } })
    await sudo.query.InventoryMovement.createOne({
      data: {
        movementType: 'quarantine',
        quantityDelta: 0,
        reason: args.reason,
        idempotencyKey: `cold-chain:${args.idempotencyKey}`,
        organization: { connect: { id: lot.product.organization.id } },
        location: { connect: { id: lot.location.id } },
        product: { connect: { id: lot.product.id } },
        lot: { connect: { id: lot.id } },
        actor: { connect: { id: userId } },
        approval: { connect: { id: approval.id } },
      },
    })
    await recordAuditAndOutbox(transactionContext, {
      eventKey: `cold_chain.excursion:${args.idempotencyKey}`,
      organizationId: lot.product.organization.id,
      locationId: lot.location.id,
      actorId: userId,
      eventType: 'cold_chain.excursion_recorded',
      resourceType: 'TemperatureExcursion',
      resourceId: excursion.id,
      metadata: { lotId: lot.id, status: 'quarantined', approvalId: approval.id },
    })
    return { success: true, reused: false, excursionId: excursion.id, lotId: lot.id, status: excursion.status, approvalId: approval.id }
  })
}
