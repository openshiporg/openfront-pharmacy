import { list } from '@keystone-6/core'
import { integer, relationship, select, text, timestamp } from '@keystone-6/core/fields'

import { permissions, rules } from '../access'
import { inventoryMovementHooks } from '../hooks/inventory-movement'
import { requiredRelationshipDb } from './requiredRelationship'
import { trackingFields } from './trackingFields'

const denyMutation = () => false

export const InventoryMovement = list({
  access: {
    operation: { query: ({ session }) => permissions.canManageInventory({ session }) || permissions.canManageRecalls({ session }) || permissions.canDispenseMedications({ session }), create: denyMutation, update: denyMutation, delete: denyMutation },
    filter: { query: rules.canReadLocationRecords },
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  hooks: inventoryMovementHooks,
  fields: {
    movementType: select({
      type: 'string',
      options: [
        { label: 'Receive', value: 'receive' },
        { label: 'Reserve', value: 'reserve' },
        { label: 'Dispense', value: 'dispense' },
        { label: 'Sale', value: 'sale' },
        { label: 'Return', value: 'return' },
        { label: 'Quarantine', value: 'quarantine' },
        { label: 'Release', value: 'release' },
        { label: 'Recall', value: 'recall' },
        { label: 'Expire', value: 'expire' },
        { label: 'Destroy', value: 'destroy' },
        { label: 'Adjust', value: 'adjust' },
      ],
      validation: { isRequired: true },
    }),
    quantityDelta: integer({ validation: { isRequired: true } }),
    reason: text({ validation: { isRequired: true } }),
    idempotencyKey: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    requestFingerprint: text({ db: { isNullable: true } }),
    occurredAt: timestamp({ validation: { isRequired: true }, defaultValue: { kind: 'now' } }),
    organization: relationship({ ref: 'Organization', db: requiredRelationshipDb }),
    location: relationship({ ref: 'PharmacyLocation', db: requiredRelationshipDb }),
    product: relationship({ ref: 'Product', db: requiredRelationshipDb }),
    lot: relationship({ ref: 'InventoryLot.movements', db: requiredRelationshipDb }),
    actor: relationship({ ref: 'User' }),
    patient: relationship({ ref: 'PatientProfile' }),
    prescription: relationship({ ref: 'Prescription' }),
    prescriptionItem: relationship({ ref: 'PrescriptionItem' }),
    order: relationship({ ref: 'Order' }),
    approval: relationship({ ref: 'HumanApproval.inventoryMovements' }),
    ...trackingFields,
  },
})
