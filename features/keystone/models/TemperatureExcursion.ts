import { list } from '@keystone-6/core'
import { denyAll } from '@keystone-6/core/access'
import { float, relationship, select, text, timestamp } from '@keystone-6/core/fields'

import { isSignedIn, rules } from '../access'
import { requiredRelationshipDb } from './requiredRelationship'
import { trackingFields } from './trackingFields'

export const TemperatureExcursion = list({
  access: {
    operation: {
      query: isSignedIn,
      create: denyAll,
      update: denyAll,
      delete: denyAll,
    },
    filter: { query: rules.canReadTenantRecords, update: rules.canReadTenantRecords, delete: rules.canReadTenantRecords },
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  hooks: {
    validateInput: ({ operation, resolvedData, addValidationError }) => {
      if (operation !== 'create') return
      if (!resolvedData.organization?.connect?.id || !resolvedData.location?.connect?.id || !resolvedData.lot?.connect?.id) {
        addValidationError('Temperature excursion requires organization, location, and lot relationships')
      }
      if (resolvedData.observedMinimumC > resolvedData.observedMaximumC) addValidationError('Observed temperature range is invalid')
    },
    beforeOperation: ({ operation }) => {
      if (operation !== 'create') throw new Error('Temperature excursion evidence is immutable; use a disposition operation')
    },
  },
  fields: {
    idempotencyKey: text({ isIndexed: 'unique' }),
    observedMinimumC: float({ validation: { isRequired: true } }),
    observedMaximumC: float({ validation: { isRequired: true } }),
    startedAt: timestamp({ validation: { isRequired: true } }),
    endedAt: timestamp(),
    status: select({
      type: 'string',
      options: [
        { label: 'Open', value: 'open' },
        { label: 'Under review', value: 'under_review' },
        { label: 'Released', value: 'released' },
        { label: 'Destroyed', value: 'destroyed' },
      ],
      defaultValue: 'open',
    }),
    dispositionReason: text({ ui: { displayMode: 'textarea' } }),
    organization: relationship({ ref: 'Organization', db: requiredRelationshipDb }),
    location: relationship({ ref: 'PharmacyLocation', db: requiredRelationshipDb }),
    lot: relationship({ ref: 'InventoryLot.temperatureExcursions', db: requiredRelationshipDb }),
    reviewedBy: relationship({ ref: 'User', db: requiredRelationshipDb }),
    approval: relationship({ ref: 'HumanApproval.temperatureExcursions', db: requiredRelationshipDb }),
    ...trackingFields,
  },
})
