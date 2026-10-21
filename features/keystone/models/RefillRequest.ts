import { list } from '@keystone-6/core'
import { relationship, select, text, timestamp } from '@keystone-6/core/fields'

import { isSignedIn, permissions, rules } from '../access'
import { requiredRelationshipDb } from './requiredRelationship'
import { trackingFields } from './trackingFields'

export const RefillRequest = list({
  access: {
    operation: {
      query: isSignedIn,
      create: () => false,
      update: () => false,
      delete: () => false,
    },
    filter: { query: rules.canReadPrescriptionChildren, update: rules.canReadPrescriptionChildren, delete: rules.canReadPrescriptionChildren },
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  fields: {
    idempotencyKey: text({ isIndexed: 'unique' }),
    requestFingerprint: text({ db: { isNullable: true } }),
    openRequestKey: text({ isIndexed: 'unique', db: { isNullable: true } }),
    status: select({
      access: { update: () => false },
      type: 'string',
      options: [
        { label: 'Requested', value: 'requested' },
        { label: 'Under review', value: 'under_review' },
        { label: 'Prescriber contacted', value: 'prescriber_contacted' },
        { label: 'Approved', value: 'approved' },
        { label: 'Fulfilled', value: 'fulfilled' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      defaultValue: 'requested',
    }),
    requestNote: text({ access: { read: permissions.canViewPatientPrivateData }, ui: { displayMode: 'textarea' } }),
    resolutionNote: text({ db: { isNullable: true }, access: { read: permissions.canViewPatientPrivateData }, ui: { displayMode: 'textarea' } }),
    requestedAt: timestamp({ defaultValue: { kind: 'now' } }),
    resolvedAt: timestamp({ access: { update: () => false } }),
    patient: relationship({ ref: 'PatientProfile.refillRequests', db: requiredRelationshipDb }),
    prescription: relationship({ ref: 'Prescription.refillRequests', db: requiredRelationshipDb }),
    prescriptionItem: relationship({ ref: 'PrescriptionItem.refillRequests' }),
    location: relationship({ ref: 'PharmacyLocation', db: requiredRelationshipDb }),
    approval: relationship({ ref: 'HumanApproval.refillRequests' }),
    ...trackingFields,
  },
})
