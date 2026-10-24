import type { Context } from '.keystone/types'
import { requirePermission, requireTenantMembership } from './lib/authorization'
import { withDomainTransaction } from './lib/transaction'
import { DomainError } from './lib/errors'

export async function replayPharmacyOutboxEvent(
  _root: unknown,
  args: { eventId: string },
  context: Context,
) {
  requirePermission(context, 'canManageIntegrations')
  return withDomainTransaction(context, [`outbox:${args.eventId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const event = await sudo.query.OutboxEvent.findOne({
      where: { id: args.eventId },
      query: 'id eventKey status replayCount organization { id } location { id }',
    })
    if (!event) throw new DomainError('Outbox event not found')
    await requireTenantMembership(transactionContext, {
      organizationId: event.organization.id,
      locationId: event.location?.id,
    })
    if (event.status === 'pending') return { id: event.id, status: event.status, replayCount: event.replayCount, reused: true }
    if (!['failed', 'dead_letter'].includes(event.status)) throw new DomainError('Only failed or dead-letter outbox events can be replayed')
    const updated = await sudo.db.OutboxEvent.updateOne({
      where: { id: event.id },
      data: {
        status: 'pending',
        attempts: 0,
        replayCount: event.replayCount + 1,
        lastError: null,
        processedAt: null,
        nextAttemptAt: null,
        lockToken: null,
        lockedAt: null,
      },
    })
    return { id: updated.id, status: 'pending', replayCount: event.replayCount + 1, reused: false }
  })
}

