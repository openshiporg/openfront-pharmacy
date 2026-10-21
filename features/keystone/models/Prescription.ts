import { list } from '@keystone-6/core'
import { denyAll } from '@keystone-6/core/access'
import { relationship, select, text, timestamp } from '@keystone-6/core/fields'

import { isSignedIn, permissions, rules } from '../access'
import { assertPrescriptionTransition } from '../workflows/pharmacy-state'
import { requiredRelationshipDb } from './requiredRelationship'
import { trackingFields } from './trackingFields'

export const Prescription = list({
  access: {
    operation: {
      query: isSignedIn,
      create: denyAll,
      update: denyAll,
      delete: denyAll,
    },
    filter: { query: rules.canReadPrescriptionRecords, update: rules.canReadPrescriptionRecords },
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  hooks: {
    validateInput: async ({ operation, item, resolvedData, context, addValidationError }) => {
      if (operation === 'create') {
        const organizationId = resolvedData.organization?.connect?.id
        const locationId = resolvedData.location?.connect?.id
        const patientId = resolvedData.patient?.connect?.id
        const prescriberId = resolvedData.prescriber?.connect?.id
        if (!organizationId || !locationId || !patientId || !prescriberId) {
          addValidationError('Prescription requires organization, location, patient, and prescriber relationships')
          return
        }
        const [location, patient, prescriber] = await Promise.all([
          context.sudo().query.PharmacyLocation.findOne({ where: { id: locationId }, query: 'organization { id }' }),
          context.sudo().query.PatientProfile.findOne({ where: { id: patientId }, query: 'organizations { id }' }),
          context.sudo().query.Prescriber.findOne({ where: { id: prescriberId }, query: 'organization { id }' }),
        ])
        if (location?.organization?.id !== organizationId || prescriber?.organization?.id !== organizationId || !patient?.organizations?.some((organization: any) => organization.id === organizationId)) {
          addValidationError('Prescription location, patient and prescriber must belong to the same pharmacy')
        }
      }
      if (operation === 'update' && item && resolvedData.status) {
        try { assertPrescriptionTransition(String(item.status), String(resolvedData.status)) }
        catch (error) { addValidationError(error instanceof Error ? error.message : 'Invalid prescription transition') }
      }
    },
    beforeOperation: ({ operation, resolvedData }) => {
      if (operation === 'update' && ['organization', 'location', 'patient', 'prescriber', 'prescriptionNumber'].some((field) => resolvedData[field] !== undefined)) {
        throw new Error('Prescription number, patient, prescriber and location cannot be changed')
      }
      if (operation === 'delete') throw new Error('Prescription lifecycle evidence cannot be deleted')
    },
  },
  ui: { hideCreate: true, listView: { initialColumns: ['prescriptionNumber', 'patient', 'source', 'status', 'location'] } },
  fields: {
    prescriptionNumber: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    intakeRequestFingerprint: text({ db: { isNullable: true }, access: { read: denyAll, create: denyAll, update: denyAll } }),
    source: select({
      type: 'string',
      options: [
        { label: 'Paper', value: 'paper' },
        { label: 'Electronic boundary', value: 'erx' },
        { label: 'Transfer', value: 'transfer' },
        { label: 'Phone', value: 'phone' },
        { label: 'Manual intake', value: 'manual' },
      ],
      defaultValue: 'manual',
    }),
    sourceVerificationStatus: select({
      type: 'string',
      options: [
        { label: 'Unverified', value: 'unverified' },
        { label: 'Pending', value: 'pending' },
        { label: 'Verified by authorized human', value: 'human_verified' },
        { label: 'Rejected', value: 'rejected' },
      ],
      defaultValue: 'unverified',
    }),
    externalReference: text({ access: { read: permissions.canViewPatientPrivateData } }),
    status: select({
      access: { update: () => false },
      type: 'string',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Pending review', value: 'pending_review' },
        { label: 'Needs information', value: 'needs_information' },
        { label: 'Approved', value: 'approved' },
        { label: 'Ready to dispense', value: 'ready_to_dispense' },
        { label: 'Partially dispensed', value: 'partially_dispensed' },
        { label: 'Dispensed', value: 'dispensed' },
        { label: 'Fill closed with undispensed quantity', value: 'fill_closed' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      defaultValue: 'draft',
    }),
    writtenAt: timestamp(),
    expiresAt: timestamp(),
    approvedAt: timestamp({ access: { update: () => false } }),
    dispensedAt: timestamp({ access: { update: () => false } }),
    organization: relationship({ ref: 'Organization.prescriptions', db: requiredRelationshipDb }),
    location: relationship({ ref: 'PharmacyLocation.prescriptions', db: requiredRelationshipDb }),
    patient: relationship({ ref: 'PatientProfile.prescriptions', db: requiredRelationshipDb }),
    prescriber: relationship({ ref: 'Prescriber.prescriptions', db: requiredRelationshipDb }),
    items: relationship({ ref: 'PrescriptionItem.prescription', many: true }),
    reviews: relationship({ ref: 'PrescriptionReview.prescription', many: true }),
    safetyReviews: relationship({ ref: 'ClinicalSafetyReview.prescription', many: true }),
    dispensingLabels: relationship({ ref: 'DispensingLabel.prescription', many: true }),
    refillRequests: relationship({ ref: 'RefillRequest.prescription', many: true }),
    transfers: relationship({ ref: 'PrescriptionTransfer.prescription', many: true }),
    approval: relationship({ ref: 'HumanApproval.prescriptions' }),
    orders: relationship({ ref: 'Order.prescription', many: true }),
    ...trackingFields,
  },
})
