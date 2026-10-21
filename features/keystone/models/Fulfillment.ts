import { list } from '@keystone-6/core'
import { denyAll } from '@keystone-6/core/access'
import { relationship, select, text, timestamp } from '@keystone-6/core/fields'

import { isSignedIn, rules } from '../access'
import { fulfillmentHooks } from '../hooks/fulfillment'
import { requiredRelationshipDb } from './requiredRelationship'
import { trackingFields } from './trackingFields'

export const Fulfillment = list({
  access: {
    operation: {
      query: isSignedIn,
      create: denyAll,
      update: denyAll,
      delete: denyAll,
    },
    filter: { query: rules.canReadTenantRecords, update: rules.canReadTenantRecords, delete: rules.canReadTenantRecords },
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  hooks: fulfillmentHooks,
  fields: {
    method: select({
      type: 'string',
      options: [
        { label: 'Pickup', value: 'pickup' },
        { label: 'Delivery', value: 'delivery' },
        { label: 'Point of sale', value: 'pos' },
      ],
      validation: { isRequired: true },
    }),
    status: select({
      type: 'string',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Preparing', value: 'preparing' },
        { label: 'Ready', value: 'ready' },
        { label: 'Out for delivery', value: 'out_for_delivery' },
        { label: 'Handed off', value: 'handed_off' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      defaultValue: 'pending',
    }),
    handoffCodeHash: text({ access: { read: () => false } }),
    readyAt: timestamp(),
    handedOffAt: timestamp(),
    organization: relationship({ ref: 'Organization', db: requiredRelationshipDb }),
    location: relationship({ ref: 'PharmacyLocation', db: requiredRelationshipDb }),
    order: relationship({ ref: 'Order.fulfillment', db: requiredRelationshipDb }),
    assignedTo: relationship({ ref: 'User' }),
    ...trackingFields,
  },
})
