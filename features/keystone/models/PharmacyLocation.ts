import { list } from '@keystone-6/core'
import { denyAll } from '@keystone-6/core/access'
import { checkbox, json, relationship, select, text } from '@keystone-6/core/fields'

import { isSignedIn, permissions, rules } from '../access'
import { requiredRelationshipDb } from './requiredRelationship'
import { immutableRelationship } from './immutableRelationship'
import { trackingFields } from './trackingFields'
import { weeklyHoursError } from '../../pharmacy/hours'

export const PharmacyLocation = list({
  access: {
    operation: {
      query: isSignedIn,
      create: permissions.canManageLocations,
      update: permissions.canManageLocations,
      delete: denyAll,
    },
    filter: { query: rules.canReadLocations, update: rules.canReadLocations, delete: rules.canReadLocations },
  },
  hooks: {
    validateInput: async ({ operation, resolvedData, context, addValidationError }) => {
      const hoursError = resolvedData.hours !== undefined ? weeklyHoursError(resolvedData.hours) : null
      if (hoursError) addValidationError(hoursError)
      if (resolvedData.timezone !== undefined) {
        try { new Intl.DateTimeFormat('en-US', { timeZone: String(resolvedData.timezone) }) } catch { addValidationError('Time zone is not a valid IANA zone, for example America/New_York') }
      }
      const organizationId = resolvedData.organization?.connect?.id
      if (operation === 'create' && !organizationId) addValidationError('Location requires an organization relationship')
      if (operation === 'create' && organizationId) {
        const membership = await context.sudo().query.OrganizationMembership.findMany({
          where: { user: { id: { equals: context.session?.itemId || '' } }, organization: { id: { equals: organizationId } }, status: { equals: 'active' }, location: null },
          take: 1,
          query: 'id',
        })
        if (!membership.length) addValidationError('You need organization-wide access to add a location to this organization')
      }
      if (operation === 'update' && resolvedData.organization !== undefined) addValidationError('Location organization is immutable')
    },
  },
  graphql: { omit: { delete: true } },
  ui: { hideDelete: true, listView: { initialColumns: ['name', 'code', 'status', 'organization'] } },
  fields: {
    name: text({ validation: { isRequired: true } }),
    code: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    status: select({
      type: 'string',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Temporarily closed', value: 'temporarily_closed' },
        { label: 'Archived', value: 'archived' },
      ],
      defaultValue: 'active',
    }),
    organization: relationship({ ref: 'Organization.locations', db: requiredRelationshipDb }),
    memberships: relationship({ ref: 'OrganizationMembership.location', many: true, access: immutableRelationship }),
    address: json({ ui: { description: 'Operational address only; validate jurisdiction-specific requirements externally.' } }),
    timezone: text({ defaultValue: 'America/New_York' }),
    // Weekly hours: { store: Day[7], pharmacy: Day[7] }, Sunday first; a Day is { open: 'HH:MM', close: 'HH:MM' } or null when closed.
    hours: json({ ui: { description: 'Weekly store and pharmacy counter hours, edited in Store Settings.' } }),
    phone: text(),
    onlineOrderingEnabled: checkbox({ defaultValue: true, access: { create: permissions.canManageLocations, update: permissions.canManageLocations } }),
    pickupEnabled: checkbox({ defaultValue: true }),
    deliveryEnabled: checkbox({ defaultValue: false, access: { create: permissions.canManageLocations, update: permissions.canManageLocations } }),
    products: relationship({ ref: 'Product.location', many: true, access: immutableRelationship }),
    inventoryLots: relationship({ ref: 'InventoryLot.location', many: true, access: immutableRelationship }),
    prescriptions: relationship({ ref: 'Prescription.location', many: true, access: immutableRelationship }),
    recalls: relationship({ ref: 'Recall.location', many: true, access: immutableRelationship }),
    orders: relationship({ ref: 'Order.location', many: true, access: immutableRelationship }),
    outboxEvents: relationship({ ref: 'OutboxEvent.location', many: true, access: immutableRelationship }),
    machineCredentials: relationship({ ref: 'MachineCredential.location', many: true, access: immutableRelationship }),
    externalIntegrationWorkflows: relationship({ ref: 'ExternalIntegrationWorkflow.location', many: true, access: immutableRelationship }),
    ...trackingFields,
  },
})
