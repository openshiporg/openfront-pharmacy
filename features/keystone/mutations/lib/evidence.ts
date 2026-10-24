import { createHash } from 'node:crypto'
import type { Context } from '.keystone/types'
import { assertAuthorizedHumanApproval } from '../../workflows/pharmacy-state'
import { DomainError } from './errors'

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    )
  }
  return value
}

export function evidencePayloadHash(value: unknown) {
  return createHash('sha256').update(JSON.stringify(canonicalize(value))).digest('hex')
}

export async function createHumanApproval(
  context: Context,
  input: {
    organizationId: string
    locationId?: string | null
    actorId: string
    actionType: string
    reason: string
    attested: boolean
    evidence?: Record<string, unknown>
  },
) {
  assertAuthorizedHumanApproval(input)
  return context.sudo().query.HumanApproval.createOne({
    data: {
      organization: { connect: { id: input.organizationId } },
      location: input.locationId ? { connect: { id: input.locationId } } : undefined,
      actor: { connect: { id: input.actorId } },
      actionType: input.actionType,
      reason: input.reason,
      attested: true,
      evidence: (input.evidence || {}) as any,
    },
    query: 'id approvedAt',
  })
}

export type EvidenceInput = {
  eventKey?: string
  organizationId: string
  locationId?: string | null
  actorId?: string | null
  patientId?: string | null
  eventType: string
  resourceType: string
  resourceId: string
  metadata?: Record<string, unknown>
}

export async function recordAuditEvent(context: Context, input: EvidenceInput) {
  return context.sudo().query.AuditEvent.createOne({
    data: {
      eventKey: input.eventKey,
      organization: { connect: { id: input.organizationId } },
      location: input.locationId ? { connect: { id: input.locationId } } : undefined,
      actor: input.actorId ? { connect: { id: input.actorId } } : undefined,
      patient: input.patientId ? { connect: { id: input.patientId } } : undefined,
      actorType: input.actorId ? 'user' : 'guest',
      eventType: input.eventType,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      metadata: (input.metadata || {}) as any,
    },
    query: 'id eventKey',
  })
}

/**
 * Persists immutable audit and outbox snapshots on the supplied context. Callers
 * pass a transaction-bound context so domain state and evidence commit or roll
 * back together.
 */
export async function recordAuditAndOutbox(context: Context, input: EvidenceInput & { eventKey: string }) {
  const payload = canonicalize({
    eventKey: input.eventKey,
    eventType: input.eventType,
    occurredAt: new Date().toISOString(),
    aggregate: { type: input.resourceType, id: input.resourceId },
    tenant: { organizationId: input.organizationId, locationId: input.locationId || null },
    actorId: input.actorId || null,
    patientId: input.patientId || null,
    data: input.metadata || {},
  }) as Record<string, unknown>
  const payloadHash = evidencePayloadHash(payload)
  const sudo = context.sudo()
  const existing = await sudo.query.OutboxEvent.findOne({
    where: { eventKey: input.eventKey },
    query: 'id eventKey eventType payloadHash status',
  })
  if (existing) {
    if (existing.eventType !== input.eventType || existing.payloadHash !== payloadHash) {
      // occurredAt is intentionally excluded when comparing a replay below.
      const comparable = { ...payload, occurredAt: undefined }
      const existingEvent = await sudo.query.OutboxEvent.findOne({ where: { id: existing.id }, query: 'payload' })
      const existingComparable = { ...(existingEvent?.payload as any), occurredAt: undefined }
      if (evidencePayloadHash(comparable) !== evidencePayloadHash(existingComparable)) {
        throw new DomainError('Evidence idempotency key was reused with a different snapshot')
      }
    }
    return { created: false, auditEventId: null, outboxEventId: existing.id, status: existing.status }
  }
  const audit = await recordAuditEvent(context, input)
  const outbox = await sudo.query.OutboxEvent.createOne({
    data: {
      eventKey: input.eventKey,
      eventType: input.eventType,
      aggregateType: input.resourceType,
      aggregateId: input.resourceId,
      payload: payload as any,
      payloadHash,
      organization: { connect: { id: input.organizationId } },
      location: input.locationId ? { connect: { id: input.locationId } } : undefined,
    },
    query: 'id status',
  })
  return { created: true, auditEventId: audit.id, outboxEventId: outbox.id, status: outbox.status }
}
