import { list, graphql } from '@keystone-6/core'
import { denyAll } from '@keystone-6/core/access'
import { json, relationship, select, text, timestamp, virtual } from '@keystone-6/core/fields'

import { permissions } from '../access'
import { requiredRelationshipDb } from './requiredRelationship'
import { trackingFields } from './trackingFields'

const privateRead = { read: permissions.canViewPatientPrivateData }

export const PatientProfile = list({
  access: {
    operation: {
      query: denyAll,
      create: denyAll,
      update: denyAll,
      delete: denyAll,
    },
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  hooks: {
    validateInput: ({ operation, resolvedData, addValidationError }: any) => {
      if (operation === 'create' && !resolvedData.organizations?.connect?.length) addValidationError('Patient requires an organization relationship')
      if (operation === 'update' && resolvedData.organizations !== undefined) addValidationError('Patient organization cannot be changed')
    },
  },
  ui: { isHidden: true, listView: { initialColumns: ['displayName', 'status', 'patientNumber', 'dateOfBirth'] } },
  fields: {
    patientNumber: text({ validation: { isRequired: true }, isIndexed: 'unique', access: privateRead }),
    identityKey: text({ isIndexed: 'unique', db: { isNullable: true }, access: privateRead }),
    requestFingerprint: text({ db: { isNullable: true }, access: privateRead }),
    firstName: text({ validation: { isRequired: true }, access: privateRead }),
    lastName: text({ validation: { isRequired: true }, access: privateRead }),
    displayName: virtual({
      access: privateRead,
      field: graphql.field({
        type: graphql.String,
        resolve(item) { return `${String(item.firstName || '')} ${String(item.lastName || '')}`.trim() },
      }),
    }),
    status: select({
      type: 'string',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Archived', value: 'archived' },
      ],
      defaultValue: 'active',
    }),
    dateOfBirth: timestamp({ access: privateRead }),
    email: text({ access: privateRead }),
    phone: text({ access: privateRead }),
    address: json({ access: privateRead }),
    identityVerificationStatus: select({
      type: 'string',
      options: [
        { label: 'Not recorded', value: 'unverified' },
        { label: 'Operator-confirmed match', value: 'confirmed' },
        { label: 'Rejected mismatch', value: 'rejected' },
      ],
      defaultValue: 'unverified',
      access: { ...privateRead, create: denyAll, update: denyAll },
    }),
    identityReference: text({ access: { ...privateRead, create: denyAll, update: denyAll } }),
    identityVerifiedAt: timestamp({ access: { ...privateRead, create: denyAll, update: denyAll } }),
    identityVerifiedBy: relationship({ ref: 'User', access: { ...privateRead, create: denyAll, update: denyAll } }),
    identityEvidence: json({ access: privateRead, ui: { description: 'Operator-recorded identity matching evidence; not a government identity validation claim.' } }),
    preferredContactMethod: select({
      access: privateRead,
      type: 'string',
      options: [
        { label: 'Phone', value: 'phone' },
        { label: 'SMS', value: 'sms' },
        { label: 'Email', value: 'email' },
        { label: 'Portal', value: 'portal' },
        { label: 'None', value: 'none' },
      ],
      defaultValue: 'none',
    }),
    notes: text({ access: privateRead, ui: { displayMode: 'textarea', description: 'Minimum necessary operational note; do not use as a full medical record.' } }),
    user: relationship({ ref: 'User.patientProfile' }),
    organizations: relationship({ ref: 'Organization.patients', many: true, db: requiredRelationshipDb }),
    consents: relationship({ ref: 'ConsentRecord.patient', many: true }),
    allergies: relationship({ ref: 'PatientAllergy.patient', many: true }),
    medications: relationship({ ref: 'PatientMedication.patient', many: true }),
    safetyReviews: relationship({ ref: 'ClinicalSafetyReview.patient', many: true }),
    dispensingLabels: relationship({ ref: 'DispensingLabel.patient', many: true }),
    prescriptions: relationship({ ref: 'Prescription.patient', many: true }),
    refillRequests: relationship({ ref: 'RefillRequest.patient', many: true }),
    transfers: relationship({ ref: 'PrescriptionTransfer.patient', many: true }),
    orders: relationship({ ref: 'Order.patient', many: true }),
    auditEvents: relationship({ ref: 'AuditEvent.patient', many: true }),
    ...trackingFields,
  },
})
