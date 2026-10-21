import { list } from '@keystone-6/core'
import { denyAll } from '@keystone-6/core/access'
import { relationship, select, text } from '@keystone-6/core/fields'

import { isSignedIn, permissions, rules } from '../access'
import { requiredRelationshipDb } from './requiredRelationship'
import { immutableRelationship } from './immutableRelationship'
import { trackingFields } from './trackingFields'

export const Supplier = list({
  access: {
    operation: {
      query: isSignedIn,
      create: permissions.canManageInventory,
      update: permissions.canManageInventory,
      delete: denyAll,
    },
    filter: { query: rules.canReadOrganizationRecords, update: rules.canReadOrganizationRecords },
  },
  hooks: {
    validateInput: async ({ operation, resolvedData, context, addValidationError }) => {
      if (operation === 'create' && !resolvedData.organization?.connect?.id) addValidationError('Supplier requires an organization relationship')
      if (operation === 'create' && resolvedData.organization?.connect?.id) {
        const membership = await context.sudo().query.OrganizationMembership.findMany({ where: { user: { id: { equals: context.session?.itemId || '' } }, organization: { id: { equals: resolvedData.organization.connect.id } }, status: { equals: 'active' } }, take: 1, query: 'id' })
        if (!membership.length) addValidationError('Supplier organization must belong to the active operator')
      }
      if (operation === 'update' && resolvedData.organization !== undefined) addValidationError('Supplier organization is immutable')
    },
  },
  graphql: { omit: { delete: true } },
  ui: { hideDelete: true, listView: { initialColumns: ['name', 'status', 'organization'] } },
  fields: {
    name: text({ validation: { isRequired: true } }),
    accountReference: text(),
    status: select({
      type: 'string',
      options: [
        { label: 'Pending validation', value: 'pending_validation' },
        { label: 'Active', value: 'active' },
        { label: 'Suspended', value: 'suspended' },
      ],
      defaultValue: 'pending_validation',
    }),
    organization: relationship({ ref: 'Organization', db: requiredRelationshipDb }),
    integrationProvider: relationship({ ref: 'IntegrationProvider.suppliers' }),
    inventoryLots: relationship({ ref: 'InventoryLot.supplier', many: true, access: immutableRelationship }),
    ...trackingFields,
  },
})
