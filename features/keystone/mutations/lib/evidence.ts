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
 * Persists an immutable, idempotent audit snapshot on the supplied context.
 * Callers pass a transaction-bound context so domain state and evidence commit
 * or roll back together.
 */
export async function recordAudit(context: Context, input: EvidenceInput & { eventKey: string }) {
  const snapshotHash = evidencePayloadHash({
    eventType: input.eventType,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    organizationId: input.organizationId,
    locationId: input.locationId || null,
    actorId: input.actorId || null,
    patientId: input.patientId || null,
    data: input.metadata || {},
  })
  const sudo = context.sudo()
  const existing = await sudo.query.AuditEvent.findOne({
    where: { eventKey: input.eventKey },
    query: 'id eventType resourceType resourceId metadata organization { id } location { id } actor { id } patient { id }',
  })
  if (existing) {
    const existingHash = evidencePayloadHash({
      eventType: existing.eventType,
      resourceType: existing.resourceType,
      resourceId: existing.resourceId,
      organizationId: existing.organization?.id ?? input.organizationId,
      locationId: existing.location?.id || null,
      actorId: existing.actor?.id || null,
      patientId: existing.patient?.id || null,
      data: existing.metadata || {},
    })
    if (existingHash !== snapshotHash) throw new DomainError('Evidence idempotency key was reused with a different snapshot')
    return { created: false, auditEventId: existing.id }
  }
  const audit = await recordAuditEvent(context, input)
  return { created: true, auditEventId: audit.id }
}
