import { list } from '@keystone-6/core'
import { denyAll } from '@keystone-6/core/access'
import { integer, json, relationship, text, timestamp } from '@keystone-6/core/fields'

import { isSignedIn, permissions, rules } from '../access'
import { requiredRelationshipDb } from './requiredRelationship'
import { trackingFields } from './trackingFields'

export const DispensingLabel = list({
  access: {
    operation: { query: isSignedIn, create: denyAll, update: denyAll, delete: denyAll },
    filter: { query: rules.canReadPrescriptionChildren },
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  fields: {
    labelNumber: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    fillNumber: integer({ validation: { isRequired: true, min: 1 } }),
    operatorNameSnapshot: text({ validation: { isRequired: true } }),
    operatorPhoneSnapshot: text(),
    locationNameSnapshot: text({ validation: { isRequired: true } }),
    locationAddressSnapshot: json(),
    patientNameSnapshot: text({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    prescriberNameSnapshot: text({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    medicationNameSnapshot: text({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    sigSnapshot: text({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    quantityDispensed: integer({ validation: { isRequired: true, min: 1 } }),
    lotNumberSnapshot: text({ validation: { isRequired: true } }),
    ndc11Snapshot: text(),
    expirationDateSnapshot: timestamp({ validation: { isRequired: true } }),
    auxiliaryWarnings: json({ access: { read: permissions.canViewPatientPrivateData } }),
    counselingOutcome: text({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    dispensedAt: timestamp({ defaultValue: { kind: 'now' }, validation: { isRequired: true } }),
    organization: relationship({ ref: 'Organization', db: requiredRelationshipDb }),
    location: relationship({ ref: 'PharmacyLocation', db: requiredRelationshipDb }),
    patient: relationship({ ref: 'PatientProfile.dispensingLabels', db: requiredRelationshipDb }),
    prescription: relationship({ ref: 'Prescription.dispensingLabels', db: requiredRelationshipDb }),
    prescriptionItem: relationship({ ref: 'PrescriptionItem.dispensingLabels', db: requiredRelationshipDb }),
    order: relationship({ ref: 'Order.dispensingLabels', db: requiredRelationshipDb }),
    pharmacist: relationship({ ref: 'User', db: requiredRelationshipDb }),
    approval: relationship({ ref: 'HumanApproval', db: requiredRelationshipDb }),
    ...trackingFields,
  },
})
