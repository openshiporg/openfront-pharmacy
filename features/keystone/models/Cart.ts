import { list } from '@keystone-6/core'
import { denyAll } from '@keystone-6/core/access'
import { integer, relationship, select, text, timestamp } from '@keystone-6/core/fields'

import { permissions, rules } from '../access'
import { requiredRelationshipDb } from './requiredRelationship'
import { trackingFields } from './trackingFields'

export const Cart = list({
  access: {
    operation: {
      query: permissions.canManageOrders,
      create: denyAll,
      update: denyAll,
      delete: denyAll,
    },
    filter: { query: rules.canReadOrders },
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  fields: {
    guestTokenHash: text({ access: { read: denyAll, create: denyAll, update: denyAll }, isIndexed: true }),
    status: select({
      type: 'string',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Submitted', value: 'submitted' },
        { label: 'Expired', value: 'expired' },
        { label: 'Abandoned', value: 'abandoned' },
      ],
      defaultValue: 'active',
    }),
    fulfillmentMethod: select({
      type: 'string',
      options: [
        { label: 'Pickup', value: 'pickup' },
        { label: 'Delivery', value: 'delivery' },
      ],
      defaultValue: 'pickup',
    }),
    subtotalAmount: integer({ defaultValue: 0, validation: { min: 0 } }),
    taxAmount: integer({ defaultValue: 0, validation: { min: 0 } }),
    deliveryAmount: integer({ defaultValue: 0, validation: { min: 0 } }),
    totalAmount: integer({ defaultValue: 0, validation: { min: 0 } }),
    expiresAt: timestamp(),
    organization: relationship({ ref: 'Organization', db: requiredRelationshipDb }),
    location: relationship({ ref: 'PharmacyLocation', db: requiredRelationshipDb }),
    customer: relationship({ ref: 'User.carts' }),
    items: relationship({ ref: 'CartItem.cart', many: true }),
    paymentSessions: relationship({ ref: 'PaymentSession.cart', many: true }),
    order: relationship({ ref: 'Order.cart' }),
    ...trackingFields,
  },
})
