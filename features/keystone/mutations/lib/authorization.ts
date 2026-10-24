import type { Context } from '.keystone/types'
import { permissions } from '../../access'
import { DomainError } from './errors'

export async function requireTenantMembership(
  context: Context,
  input: { organizationId: string; locationId?: string | null; organizationWide?: boolean; pharmacist?: boolean },
) {
  const userId = context.session?.itemId
  if (!userId) throw new DomainError('Authentication required')

  // Shared row locks participate in the calling transaction; deactivation and
  // credential edits cannot commit ahead of an already-authorized command.
  await context.prisma.$queryRaw`SELECT id FROM "OrganizationMembership" WHERE "user" = ${userId} AND organization = ${input.organizationId} FOR SHARE`
  await context.prisma.$queryRaw`SELECT id FROM "Organization" WHERE id = ${input.organizationId} FOR SHARE`
  if (input.locationId) {
    await context.prisma.$queryRaw`SELECT id FROM "PharmacyLocation" WHERE id = ${input.locationId} FOR SHARE`
    const location = await context.sudo().query.PharmacyLocation.findOne({
      where: { id: input.locationId },
      query: 'id status organization { id status }',
    })
    if (!location || location.organization?.id !== input.organizationId || location.status !== 'active' || location.organization.status !== 'active') {
      throw new DomainError('An active location is required')
    }
  }

  const memberships = await context.sudo().query.OrganizationMembership.findMany({
    where: {
      user: { id: { equals: userId } },
      organization: { id: { equals: input.organizationId }, status: { equals: 'active' } },
      status: { equals: 'active' },
      ...(input.organizationWide
        ? { location: null }
        : input.locationId ? {
          OR: [
            { location: null },
            { location: { id: { equals: input.locationId }, status: { equals: 'active' } } },
          ],
        } : {}),
    },
    query: 'id membershipRole externalCredentialValidated credentialVerificationMethod credentialType credentialJurisdiction credentialIdentifier credentialValidationReference credentialValidatedAt credentialExpiresAt credentialVerifiedBy { id } organization { id status } location { id status }',
  })
  const activeMemberships = memberships.filter((membership: any) =>
    membership.organization?.status === 'active'
    && (!membership.location || membership.location.status === 'active')
    && (!input.locationId || !membership.location || membership.location.id === input.locationId),
  )
  if (!activeMemberships.length) throw new DomainError('You do not have access to this pharmacy')

  const hasCurrentCredentialEvidence = (membership: any) => {
    const credentialExpiresAt = membership.credentialExpiresAt ? new Date(membership.credentialExpiresAt).getTime() : Number.NaN
    return ['owner', 'pharmacist'].includes(membership.membershipRole)
      && membership.externalCredentialValidated === true
      && ['organization_recorded', 'external_provider'].includes(membership.credentialVerificationMethod || '')
      && Boolean(membership.credentialType?.trim())
      && Boolean(membership.credentialJurisdiction?.trim())
      && Boolean(membership.credentialIdentifier?.trim())
      && Boolean(membership.credentialValidationReference?.trim())
      && Boolean(membership.credentialVerifiedBy?.id)
      && Number.isFinite(credentialExpiresAt)
      && credentialExpiresAt > Date.now()
  }
  const membership = input.pharmacist
    ? activeMemberships.find(hasCurrentCredentialEvidence)
    : activeMemberships.find((entry: any) => !entry.location) || activeMemberships[0]
  if (!membership && input.pharmacist) {
    throw new DomainError('Current organization-recorded pharmacist credential review evidence is required; the software does not validate licensure')
  }
  return { userId, membership: membership || activeMemberships[0] }
}

export function requirePermission(
  context: Context,
  permission: keyof typeof permissions,
) {
  if (!permissions[permission]({ session: context.session as any })) {
    throw new DomainError(`Permission required: ${permission}`)
  }
}
