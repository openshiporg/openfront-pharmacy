import { list } from '@keystone-6/core'
import { trackingFields } from './trackingFields'
import { checkbox, json, relationship, select, text, timestamp } from '@keystone-6/core/fields'

import { permissions, rules } from '../access'
import { requiredRelationshipDb } from './requiredRelationship'

const denyMutation = () => false

export const HumanApproval = list({
  access: {
    operation: { query: permissions.canViewAuditLogs, create: denyMutation, update: denyMutation, delete: denyMutation },
    filter: { query: rules.canReadTenantRecords },
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  fields: {
    actionType: select({
      type: 'string',
      options: [
        { label: 'Patient record evidence', value: 'patient_record' },
        { label: 'Prescription review', value: 'prescription_review' },
        { label: 'Clinical safety review', value: 'clinical_safety_review' },
        { label: 'Clinical safety re-review hold', value: 'clinical_safety_hold' },
        { label: 'Drug reference review', value: 'drug_reference_review' },
        { label: 'Dispense', value: 'dispense' },
        { label: 'Transfer', value: 'transfer' },
        { label: 'Refill', value: 'refill' },
        { label: 'Recall disposition', value: 'recall_disposition' },
        { label: 'Inventory adjustment', value: 'inventory_adjustment' },
        { label: 'Cold-chain disposition', value: 'cold_chain_disposition' },
        { label: 'Credential review evidence', value: 'credential_review' },
        { label: 'Order handoff', value: 'order_handoff' },
        { label: 'Cash/tax policy review', value: 'cash_policy' },
        { label: 'Cash tender received', value: 'cash_tender' },
        { label: 'Cash refund returned', value: 'cash_refund' },
        { label: 'Consequential agent action', value: 'agent_action' },
      ],
      validation: { isRequired: true },
    }),
    reason: text({ validation: { isRequired: true }, ui: { displayMode: 'textarea' } }),
    attested: checkbox({ defaultValue: false }),
    approvedAt: timestamp({ validation: { isRequired: true }, defaultValue: { kind: 'now' } }),
    evidence: json({
      access: { read: permissions.canViewAuditLogs },
      ui: { description: 'Bounded evidence only; never copy raw patient, payment, or external adapter payloads.' },
    }),
    organization: relationship({ ref: 'Organization', db: requiredRelationshipDb }),
    location: relationship({ ref: 'PharmacyLocation' }),
    actor: relationship({ ref: 'User.humanApprovals', db: requiredRelationshipDb }),
    prescriptions: relationship({ ref: 'Prescription.approval', many: true }),
    prescriptionReviews: relationship({ ref: 'PrescriptionReview.approval', many: true }),
    refillRequests: relationship({ ref: 'RefillRequest.approval', many: true }),
    transfers: relationship({ ref: 'PrescriptionTransfer.approval', many: true }),
    recalls: relationship({ ref: 'Recall.approval', many: true }),
    inventoryMovements: relationship({ ref: 'InventoryMovement.approval', many: true }),
    temperatureExcursions: relationship({ ref: 'TemperatureExcursion.approval', many: true }),
    orders: relationship({ ref: 'Order.approval', many: true }),
    ...trackingFields,
  },
})
