import { list } from '@keystone-6/core'
import { denyAll } from '@keystone-6/core/access'
import { checkbox, relationship, select, text, timestamp } from '@keystone-6/core/fields'

import { isSignedIn, permissions, rules } from '../access'
import { requiredRelationshipDb } from './requiredRelationship'
import { immutableRelationship } from './immutableRelationship'
import { trackingFields } from './trackingFields'

export const Prescriber = list({
  access: {
    operation: {
      query: isSignedIn,
      create: permissions.canManagePrescriptions,
      update: permissions.canManagePrescriptions,
      delete: denyAll,
    },
    filter: { query: rules.canReadOrganizationRecords, update: rules.canReadOrganizationRecords },
  },
  hooks: {
    validateInput: async ({ operation, resolvedData, context, addValidationError }) => {
      if (operation === 'create' && !resolvedData.organization?.connect?.id) addValidationError('Prescriber requires an organization relationship')
      if (operation === 'create' && resolvedData.organization?.connect?.id) {
        const membership = await context.sudo().query.OrganizationMembership.findMany({ where: { user: { id: { equals: context.session?.itemId || '' } }, organization: { id: { equals: resolvedData.organization.connect.id } }, status: { equals: 'active' } }, take: 1, query: 'id' })
        if (!membership.length) addValidationError('Prescriber organization must belong to the active operator')
      }
      if (operation === 'update' && resolvedData.organization !== undefined) addValidationError('Prescriber organization is immutable')
      if (operation === 'update' && ['verificationStatus', 'externalValidationComplete', 'verificationMethod', 'credentialType', 'credentialJurisdiction', 'credentialIdentifier', 'credentialExpiresAt', 'validationReference', 'validatedAt', 'verifiedBy'].some((field) => resolvedData[field] !== undefined)) {
        addValidationError('Prescriber validation state is controlled by the credential evidence workflow')
      }
      if (operation === 'create' && (resolvedData.externalValidationComplete === true || resolvedData.verificationStatus === 'validated')) {
        addValidationError('New prescribers must complete the credential evidence workflow')
      }
    },
  },
  graphql: { omit: { delete: true } },
  ui: { hideDelete: true, listView: { initialColumns: ['name', 'npi', 'verificationStatus', 'credentialExpiresAt', 'organization'] } },
  fields: {
    name: text({ validation: { isRequired: true } }),
    npi: text({ isIndexed: true }),
    phone: text(),
    fax: text(),
    externalIdentifier: text(),
    verificationStatus: select({
      type: 'string',
      options: [
        { label: 'Unverified', value: 'unverified' },
        { label: 'Pending verification evidence', value: 'pending' },
        { label: 'Verification evidence recorded', value: 'validated' },
        { label: 'Rejected', value: 'rejected' },
      ],
      defaultValue: 'unverified',
    }),
    externalValidationComplete: checkbox({ defaultValue: false, access: { update: denyAll }, ui: { description: 'Recorded evidence flag; not a software licensure claim.' } }),
    verificationMethod: select({
      type: 'string',
      options: [
        { label: 'Not recorded', value: 'not_recorded' },
        { label: 'Organization-recorded source review', value: 'organization_recorded' },
        { label: 'Contracted external provider', value: 'external_provider' },
      ],
      defaultValue: 'not_recorded',
      access: { update: denyAll },
    }),
    credentialType: text({ access: { update: denyAll } }),
    credentialJurisdiction: text({ access: { update: denyAll } }),
    credentialIdentifier: text({ access: { update: denyAll } }),
    credentialExpiresAt: timestamp({ access: { update: denyAll } }),
    validationReference: text({ access: { update: denyAll } }),
    validatedAt: timestamp({ access: { update: denyAll } }),
    verifiedBy: relationship({ ref: 'User', access: { update: denyAll } }),
    organization: relationship({ ref: 'Organization', db: requiredRelationshipDb }),
    integrationProvider: relationship({ ref: 'IntegrationProvider.prescribers' }),
    prescriptions: relationship({ ref: 'Prescription.prescriber', many: true, access: immutableRelationship }),
    ...trackingFields,
  },
})
