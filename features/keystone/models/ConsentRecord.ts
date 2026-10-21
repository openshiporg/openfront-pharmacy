import { list } from '@keystone-6/core'
import { trackingFields } from './trackingFields'
import { checkbox, json, relationship, select, text, timestamp } from '@keystone-6/core/fields'

import { isSignedIn, permissions, rules } from '../access'

const denyMutation = () => false

export const ConsentRecord = list({
  access: {
    operation: { query: isSignedIn, create: denyMutation, update: denyMutation, delete: denyMutation },
    filter: { query: rules.canReadPatientChildren },
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  hooks: {
    validateInput: ({ operation, resolvedData, addValidationError }: any) => {
      if (operation !== 'create') return
      const hasTransfer = Boolean(resolvedData.transfer?.connect?.id)
      const hasOrder = Boolean(resolvedData.order?.connect?.id)
      if (hasTransfer === hasOrder) addValidationError('Consent must attach to exactly one transfer or order subject')
      if (hasTransfer && !resolvedData.patient?.connect?.id) addValidationError('Transfer consent requires a patient relationship')
    },
  },
  fields: {
    consentType: select({
      type: 'string',
      options: [
        { label: 'Privacy notice', value: 'privacy_notice' },
        { label: 'Communications', value: 'communications' },
        { label: 'Prescription transfer', value: 'prescription_transfer' },
        { label: 'Delivery', value: 'delivery' },
        { label: 'Insurance submission', value: 'insurance_submission' },
      ],
      validation: { isRequired: true },
    }),
    policyVersion: text({ validation: { isRequired: true } }),
    statementKey: text({ validation: { isRequired: true } }),
    accepted: checkbox({ defaultValue: false }),
    captureMethod: text({ validation: { isRequired: true } }),
    grantedAt: timestamp({ validation: { isRequired: true }, defaultValue: { kind: 'now' } }),
    revokedAt: timestamp(),
    evidence: json({
      access: { read: permissions.canViewPatientPrivateData },
      ui: { description: 'Bounded evidence only; never store raw prescription, payment, or clinical payloads.' },
    }),
    patient: relationship({ ref: 'PatientProfile.consents' }),
    actor: relationship({ ref: 'User' }),
    transfer: relationship({ ref: 'PrescriptionTransfer.consent' }),
    order: relationship({ ref: 'Order.consent' }),
    ...trackingFields,
  },
})
