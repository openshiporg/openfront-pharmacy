import { list } from '@keystone-6/core'
import { trackingFields } from './trackingFields'
import { integer, json, relationship, text, timestamp } from '@keystone-6/core/fields'

import { isSignedIn, permissions, rules } from '../access'
import { orderLineItemHooks } from '../hooks/order'
import { requiredRelationshipDb } from './requiredRelationship'

const denyMutation = () => false

export const OrderLineItem = list({
  access: {
    operation: {
      query: isSignedIn,
      create: denyMutation,
      update: denyMutation,
      delete: denyMutation,
    },
    filter: { query: rules.canReadOrderLineItems },
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  hooks: orderLineItemHooks,
  fields: {
    title: text({ validation: { isRequired: true }, access: { update: denyMutation } }),
    sku: text({ access: { update: denyMutation } }),
    ndc11Snapshot: text({ access: { update: denyMutation } }),
    quantity: integer({ validation: { isRequired: true, min: 1 }, access: { update: denyMutation } }),
    unitPriceAmount: integer({ validation: { isRequired: true, min: 0 }, access: { update: denyMutation } }),
    lineTotalAmount: integer({ validation: { isRequired: true, min: 0 }, access: { update: denyMutation } }),
    imageUrl: text({ access: { update: denyMutation } }),
    prescriptionRequirementSnapshot: text({ validation: { isRequired: true }, access: { update: denyMutation } }),
    metadata: json({ access: { read: permissions.canManageOrders, update: denyMutation } }),
    order: relationship({ ref: 'Order.lineItems', access: { update: denyMutation }, db: requiredRelationshipDb }),
    product: relationship({ ref: 'Product.orderLineItems', access: { create: denyMutation, update: denyMutation }, db: requiredRelationshipDb }),
    lotAllocationSnapshot: json({ access: { read: permissions.canManageInventory, update: denyMutation } }),
    ...trackingFields,
  },
})
