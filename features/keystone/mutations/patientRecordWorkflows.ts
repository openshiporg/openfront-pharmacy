import { createHash } from 'node:crypto'
import type { Context } from '.keystone/types'
import { requirePermission, requireTenantMembership } from './lib/authorization'
import { createHumanApproval, recordAuditAndOutbox } from './lib/evidence'
import { withDomainTransaction } from './lib/transaction'

function normalize(value: string) { return value.trim().replace(/\s+/g, ' ') }
function digest(value: unknown) { return createHash('sha256').update(JSON.stringify(value)).digest('hex') }
function safePatientNumber(value: string) {
  const normalized = value.trim().toUpperCase()
  if (!/^[A-Z0-9-]{3,40}$/.test(normalized)) throw new Error('Patient number must use 3-40 letters, numbers, or hyphens')
  return normalized
}

export async function createPharmacyPatient(
  _root: unknown,
  args: { organizationId: string; patientNumber: string; firstName: string; lastName: string; dateOfBirth: string; email?: string | null; phone?: string | null; preferredContactMethod: string; address?: Record<string, unknown> | null; identityMethod: string; identityReference: string; reason: string; attested: boolean },
  context: Context,
) {
  requirePermission(context, 'canManagePatients')
  const patientNumber = safePatientNumber(args.patientNumber)
  const firstName = normalize(args.firstName)
  const lastName = normalize(args.lastName)
  const dateOfBirth = new Date(args.dateOfBirth)
  if (!firstName || !lastName || Number.isNaN(dateOfBirth.getTime()) || dateOfBirth.getTime() >= Date.now()) throw new Error('Patient name and a past date of birth are required')
  if (!['phone', 'sms', 'email', 'portal', 'none'].includes(args.preferredContactMethod)) throw new Error('Preferred contact method is invalid')
  if (!args.identityMethod?.trim() || !args.identityReference?.trim()) throw new Error('Operator identity matching method and reference are required')
  const identityKey = `${args.organizationId}:${patientNumber}`
  const requestFingerprint = digest({ organizationId: args.organizationId, patientNumber, firstName, lastName, dateOfBirth: dateOfBirth.toISOString().slice(0, 10), email: args.email?.trim().toLowerCase() || '', phone: args.phone?.trim() || '', preferredContactMethod: args.preferredContactMethod, address: args.address || null, identityMethod: args.identityMethod.trim(), identityReference: args.identityReference.trim(), reason: args.reason?.trim(), attested: args.attested })
  return withDomainTransaction(context, [`patient-identity:${identityKey}`], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: args.organizationId, organizationWide: true })
    const existing = (await sudo.query.PatientProfile.findMany({ where: { identityKey: { equals: identityKey } }, take: 1, query: 'id patientNumber requestFingerprint status' }))[0]
    if (existing) {
      if (existing.requestFingerprint !== requestFingerprint) throw new Error('Patient identity already exists with different matching data')
      return { success: true, reused: true, patientId: existing.id, patientNumber: existing.patientNumber, status: existing.status }
    }
    const approval = await createHumanApproval(transactionContext, { organizationId: args.organizationId, actorId: userId, actionType: 'patient_record', reason: args.reason, attested: args.attested, evidence: { identityMethod: args.identityMethod.trim(), identityReference: args.identityReference.trim(), softwareIdentityValidationPerformed: false } })
    const patient = await sudo.query.PatientProfile.createOne({
      data: {
        patientNumber,
        identityKey,
        requestFingerprint,
        firstName,
        lastName,
        dateOfBirth: dateOfBirth.toISOString(),
        email: args.email?.trim().toLowerCase() || undefined,
        phone: args.phone?.trim() || undefined,
        preferredContactMethod: args.preferredContactMethod,
        address: args.address as any || undefined,
        identityVerificationStatus: 'confirmed',
        identityReference: args.identityReference.trim(),
        identityVerifiedAt: new Date().toISOString(),
        identityVerifiedBy: { connect: { id: userId } },
        identityEvidence: { method: args.identityMethod.trim(), reference: args.identityReference.trim(), recordedAt: new Date().toISOString(), approvalId: approval.id, softwareValidationPerformed: false },
        organizations: { connect: [{ id: args.organizationId }] },
      },
      query: 'id patientNumber status',
    })
    await recordAuditAndOutbox(transactionContext, { eventKey: `patient.created:${identityKey}`, organizationId: args.organizationId, actorId: userId, patientId: patient.id, eventType: 'patient.created', resourceType: 'PatientProfile', resourceId: patient.id, metadata: { patientNumber, approvalId: approval.id, identityMethod: args.identityMethod.trim(), softwareIdentityValidationPerformed: false } })
    return { success: true, reused: false, patientId: patient.id, patientNumber: patient.patientNumber, status: patient.status }
  })
}

export async function updatePharmacyPatientContact(
  _root: unknown,
  args: { patientId: string; email?: string | null; phone?: string | null; preferredContactMethod: string; address?: Record<string, unknown> | null; idempotencyKey: string; reason: string; attested: boolean },
  context: Context,
) {
  requirePermission(context, 'canManagePatients')
  if (!args.idempotencyKey?.trim()) throw new Error('Idempotency key is required')
  if (!['phone', 'sms', 'email', 'portal', 'none'].includes(args.preferredContactMethod)) throw new Error('Preferred contact method is invalid')
  const requestFingerprint = digest({ patientId: args.patientId, email: args.email?.trim().toLowerCase() || '', phone: args.phone?.trim() || '', preferredContactMethod: args.preferredContactMethod, address: args.address || null, reason: args.reason?.trim(), attested: args.attested })
  return withDomainTransaction(context, [`patient:${args.patientId}`, `patient-contact:${args.idempotencyKey}`], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const patient = await sudo.query.PatientProfile.findOne({ where: { id: args.patientId }, query: 'id organizations { id }' })
    if (!patient?.organizations?.length) throw new Error('Patient not found')
    const organizationId = patient.organizations[0].id
    const { userId } = await requireTenantMembership(transactionContext, { organizationId, organizationWide: true })
    const existingEvent = await sudo.query.AuditEvent.findOne({ where: { eventKey: `patient.contact_updated:${args.idempotencyKey}` }, query: 'id resourceId metadata' })
    if (existingEvent) {
      if (existingEvent.resourceId !== patient.id || existingEvent.metadata?.requestFingerprint !== requestFingerprint) throw new Error('Patient contact idempotency key was reused with different input')
      return { success: true, reused: true, patientId: patient.id, status: 'active' }
    }
    const approval = await createHumanApproval(transactionContext, { organizationId, actorId: userId, actionType: 'patient_record', reason: args.reason, attested: args.attested, evidence: { action: 'contact_update', patientId: patient.id, requestFingerprint } })
    await (transactionContext.prisma as any).patientProfile.update({ where: { id: patient.id }, data: { email: args.email?.trim().toLowerCase() || '', phone: args.phone?.trim() || '', preferredContactMethod: args.preferredContactMethod, address: args.address || null } })
    await recordAuditAndOutbox(transactionContext, { eventKey: `patient.contact_updated:${args.idempotencyKey}`, organizationId, actorId: userId, patientId: patient.id, eventType: 'patient.contact_updated', resourceType: 'PatientProfile', resourceId: patient.id, metadata: { approvalId: approval.id, preferredContactMethod: args.preferredContactMethod, requestFingerprint } })
    return { success: true, reused: false, patientId: patient.id, status: 'active' }
  })
}

export async function recordPharmacyPatientAllergy(
  _root: unknown,
  args: { patientId: string; allergen: string; reaction: string; severity: string; source: string; sourceReference: string; idempotencyKey: string; reason: string; attested: boolean },
  context: Context,
) {
  requirePermission(context, 'canManagePatients')
  if (!['unknown', 'mild', 'moderate', 'severe'].includes(args.severity)) throw new Error('Allergy severity is invalid')
  return recordPatientHistoryEntry(transactionInput('allergy', args), context)
}

export async function recordPharmacyPatientMedication(
  _root: unknown,
  args: { patientId: string; medicationName: string; directions?: string | null; source: string; sourceReference: string; idempotencyKey: string; reason: string; attested: boolean },
  context: Context,
) {
  requirePermission(context, 'canManagePatients')
  return recordPatientHistoryEntry(transactionInput('medication', args), context)
}

function transactionInput(kind: 'allergy' | 'medication', args: any) { return { kind, args } as const }

async function recordPatientHistoryEntry(input: ReturnType<typeof transactionInput>, context: Context) {
  const { kind, args } = input
  if (!args.idempotencyKey?.trim() || !args.source?.trim() || !args.sourceReference?.trim()) throw new Error('Idempotency key and source evidence are required')
  const label = normalize(kind === 'allergy' ? args.allergen : args.medicationName)
  if (!label || (kind === 'allergy' && !normalize(args.reaction))) throw new Error(`${kind === 'allergy' ? 'Allergen and reaction' : 'Medication name'} are required`)
  return withDomainTransaction(context, [`patient:${args.patientId}`, `${kind}:${args.idempotencyKey}`], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const patient = await sudo.query.PatientProfile.findOne({ where: { id: args.patientId }, query: 'id organizations { id }' })
    if (!patient?.organizations?.length) throw new Error('Patient not found')
    const organizationId = patient.organizations[0].id
    const { userId } = await requireTenantMembership(transactionContext, { organizationId, organizationWide: true })
    const requestFingerprint = digest({ organizationId, patientId: patient.id, kind, label, reaction: args.reaction?.trim() || '', directions: args.directions?.trim() || '', severity: args.severity || '', source: args.source.trim(), sourceReference: args.sourceReference.trim(), reason: args.reason?.trim(), attested: args.attested })
    const key = `${kind}:${organizationId}:${args.idempotencyKey.trim()}`
    const model = kind === 'allergy' ? sudo.query.PatientAllergy : sudo.query.PatientMedication
    const uniqueField = kind === 'allergy' ? 'allergyKey' : 'medicationKey'
    const existing = (await model.findMany({ where: { [uniqueField]: { equals: key } }, take: 1, query: `id requestFingerprint` }))[0]
    if (existing) {
      if (existing.requestFingerprint !== requestFingerprint) throw new Error(`${kind} idempotency key is already bound to different evidence`)
      return { success: true, reused: true, recordId: existing.id, status: 'active' }
    }
    const approval = await createHumanApproval(transactionContext, { organizationId, actorId: userId, actionType: 'patient_record', reason: args.reason, attested: args.attested, evidence: { action: `${kind}_recorded`, sourceReference: args.sourceReference.trim() } })
    const common = { [uniqueField]: key, requestFingerprint, source: args.source.trim(), sourceReference: args.sourceReference.trim(), organization: { connect: { id: organizationId } }, patient: { connect: { id: patient.id } }, recordedBy: { connect: { id: userId } }, approval: { connect: { id: approval.id } } }
    const record = kind === 'allergy'
      ? await sudo.query.PatientAllergy.createOne({ data: { ...common, allergen: label, reaction: normalize(args.reaction), severity: args.severity }, query: 'id status' })
      : await sudo.query.PatientMedication.createOne({ data: { ...common, medicationName: label, directions: args.directions?.trim() || undefined }, query: 'id status' })
    await recordAuditAndOutbox(transactionContext, { eventKey: `patient.${kind}_recorded:${args.idempotencyKey}`, organizationId, actorId: userId, patientId: patient.id, eventType: `patient.${kind}_recorded`, resourceType: kind === 'allergy' ? 'PatientAllergy' : 'PatientMedication', resourceId: record.id, metadata: { approvalId: approval.id, sourceReference: args.sourceReference.trim() } })
    return { success: true, reused: false, recordId: record.id, status: record.status }
  })
}
