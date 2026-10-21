import { list } from '@keystone-6/core'
import { denyAll } from '@keystone-6/core/access'
import { integer, relationship, select, text, timestamp } from '@keystone-6/core/fields'

import { isSignedIn, permissions, rules } from '../access'
import { requiredRelationshipDb } from './requiredRelationship'
import { trackingFields } from './trackingFields'

export const RecallExposure = list({
  access: {
    operation: { query: isSignedIn, create: denyAll, update: denyAll, delete: denyAll },
    filter: { query: rules.canReadLocationScopedPatientChildren },
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  fields: {
    exposureKey: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    status: select({ type: 'string', options: [{ label: 'Outreach required', value: 'outreach_required' }, { label: 'Contacted', value: 'contacted' }, { label: 'Returned', value: 'returned' }, { label: 'Resolved', value: 'resolved' }, { label: 'Unable to reach', value: 'unable_to_reach' }], defaultValue: 'outreach_required' }),
    quantityDispensed: integer({ validation: { isRequired: true, min: 1 } }),
    contactMethod: text({ access: { read: permissions.canViewPatientPrivateData } }),
    outcome: text({ access: { read: permissions.canViewPatientPrivateData } }),
    notes: text({ access: { read: permissions.canViewPatientPrivateData }, ui: { displayMode: 'textarea' } }),
    lastActionAt: timestamp(),
    resolvedAt: timestamp(),
    organization: relationship({ ref: 'Organization', db: requiredRelationshipDb }),
    location: relationship({ ref: 'PharmacyLocation', db: requiredRelationshipDb }),
    recall: relationship({ ref: 'Recall.exposures', db: requiredRelationshipDb }),
    movement: relationship({ ref: 'InventoryMovement', db: requiredRelationshipDb }),
    patient: relationship({ ref: 'PatientProfile', db: requiredRelationshipDb }),
    prescription: relationship({ ref: 'Prescription' }),
    order: relationship({ ref: 'Order' }),
    lastActor: relationship({ ref: 'User' }),
    approval: relationship({ ref: 'HumanApproval' }),
    ...trackingFields,
  },
})
