import { list } from '@keystone-6/core'
import { denyAll } from '@keystone-6/core/access'
import { checkbox, integer, json, relationship, select, text, timestamp } from '@keystone-6/core/fields'

import { isSignedIn, permissions, rules } from '../access'
import { requiredRelationshipDb } from './requiredRelationship'
import { trackingFields } from './trackingFields'

export const ClinicalSafetyReview = list({
  access: {
    operation: { query: isSignedIn, create: denyAll, update: denyAll, delete: denyAll },
    filter: { query: rules.canReadPrescriptionChildren },
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  fields: {
    reviewKey: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    fillNumber: integer({ validation: { isRequired: true, min: 1 } }),
    outcome: select({
      type: 'string',
      options: [
        { label: 'Human review clear', value: 'clear' },
        { label: 'Human-documented override', value: 'override' },
        { label: 'Rejected', value: 'rejected' },
      ],
      validation: { isRequired: true },
    }),
    allergiesReviewed: checkbox({ defaultValue: false }),
    medicationHistoryReviewed: checkbox({ defaultValue: false }),
    interactionsReviewed: checkbox({ defaultValue: false }),
    duplicateTherapyReviewed: checkbox({ defaultValue: false }),
    contraindicationsReviewed: checkbox({ defaultValue: false }),
    doseReviewed: checkbox({ defaultValue: false }),
    counselingPlanReviewed: checkbox({ defaultValue: false }),
    reviewReference: text({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    notes: text({ access: { read: permissions.canViewPatientPrivateData }, ui: { displayMode: 'textarea' } }),
    overrideReason: text({ access: { read: permissions.canViewPatientPrivateData }, ui: { displayMode: 'textarea' } }),
    evidenceSnapshot: json({ access: { read: permissions.canViewPatientPrivateData } }),
    reviewedAt: timestamp({ defaultValue: { kind: 'now' }, validation: { isRequired: true } }),
    organization: relationship({ ref: 'Organization', db: requiredRelationshipDb }),
    location: relationship({ ref: 'PharmacyLocation', db: requiredRelationshipDb }),
    patient: relationship({ ref: 'PatientProfile.safetyReviews', db: requiredRelationshipDb }),
    prescription: relationship({ ref: 'Prescription.safetyReviews', db: requiredRelationshipDb }),
    pharmacist: relationship({ ref: 'User', db: requiredRelationshipDb }),
    approval: relationship({ ref: 'HumanApproval', db: requiredRelationshipDb }),
    ...trackingFields,
  },
})
