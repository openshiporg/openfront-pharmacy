import { list } from '@keystone-6/core'
import { denyAll } from '@keystone-6/core/access'
import { checkbox, float, integer, relationship, select, text, timestamp } from '@keystone-6/core/fields'

import { permissions, rules } from '../access'
import { inventoryLotHooks } from '../hooks/inventory-lot'
import { requiredRelationshipDb } from './requiredRelationship'
import { trackingFields } from './trackingFields'

export const InventoryLot = list({
  access: {
    operation: {
      query: ({ session }) => permissions.canManageInventory({ session }) || permissions.canManageRecalls({ session }) || permissions.canDispenseMedications({ session }),
      create: denyAll,
      update: denyAll,
      delete: denyAll,
    },
    filter: { query: rules.canReadLocationRecords, update: rules.canReadLocationRecords, delete: rules.canReadLocationRecords },
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true, listView: { initialColumns: ['lotNumber', 'product', 'expirationDate', 'quantityAvailable', 'status'] } },
  hooks: inventoryLotHooks,
  fields: {
    lotNumber: text({ validation: { isRequired: true }, isIndexed: true }),
    serialNumber: text(),
    expirationDate: timestamp({ validation: { isRequired: true } }),
    receivedAt: timestamp({ validation: { isRequired: true }, defaultValue: { kind: 'now' } }),
    quantityReceived: integer({ validation: { isRequired: true, min: 0 } }),
    quantityAvailable: integer({ validation: { isRequired: true, min: 0 } }),
    quantityQuarantined: integer({ validation: { isRequired: true, min: 0 }, defaultValue: 0 }),
    status: select({
      type: 'string',
      options: [
        { label: 'Available', value: 'available' },
        { label: 'Quarantined', value: 'quarantined' },
        { label: 'Expired', value: 'expired' },
        { label: 'Recalled', value: 'recalled' },
        { label: 'Depleted', value: 'depleted' },
      ],
      defaultValue: 'quarantined',
    }),
    storageBin: text(),
    coldChainRequired: checkbox({ defaultValue: false }),
    minimumTemperatureC: float(),
    maximumTemperatureC: float(),
    coldChainEvidenceComplete: checkbox({ defaultValue: false }),
    product: relationship({ ref: 'Product.inventoryLots', access: { create: denyAll, update: denyAll }, db: requiredRelationshipDb }),
    location: relationship({ ref: 'PharmacyLocation.inventoryLots', access: { create: denyAll, update: denyAll }, db: requiredRelationshipDb }),
    supplier: relationship({ ref: 'Supplier.inventoryLots', access: { create: denyAll, update: denyAll } }),
    movements: relationship({ ref: 'InventoryMovement.lot', many: true }),
    temperatureExcursions: relationship({ ref: 'TemperatureExcursion.lot', many: true }),
    recalls: relationship({ ref: 'Recall.lots', many: true }),
    ...trackingFields,
  },
})
