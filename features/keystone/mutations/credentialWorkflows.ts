import type { Context } from '.keystone/types'
import { isValidNpi } from '../workflows/prescription-eligibility'
import { requirePermission, requireTenantMembership } from './lib/authorization'
import { createHumanApproval, recordAuditAndOutbox } from './lib/evidence'
import { withDomainTransaction } from './lib/transaction'
import { DomainError } from './lib/errors'

type CredentialEvidence = {
  credentialType: string
  jurisdiction: string
  identifier: string
  expiresAt: string
  verificationReference: string
  reason: string
  attested: boolean
}

function validateCredentialEvidence(args: CredentialEvidence) {
  const expiresAt = new Date(args.expiresAt)
  if (![args.credentialType, args.jurisdiction, args.identifier, args.verificationReference].every((value) => value?.trim())) {
    throw new DomainError('Credential type, jurisdiction, identifier, expiration, and source reference are required')
  }
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) throw new DomainError('Credential review expiration must be in the future')
  if (expiresAt.getTime() > Date.now() + 5 * 366 * 86_400_000) throw new DomainError('Credential review expiration is outside the supported review window')
  return expiresAt
}

export async function recordPharmacyStaffCredentialReview(
  _root: unknown,
  args: CredentialEvidence & { membershipId: string },
  context: Context,
) {
  requirePermission(context, 'canManageUsers')
  requirePermission(context, 'canApproveConsequentialActions')
  const expiresAt = validateCredentialEvidence(args)
  return withDomainTransaction(context, [`membership:${args.membershipId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const membership = await sudo.query.OrganizationMembership.findOne({
      where: { id: args.membershipId },
      query: 'id membershipRole status organization { id } location { id } user { id } externalCredentialValidated credentialValidationReference credentialExpiresAt',
    })
    if (!membership || membership.status !== 'active' || !['owner', 'pharmacist'].includes(membership.membershipRole)) throw new DomainError('Active owner or pharmacist membership not found')
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: membership.organization.id, locationId: membership.location?.id })
    const approval = await createHumanApproval(transactionContext, {
      organizationId: membership.organization.id,
      locationId: membership.location?.id,
      actorId: userId,
      actionType: 'credential_review',
      reason: args.reason,
      attested: args.attested,
      evidence: { membershipId: membership.id, subjectUserId: membership.user.id, verificationMethod: 'organization_recorded', verificationReference: args.verificationReference.trim(), credentialType: args.credentialType.trim(), jurisdiction: args.jurisdiction.trim(), expiresAt: expiresAt.toISOString(), softwareValidationPerformed: false },
    })
    const prisma = transactionContext.prisma as any
    await prisma.organizationMembership.update({
      where: { id: membership.id },
      data: {
        externalCredentialValidated: true,
        credentialVerificationMethod: 'organization_recorded',
        credentialType: args.credentialType.trim(),
        credentialJurisdiction: args.jurisdiction.trim(),
        credentialIdentifier: args.identifier.trim(),
        credentialValidationReference: args.verificationReference.trim(),
        credentialValidatedAt: new Date(),
        credentialExpiresAt: expiresAt,
        credentialVerifiedById: userId,
      },
    })
    await recordAuditAndOutbox(transactionContext, {
      eventKey: `membership.credential_reviewed:${membership.id}:${approval.id}`,
      organizationId: membership.organization.id,
      locationId: membership.location?.id,
      actorId: userId,
      eventType: 'membership.credential_review_recorded',
      resourceType: 'OrganizationMembership',
      resourceId: membership.id,
      metadata: { approvalId: approval.id, expiresAt: expiresAt.toISOString(), verificationMethod: 'organization_recorded', softwareValidationPerformed: false },
    })
    return { success: true, membershipId: membership.id, status: 'recorded', expiresAt: expiresAt.toISOString(), approvalId: approval.id }
  })
}

export async function recordPharmacyPrescriberCredentialReview(
  _root: unknown,
  args: CredentialEvidence & { prescriberId: string },
  context: Context,
) {
  requirePermission(context, 'canReviewPrescriptions')
  requirePermission(context, 'canApproveConsequentialActions')
  const expiresAt = validateCredentialEvidence(args)
  return withDomainTransaction(context, [`prescriber:${args.prescriberId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const prescriber = await sudo.query.Prescriber.findOne({ where: { id: args.prescriberId }, query: 'id npi organization { id }' })
    if (!prescriber || !isValidNpi(prescriber.npi)) throw new DomainError('Prescriber with a valid NPI is required')
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: prescriber.organization.id, pharmacist: true })
    const approval = await createHumanApproval(transactionContext, {
      organizationId: prescriber.organization.id,
      actorId: userId,
      actionType: 'credential_review',
      reason: args.reason,
      attested: args.attested,
      evidence: { prescriberId: prescriber.id, verificationMethod: 'organization_recorded', verificationReference: args.verificationReference.trim(), credentialType: args.credentialType.trim(), jurisdiction: args.jurisdiction.trim(), expiresAt: expiresAt.toISOString(), softwareValidationPerformed: false },
    })
    const prisma = transactionContext.prisma as any
    await prisma.prescriber.update({
      where: { id: prescriber.id },
      data: {
        verificationStatus: 'validated',
        externalValidationComplete: true,
        verificationMethod: 'organization_recorded',
        credentialType: args.credentialType.trim(),
        credentialJurisdiction: args.jurisdiction.trim(),
        credentialIdentifier: args.identifier.trim(),
        credentialExpiresAt: expiresAt,
        validationReference: args.verificationReference.trim(),
        validatedAt: new Date(),
        verifiedById: userId,
      },
    })
    await recordAuditAndOutbox(transactionContext, {
      eventKey: `prescriber.credential_reviewed:${prescriber.id}:${approval.id}`,
      organizationId: prescriber.organization.id,
      actorId: userId,
      eventType: 'prescriber.credential_review_recorded',
      resourceType: 'Prescriber',
      resourceId: prescriber.id,
      metadata: { approvalId: approval.id, expiresAt: expiresAt.toISOString(), verificationMethod: 'organization_recorded', softwareValidationPerformed: false },
    })
    return { success: true, prescriberId: prescriber.id, status: 'recorded', expiresAt: expiresAt.toISOString(), approvalId: approval.id }
  })
}
