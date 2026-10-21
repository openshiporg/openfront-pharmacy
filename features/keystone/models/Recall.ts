import { list } from '@keystone-6/core'
import { denyAll } from '@keystone-6/core/access'
import { relationship, select, text, timestamp } from '@keystone-6/core/fields'

import { isSignedIn, rules } from '../access'
import { assertRecallTransition } from '../workflows/pharmacy-state'
import { requiredRelationshipDb } from './requiredRelationship'
import { trackingFields } from './trackingFields'

export const Recall = list({
  access: {
    operation: {
      query: isSignedIn,
      create: denyAll,
      update: denyAll,
      delete: denyAll,
    },
    filter: { query: rules.canReadTenantRecords, update: rules.canReadTenantRecords },
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  hooks: {
    validateInput: ({ operation, item, resolvedData, addValidationError }) => {
      if (operation === 'create' && (!resolvedData.organization?.connect?.id || !resolvedData.lots?.connect?.length)) {
        addValidationError('Recall requires an organization and at least one affected lot')
      }
      if (operation !== 'update' || !item || !resolvedData.status) return
      try { assertRecallTransition(String(item.status), String(resolvedData.status)) }
      catch (error) { addValidationError(error instanceof Error ? error.message : 'Invalid recall transition') }
    },
    beforeOperation: ({ operation, resolvedData }) => {
      if (operation === 'update' && ['recallNumber', 'organization', 'location', 'lots', 'classification', 'reason', 'source'].some((field) => resolvedData[field] !== undefined)) {
        throw new Error('Recall identity, scope, and affected-lot snapshot are immutable after opening')
      }
      if (operation === 'delete') throw new Error('Recall lifecycle evidence cannot be deleted')
    },
  },
  ui: { hideCreate: true, listView: { initialColumns: ['recallNumber', 'classification', 'status', 'initiatedAt'] } },
  fields: {
    recallNumber: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    classification: select({
      type: 'string',
      options: [
        { label: 'Class I', value: 'class_i' },
        { label: 'Class II', value: 'class_ii' },
        { label: 'Class III', value: 'class_iii' },
        { label: 'Market withdrawal', value: 'market_withdrawal' },
        { label: 'Unverified', value: 'unverified' },
      ],
      defaultValue: 'unverified',
    }),
    status: select({
      type: 'string',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Active', value: 'active' },
        { label: 'Quarantined', value: 'quarantined' },
        { label: 'Resolved', value: 'resolved' },
        { label: 'Closed', value: 'closed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      defaultValue: 'draft',
    }),
    reason: text({ validation: { isRequired: true }, ui: { displayMode: 'textarea' } }),
    source: text(),
    sourceValidationReference: text(),
    initiatedAt: timestamp({ defaultValue: { kind: 'now' } }),
    closedAt: timestamp(),
    organization: relationship({ ref: 'Organization.recalls', db: requiredRelationshipDb }),
    location: relationship({ ref: 'PharmacyLocation.recalls' }),
    lots: relationship({ ref: 'InventoryLot.recalls', many: true, db: requiredRelationshipDb }),
    exposures: relationship({ ref: 'RecallExposure.recall', many: true }),
    approval: relationship({ ref: 'HumanApproval.recalls' }),
    ...trackingFields,
  },
})
