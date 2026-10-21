import { list } from '@keystone-6/core'
import { denyAll } from '@keystone-6/core/access'
import { checkbox, json, relationship, select, text, timestamp } from '@keystone-6/core/fields'

import { rules } from '../access'
import { requiredRelationshipDb } from './requiredRelationship'
import { immutableRelationship } from './immutableRelationship'
import { trackingFields } from './trackingFields'

export const IntegrationProvider = list({
  access: {
    operation: {
      query: denyAll,
      create: denyAll,
      update: denyAll,
      delete: denyAll,
    },
    filter: { query: rules.canReadOrganizationRecords, update: rules.canReadOrganizationRecords, delete: rules.canReadOrganizationRecords },
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  hooks: {
    resolveInput: ({ operation, resolvedData }) => {
      if (operation !== 'create') return resolvedData
      const organizationId = resolvedData.organization?.connect?.id
      return organizationId && resolvedData.code
        ? { ...resolvedData, providerKey: `${organizationId}:${resolvedData.code}` }
        : resolvedData
    },
    validateInput: ({ operation, resolvedData, addValidationError }) => {
      if (operation === 'create' && (!resolvedData.organization?.connect?.id || !resolvedData.code)) {
        addValidationError('Integration provider requires organization and code identity')
      }
      if (operation === 'update' && ['organization', 'code', 'providerKey'].some((field) => resolvedData[field] !== undefined)) {
        addValidationError('Integration provider organization and code cannot be changed')
      }
    },
  },
  ui: { isHidden: true },
  fields: {
    providerKey: text({ isIndexed: 'unique', access: { update: denyAll } }),
    name: text({ validation: { isRequired: true } }),
    code: text({ validation: { isRequired: true }, isIndexed: true }),
    providerType: select({
      type: 'string',
      options: [
        { label: 'Prescriber / eRx', value: 'erx' },
        { label: 'Wholesaler', value: 'wholesaler' },
        { label: 'Insurance', value: 'insurance' },
        { label: 'Tax', value: 'tax' },
        { label: 'Payment', value: 'payment' },
      ],
      validation: { isRequired: true },
    }),
    status: select({
      type: 'string',
      options: [
        { label: 'Unconfigured', value: 'unconfigured' },
        { label: 'Sandbox', value: 'sandbox' },
        { label: 'Active', value: 'active' },
        { label: 'Disabled', value: 'disabled' },
      ],
      defaultValue: 'unconfigured',
    }),
    credentials: json({ access: { read: denyAll, create: denyAll, update: denyAll } }),
    configuration: json(),
    submitFunction: text({ validation: { isRequired: true } }),
    statusFunction: text({ validation: { isRequired: true } }),
    webhookFunction: text({ validation: { isRequired: true } }),
    externalValidationComplete: checkbox({ defaultValue: false }),
    validationReference: text(),
    validatedAt: timestamp(),
    organization: relationship({ ref: 'Organization.integrationProviders', db: requiredRelationshipDb }),
    suppliers: relationship({ ref: 'Supplier.integrationProvider', many: true, access: immutableRelationship }),
    prescribers: relationship({ ref: 'Prescriber.integrationProvider', many: true, access: immutableRelationship }),
    paymentProviders: relationship({ ref: 'PaymentProvider.integrationProvider', many: true, access: immutableRelationship }),
    workflows: relationship({ ref: 'ExternalIntegrationWorkflow.provider', many: true, access: immutableRelationship }),
    webhookEvents: relationship({ ref: 'IntegrationWebhookEvent.provider', many: true, access: immutableRelationship }),
    ...trackingFields,
  },
})
