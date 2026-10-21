import { list } from '@keystone-6/core'
import { denyAll } from '@keystone-6/core/access'
import { checkbox, integer, relationship, text } from '@keystone-6/core/fields'

import { isSignedIn, permissions, rules } from '../access'
import { requiredRelationshipDb } from './requiredRelationship'
import { trackingFields } from './trackingFields'

export const PrescriptionItem = list({
  access: {
    operation: {
      query: isSignedIn,
      create: denyAll,
      update: denyAll,
      delete: denyAll,
    },
    filter: { query: rules.canReadPrescriptionChildren, update: rules.canReadPrescriptionChildren, delete: rules.canReadPrescriptionChildren },
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  hooks: {
    validateInput: ({ operation, resolvedData, addValidationError }) => {
      if (operation === 'create' && (!resolvedData.prescription?.connect?.id || !resolvedData.product?.connect?.id)) {
        addValidationError('Prescription item requires prescription and product relationships')
      }
    },
    beforeOperation: ({ operation, inputData }) => {
      if (operation === 'delete') throw new Error('Prescription item evidence cannot be deleted')
      if (operation === 'update' && Object.keys(inputData || {}).some((field) => !['quantityDispensed', 'refillsRemaining', 'refillsReserved', 'activeFillNumber'].includes(field))) {
        throw new Error('Prescription item identity and prescribed snapshot are immutable')
      }
    },
  },
  fields: {
    medicationNameSnapshot: text({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    sig: text({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData }, ui: { displayMode: 'textarea' } }),
    fillLineage: text({ db: { isNullable: true }, access: { update: denyAll } }),
    activeFillNumber: integer({ db: { isNullable: true }, access: { create: denyAll, update: denyAll } }),
    quantityPrescribed: integer({ validation: { isRequired: true, min: 1 } }),
    daysSupply: integer({ validation: { min: 1 } }),
    refillsAuthorized: integer({ validation: { min: 0 }, defaultValue: 0 }),
    refillsRemaining: integer({ validation: { min: 0 }, defaultValue: 0 }),
    refillsReserved: integer({ validation: { min: 0 }, defaultValue: 0 }),
    quantityDispensed: integer({ validation: { min: 0 }, defaultValue: 0 }),
    substitutionAllowed: checkbox({ defaultValue: false }),
    prescription: relationship({ ref: 'Prescription.items', access: { create: denyAll, update: denyAll }, db: requiredRelationshipDb }),
    drugReference: relationship({ ref: 'DrugReference.prescriptionItems', db: requiredRelationshipDb }),
    product: relationship({ ref: 'Product.prescriptionItems', access: { create: denyAll, update: denyAll }, db: requiredRelationshipDb }),
    refillRequests: relationship({ ref: 'RefillRequest.prescriptionItem', many: true }),
    dispensingLabels: relationship({ ref: 'DispensingLabel.prescriptionItem', many: true }),
    ...trackingFields,
  },
})
