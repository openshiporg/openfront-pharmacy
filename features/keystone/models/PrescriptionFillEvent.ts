import { list } from '@keystone-6/core'
import { denyAll } from '@keystone-6/core/access'
import { integer, json, relationship, text } from '@keystone-6/core/fields'
import { isSignedIn, permissions, rules } from '../access'
import { immutableRelationship } from './immutableRelationship'
import { requiredRelationshipDb } from './requiredRelationship'
import { trackingFields } from './trackingFields'

export const PrescriptionFillEvent = list({
  access: { operation: { query: isSignedIn, create: denyAll, update: denyAll, delete: denyAll },
    filter: { query: rules.canReadPrescriptionChildren } },
  graphql: { omit: { create: true, update: true, delete: true } },
  hooks: { beforeOperation: ({ operation }) => {
    if (operation !== 'create') throw new Error('Fill events are append-only')
  } },
  ui: { hideCreate: true },
  fields: {
    eventKey: text({ isIndexed: 'unique' }), commandFingerprint: text({ access: { read: denyAll } }),
    action: text(), version: integer({ validation: { isRequired: true, min: 1 } }), quantity: integer({ defaultValue: 0, validation: { isRequired: true, min: 0 } }),
    // Snapshot is privileged evidence, never returned as raw patient JSON.
    evidence: json({ access: { read: permissions.canViewPatientPrivateData } }),
    result: json({ access: { read: permissions.canViewPatientPrivateData } }),
    fill: relationship({ ref: 'PrescriptionFill', access: immutableRelationship, db: requiredRelationshipDb }),
    prescription: relationship({ ref: 'Prescription', access: immutableRelationship, db: requiredRelationshipDb }),
    actor: relationship({ ref: 'User', access: immutableRelationship, db: requiredRelationshipDb }),
    approval: relationship({ ref: 'HumanApproval', access: immutableRelationship }),
    ...trackingFields,
  },
})
