import { list } from '@keystone-6/core'
import { relationship, select, text, timestamp } from '@keystone-6/core/fields'

import { isSignedIn, permissions, rules } from '../access'
import { requiredRelationshipDb } from './requiredRelationship'
import { trackingFields } from './trackingFields'

export const PrescriptionTransfer = list({
  access: {
    operation: {
      query: isSignedIn,
      create: () => false,
      update: () => false,
      delete: () => false,
    },
    filter: { query: rules.canReadPrescriptionChildren, update: rules.canReadPrescriptionChildren },
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  fields: {
    idempotencyKey: text({ isIndexed: 'unique' }),
    direction: select({
      type: 'string',
      options: [
        { label: 'Inbound', value: 'inbound' },
        { label: 'Outbound', value: 'outbound' },
      ],
      validation: { isRequired: true },
    }),
    status: select({
      access: { update: () => false },
      type: 'string',
      options: [
        { label: 'Requested', value: 'requested' },
        { label: 'Consent recorded', value: 'consent_recorded' },
        { label: 'Under review', value: 'under_review' },
        { label: 'Accepted', value: 'accepted' },
        { label: 'Completed', value: 'completed' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      defaultValue: 'requested',
    }),
    counterpartyName: text({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    counterpartyPhone: text({ access: { read: permissions.canViewPatientPrivateData } }),
    requestedAt: timestamp({ defaultValue: { kind: 'now' } }),
    completedAt: timestamp({ access: { update: () => false } }),
    patient: relationship({ ref: 'PatientProfile.transfers', db: requiredRelationshipDb }),
    prescription: relationship({ ref: 'Prescription.transfers', db: requiredRelationshipDb }),
    consent: relationship({ ref: 'ConsentRecord.transfer' }),
    approval: relationship({ ref: 'HumanApproval.transfers' }),
    ...trackingFields,
  },
})
