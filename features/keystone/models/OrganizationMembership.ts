import { list } from '@keystone-6/core'
import { denyAll } from '@keystone-6/core/access'
import { checkbox, relationship, select, text, timestamp } from '@keystone-6/core/fields'

import { isSignedIn, permissions, rules } from '../access'
import { requiredRelationshipDb } from './requiredRelationship'
import { trackingFields } from './trackingFields'

async function hasOrganizationWideMembership(context: any, organizationId: string, membershipRole?: string) {
  const userId = context.session?.itemId
  if (!userId || !organizationId) return false
  const memberships = await context.sudo().query.OrganizationMembership.findMany({
    where: {
      user: { id: { equals: userId } },
      organization: { id: { equals: organizationId } },
      status: { equals: 'active' },
      location: null,
      ...(membershipRole ? { membershipRole: { equals: membershipRole } } : {}),
    },
    take: 1,
    query: 'id',
  })
  return memberships.length > 0
}

// Members cannot change their own membership role or status.
const notOwnMembership = ({ session, item }: any) => Boolean(session?.itemId) && String(item?.userId) !== session.itemId

export const OrganizationMembership = list({
  access: {
    operation: {
      query: isSignedIn,
      create: permissions.canManageUsers,
      update: permissions.canManageUsers,
      delete: denyAll,
    },
    filter: {
      query: rules.canReadMemberships,
      update: rules.canReadMemberships,
      delete: rules.canReadMemberships,
    },
  },
  hooks: {
    resolveInput: ({ operation, resolvedData }) => {
      if (operation !== 'create') return resolvedData
      const userId = resolvedData.user?.connect?.id
      const organizationId = resolvedData.organization?.connect?.id
      const locationId = resolvedData.location?.connect?.id || '*'
      return userId && organizationId
        ? { ...resolvedData, membershipKey: `${userId}:${organizationId}:${locationId}` }
        : resolvedData
    },
    validateInput: async ({ operation, resolvedData, item, context, addValidationError }) => {
      if (operation === 'create') {
        const userId = resolvedData.user?.connect?.id
        const organizationId = resolvedData.organization?.connect?.id
        const locationId = resolvedData.location?.connect?.id
        if (!userId || !organizationId) return addValidationError('Membership requires user and organization relationships')
        // The first membership of a new organization (created during onboarding) bootstraps its owner.
        const existingMembers = await context.sudo().query.OrganizationMembership.count({ where: { organization: { id: { equals: organizationId } } } })
        if (existingMembers > 0) {
          if (!(await hasOrganizationWideMembership(context, organizationId))) addValidationError('You need organization-wide access to add members to this organization')
          if (resolvedData.membershipRole === 'owner' && !(await hasOrganizationWideMembership(context, organizationId, 'owner'))) addValidationError('Only an owner can add another owner')
        }
        if (locationId) {
          const location = await context.sudo().query.PharmacyLocation.findOne({ where: { id: locationId }, query: 'organization { id }' })
          if (location?.organization?.id !== organizationId) addValidationError('Membership location must belong to its organization')
        }
      }
      if (operation === 'update' && ['user', 'organization', 'location', 'membershipKey'].some((field) => resolvedData[field] !== undefined)) {
        addValidationError('Membership user, organization and location cannot be changed')
      }
      if (operation === 'update' && item && (resolvedData.membershipRole !== undefined || resolvedData.status !== undefined)) {
        const organizationId = String((item as any).organizationId)
        if (!(await hasOrganizationWideMembership(context, organizationId))) addValidationError('You need organization-wide access to change memberships in this organization')
        if ((resolvedData.membershipRole === 'owner' || (item as any).membershipRole === 'owner') && !(await hasOrganizationWideMembership(context, organizationId, 'owner'))) {
          addValidationError('Only an owner can grant or change owner memberships')
        }
      }
    },
  },
  ui: { listView: { initialColumns: ['user', 'organization', 'location', 'membershipRole', 'status'] } },
  fields: {
    membershipKey: text({ isIndexed: 'unique', access: { create: denyAll, update: denyAll } }),
    user: relationship({ ref: 'User.memberships', db: requiredRelationshipDb }),
    organization: relationship({ ref: 'Organization.memberships', db: requiredRelationshipDb }),
    location: relationship({ ref: 'PharmacyLocation.memberships' }),
    membershipRole: select({
      access: { update: notOwnMembership },
      type: 'string',
      options: [
        { label: 'Owner', value: 'owner' },
        { label: 'Administrator', value: 'administrator' },
        { label: 'Pharmacist', value: 'pharmacist' },
        { label: 'Technician', value: 'technician' },
        { label: 'Cashier', value: 'cashier' },
        { label: 'Delivery', value: 'delivery' },
        { label: 'Read only', value: 'read_only' },
      ],
      defaultValue: 'read_only',
    }),
    status: select({
      access: { update: notOwnMembership },
      type: 'string',
      options: [
        { label: 'Invited', value: 'invited' },
        { label: 'Active', value: 'active' },
        { label: 'Suspended', value: 'suspended' },
        { label: 'Revoked', value: 'revoked' },
      ],
      defaultValue: 'invited',
    }),
    externalCredentialValidated: checkbox({
      defaultValue: false,
      access: { create: denyAll, update: denyAll },
      ui: { description: 'Organization-recorded review evidence only; the software does not validate licensure.' },
    }),
    credentialVerificationMethod: select({
      type: 'string',
      options: [
        { label: 'Not recorded', value: 'not_recorded' },
        { label: 'Organization-recorded source review', value: 'organization_recorded' },
        { label: 'Contracted external provider', value: 'external_provider' },
      ],
      defaultValue: 'not_recorded',
      access: { create: denyAll, update: denyAll },
    }),
    credentialType: text({ access: { create: denyAll, update: denyAll } }),
    credentialJurisdiction: text({ access: { create: denyAll, update: denyAll } }),
    credentialIdentifier: text({ access: { create: denyAll, update: denyAll } }),
    credentialValidationReference: text({ access: { create: denyAll, update: denyAll } }),
    credentialValidatedAt: timestamp({ access: { create: denyAll, update: denyAll } }),
    credentialExpiresAt: timestamp({ access: { create: denyAll, update: denyAll } }),
    credentialVerifiedBy: relationship({ ref: 'User', access: { create: denyAll, update: denyAll } }),
    ...trackingFields,
  },
})
