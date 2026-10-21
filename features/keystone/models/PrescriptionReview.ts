import { list } from '@keystone-6/core'
import { trackingFields } from './trackingFields'
import { checkbox, relationship, select, text, timestamp } from '@keystone-6/core/fields'

import { isSignedIn, rules } from '../access'
import { requiredRelationshipDb } from './requiredRelationship'

const denyMutation = () => false

export const PrescriptionReview = list({
  access: {
    operation: { query: isSignedIn, create: denyMutation, update: denyMutation, delete: denyMutation },
    filter: { query: rules.canReadPrescriptionChildren },
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  fields: {
    decision: select({
      type: 'string',
      options: [
        { label: 'Approved', value: 'approved' },
        { label: 'Needs information', value: 'needs_information' },
        { label: 'Rejected', value: 'rejected' },
      ],
      validation: { isRequired: true },
    }),
    reason: text({ validation: { isRequired: true }, ui: { displayMode: 'textarea' } }),
    humanAttested: checkbox({ defaultValue: false }),
    reviewedAt: timestamp({ validation: { isRequired: true }, defaultValue: { kind: 'now' } }),
    prescription: relationship({ ref: 'Prescription.reviews', db: requiredRelationshipDb }),
    patient: relationship({ ref: 'PatientProfile', db: requiredRelationshipDb }),
    pharmacist: relationship({ ref: 'User.prescriptionReviews', db: requiredRelationshipDb }),
    approval: relationship({ ref: 'HumanApproval.prescriptionReviews', db: requiredRelationshipDb }),
    ...trackingFields,
  },
})
