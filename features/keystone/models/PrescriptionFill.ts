import { list } from '@keystone-6/core'
import { denyAll } from '@keystone-6/core/access'
import { integer, json, relationship, text, timestamp } from '@keystone-6/core/fields'
import { isSignedIn, rules } from '../access'
import { immutableRelationship } from './immutableRelationship'
import { requiredRelationshipDb } from './requiredRelationship'
import { trackingFields } from './trackingFields'

export const PrescriptionFill = list({
  access: { operation: { query: isSignedIn, create: denyAll, update: denyAll, delete: denyAll },
    filter: { query: rules.canReadPrescriptionChildren } },
  graphql: { omit: { create: true, update: true, delete: true } },
  hooks: { beforeOperation: ({ operation, inputData }) => {
    if (operation === 'delete') throw new Error('Fill lineage cannot be deleted')
    const mutable = ['status', 'version', 'creditState', 'quantityDispensed', 'quantityReleased', 'openKey', 'approval']
    if (operation === 'update' && Object.keys(inputData).some(k => !mutable.includes(k))) throw new Error('Fill authority snapshot is immutable')
  } },
  ui: { hideCreate: true },
  fields: {
    reservationKey: text({ isIndexed: 'unique' }),
    requestFingerprint: text({ access: { read: denyAll } }),
    openKey: text({ isIndexed: 'unique', db: { isNullable: true } }),
    kind: text(), status: text({ defaultValue: 'requested' }),
    version: integer({ defaultValue: 1, validation: { isRequired: true, min: 1 } }),
    fillNumber: integer({ validation: { isRequired: true, min: 1 } }),
    creditState: text({ defaultValue: 'reserved' }),
    authorizedQuantity: integer({ validation: { isRequired: true, min: 1 } }),
    quantityDispensed: integer({ defaultValue: 0, validation: { isRequired: true, min: 0 } }),
    quantityReleased: integer({ defaultValue: 0, validation: { isRequired: true, min: 0 } }),
    itemVersion: text(), authorityVersion: text(),
    policySnapshot: json(), priceSnapshot: json(),
    expiresAt: timestamp({ validation: { isRequired: true } }),
    organization: relationship({ ref: 'Organization', access: immutableRelationship, db: requiredRelationshipDb }),
    location: relationship({ ref: 'PharmacyLocation', access: immutableRelationship, db: requiredRelationshipDb }),
    patient: relationship({ ref: 'PatientProfile', access: immutableRelationship, db: requiredRelationshipDb }),
    prescription: relationship({ ref: 'Prescription', access: immutableRelationship, db: requiredRelationshipDb }),
    prescriptionItem: relationship({ ref: 'PrescriptionItem', access: immutableRelationship, db: requiredRelationshipDb }),
    refillRequest: relationship({ ref: 'RefillRequest', access: immutableRelationship }),
    approval: relationship({ ref: 'HumanApproval', access: immutableRelationship }),
    reservedBy: relationship({ ref: 'User', access: immutableRelationship, db: requiredRelationshipDb }),
    // No inverse fields: omitted lists must not acquire parent-side write paths.
    ...trackingFields,
  },
})
