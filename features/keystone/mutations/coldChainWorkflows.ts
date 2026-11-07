import type { Context } from '.keystone/types'
import { requirePermission, requireTenantMembership } from './lib/authorization'
import { createHumanApproval, recordAuditAndOutbox } from './lib/evidence'
import { withDomainTransaction } from './lib/transaction'
import { excursionDispositionError, lotAfterExcursionDisposition, QUARANTINABLE_LOT_STATUSES, type ExcursionDisposition } from '../workflows/pharmacy-state'
import { DomainError } from './lib/errors'

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
  if (!args.idempotencyKey?.trim() || !args.reason?.trim()) throw new DomainError('Idempotency key and reason are required')
  if (!Number.isFinite(args.observedMinimumC) || !Number.isFinite(args.observedMaximumC) || args.observedMinimumC > args.observedMaximumC) {
    throw new DomainError('Observed temperature range is invalid')
  }
  return withDomainTransaction(context, [`excursion-idempotency:${args.idempotencyKey}`, `lot:${args.lotId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const existing = await sudo.query.TemperatureExcursion.findOne({ where: { idempotencyKey: args.idempotencyKey }, query: 'id status lot { id } approval { id }' })
    if (existing) {
      if (existing.lot?.id !== args.lotId) throw new DomainError('Excursion idempotency key belongs to another lot')
      return { success: true, reused: true, excursionId: existing.id, lotId: existing.lot.id, status: existing.status, approvalId: existing.approval?.id }
    }
    const lot = await sudo.query.InventoryLot.findOne({
      where: { id: args.lotId },
      query: 'id status quantityAvailable product { id organization { id } } location { id } coldChainRequired',
    })
    if (!lot?.coldChainRequired) throw new DomainError('Cold-chain inventory lot not found')
    // A recalled, expired or empty lot already has a stronger status; an excursion must not downgrade it to quarantined.
    if (!QUARANTINABLE_LOT_STATUSES.includes(lot.status)) throw new DomainError(`A ${lot.status} lot cannot be quarantined for a temperature excursion`)
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

/**
 * The pharmacist's disposition of a temperature excursion. "released" puts the held stock back on
 * the shelf (never for a recalled or expired lot); "destroyed" writes the whole lot off and leaves it
 * depleted. Either way the excursion closes and cannot be resolved again.
 */
export async function resolveTemperatureExcursion(
  _root: unknown,
  args: { excursionId: string; disposition: string; note: string; idempotencyKey: string; attested: boolean },
  context: Context,
) {
  requirePermission(context, 'canManageInventory')
  if (!args.idempotencyKey?.trim()) throw new DomainError('Idempotency key is required')
  const candidate = await context.sudo().query.TemperatureExcursion.findOne({ where: { id: args.excursionId }, query: 'id lot { id }' })
  if (!candidate?.lot?.id) throw new DomainError('Temperature excursion not found')
  return withDomainTransaction(context, [`excursion:${args.excursionId}`, `lot:${candidate.lot.id}`, `excursion-disposition:${args.idempotencyKey}`], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const excursion = await sudo.query.TemperatureExcursion.findOne({
      where: { id: args.excursionId },
      query: 'id status resolutionNote organization { id } location { id } lot { id status expirationDate quantityAvailable quantityQuarantined product { id } location { id } }',
    })
    if (!excursion?.lot) throw new DomainError('Temperature excursion not found')
    const lot = excursion.lot
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: excursion.organization.id, locationId: excursion.location.id })
    const replay = await sudo.query.InventoryMovement.findOne({ where: { idempotencyKey: `excursion-disposition:${args.idempotencyKey}` }, query: 'id lot { id }' })
    if (replay) {
      if (replay.lot?.id !== lot.id || excursion.status !== args.disposition) throw new DomainError('Disposition idempotency key was reused with different input')
      return { success: true, reused: true, excursionId: excursion.id, lotId: lot.id, status: excursion.status, lotStatus: lot.status, quantityAvailable: lot.quantityAvailable, movementId: replay.id }
    }
    const refusal = excursionDispositionError({ excursionStatus: excursion.status, disposition: args.disposition, note: args.note, lotStatus: lot.status, lotExpiresAt: lot.expirationDate })
    if (refusal) throw new DomainError(refusal, 'TRANSITION_REFUSED')
    const disposition = args.disposition as ExcursionDisposition
    const otherOpen = await sudo.query.TemperatureExcursion.count({ where: { lot: { id: { equals: lot.id } }, id: { not: { equals: excursion.id } }, status: { in: ['open', 'under_review'] } } })
    const next = lotAfterExcursionDisposition(disposition, lot, disposition === 'destroyed' ? 0 : otherOpen)
    const note = args.note.trim()
    const approval = await createHumanApproval(transactionContext, {
      organizationId: excursion.organization.id,
      locationId: excursion.location.id,
      actorId: userId,
      actionType: 'cold_chain_disposition',
      reason: note,
      attested: args.attested,
      evidence: { action: `excursion_${disposition}`, excursionId: excursion.id, lotId: lot.id, writeOff: next.writeOff, idempotencyKey: args.idempotencyKey },
    })
    // Excursion evidence is immutable through the list API; the disposition is the one sanctioned write,
    // fenced on the open status so a concurrent resolve cannot close it twice.
    const closed = await (transactionContext.prisma as any).temperatureExcursion.updateMany({
      where: { id: excursion.id, status: { in: ['open', 'under_review'] } },
      data: { status: disposition, resolutionNote: note, resolvedAt: new Date(), reviewedById: userId, approvalId: approval.id },
    })
    if (closed.count !== 1) throw new DomainError('This excursion was resolved by someone else; reload it', 'TRANSITION_REFUSED')
    await sudo.query.InventoryLot.updateOne({
      where: { id: lot.id },
      data: {
        status: next.status,
        quantityAvailable: next.quantityAvailable,
        quantityQuarantined: next.quantityQuarantined,
        ...(disposition === 'released' && next.status !== 'quarantined' ? { coldChainEvidenceComplete: true } : {}),
      },
    })
    const movement = await sudo.query.InventoryMovement.createOne({
      data: {
        movementType: disposition === 'destroyed' ? 'destroy' : 'release',
        quantityDelta: -next.writeOff,
        reason: disposition === 'destroyed' ? `Write-off after temperature excursion: ${note}` : `Released after temperature excursion: ${note}`,
        idempotencyKey: `excursion-disposition:${args.idempotencyKey}`,
        organization: { connect: { id: excursion.organization.id } },
        location: { connect: { id: lot.location.id } },
        product: { connect: { id: lot.product.id } },
        lot: { connect: { id: lot.id } },
        actor: { connect: { id: userId } },
        approval: { connect: { id: approval.id } },
      },
      query: 'id',
    })
    await recordAuditAndOutbox(transactionContext, {
      eventKey: `cold_chain.excursion_${disposition}:${excursion.id}`,
      organizationId: excursion.organization.id,
      locationId: excursion.location.id,
      actorId: userId,
      eventType: `cold_chain.excursion_${disposition}`,
      resourceType: 'TemperatureExcursion',
      resourceId: excursion.id,
      metadata: { lotId: lot.id, movementId: movement.id, lotStatus: next.status, writeOff: next.writeOff, approvalId: approval.id },
    })
    return { success: true, reused: false, excursionId: excursion.id, lotId: lot.id, status: disposition, lotStatus: next.status, quantityAvailable: next.quantityAvailable, movementId: movement.id, approvalId: approval.id }
  })
}
