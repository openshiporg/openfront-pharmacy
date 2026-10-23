import { list } from '@keystone-6/core'
import { denyAll } from '@keystone-6/core/access'
import { relationship, select, text, timestamp } from '@keystone-6/core/fields'

import { requiredRelationshipDb } from './requiredRelationship'
import { trackingFields } from './trackingFields'

/**
 * A customer's online request: register as a patient, transfer a prescription from another pharmacy,
 * or ask for a new prescription to be filled. Details are patient-reported; staff review them and use
 * the controlled patient and prescription workflows. Read and written only through the custom
 * pharmacy queries and mutations (features/keystone/mutations/prescriptionRequests.ts).
 */
export const PrescriptionRequest = list({
  access: { operation: { query: denyAll, create: denyAll, update: denyAll, delete: denyAll } },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { isHidden: true },
  fields: {
    idempotencyKey: text({ isIndexed: 'unique' }),
    kind: select({
      type: 'string',
      options: [
        { label: 'Patient registration', value: 'registration' },
        { label: 'Transfer', value: 'transfer' },
        { label: 'New prescription', value: 'new_prescription' },
      ],
      validation: { isRequired: true },
    }),
    status: select({
      type: 'string',
      options: [
        { label: 'Requested', value: 'requested' },
        { label: 'In review', value: 'in_review' },
        { label: 'Completed', value: 'completed' },
        { label: 'Declined', value: 'declined' },
      ],
      defaultValue: 'requested',
    }),
    organization: relationship({ ref: 'Organization', db: requiredRelationshipDb }),
    location: relationship({ ref: 'PharmacyLocation', db: requiredRelationshipDb }),
    user: relationship({ ref: 'User', db: requiredRelationshipDb }),
    patient: relationship({ ref: 'PatientProfile' }),
    firstName: text(),
    lastName: text(),
    dateOfBirth: timestamp(),
    phone: text(),
    email: text(),
    allergies: text({ ui: { displayMode: 'textarea' } }),
    insurance: text({ ui: { displayMode: 'textarea' } }),
    counterpartyName: text(),
    counterpartyPhone: text(),
    prescriberName: text(),
    prescriberPhone: text(),
    medications: text({ ui: { displayMode: 'textarea' } }),
    note: text({ ui: { displayMode: 'textarea' } }),
    resolutionNote: text({ ui: { displayMode: 'textarea' } }),
    resolvedAt: timestamp(),
    resolvedBy: relationship({ ref: 'User' }),
    ...trackingFields,
  },
})
