import { list } from '@keystone-6/core'
import { denyAll } from '@keystone-6/core/access'
import { integer, json, relationship, select, text, timestamp } from '@keystone-6/core/fields'

import { isSignedIn, permissions, rules } from '../access'
import { orderHooks } from '../hooks/order'
import { requiredRelationshipDb } from './requiredRelationship'
import { immutableRelationship } from './immutableRelationship'
import { trackingFields } from './trackingFields'

export const Order = list({
  access: {
    operation: {
      query: isSignedIn,
      create: denyAll,
      update: denyAll,
      delete: denyAll,
    },
    filter: { query: rules.canReadOrders, update: rules.canReadOrders },
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true, listView: { initialColumns: ['orderNumber', 'status', 'fulfillmentMethod', 'location', 'totalAmount'] } },
  hooks: orderHooks,
  fields: {
    orderNumber: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    idempotencyKey: text({ isIndexed: 'unique', access: { update: denyAll } }),
    guestTokenHash: text({ access: { read: denyAll, create: denyAll, update: denyAll }, isIndexed: true }),
    checkoutEvidence: json({ access: { read: permissions.canViewAuditLogs, update: () => false } }),
    email: text({ access: { read: permissions.canViewPatientPrivateData } }),
    phone: text({ access: { read: permissions.canViewPatientPrivateData } }),
    // The name staff match at pickup or delivery.
    customerName: text({ access: { read: permissions.canViewPatientPrivateData } }),
    status: select({
      access: { update: () => false },
      type: 'string',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Review required', value: 'review_required' },
        { label: 'Approved', value: 'approved' },
        { label: 'Processing', value: 'processing' },
        { label: 'Ready', value: 'ready' },
        { label: 'Out for delivery', value: 'out_for_delivery' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      defaultValue: 'pending',
    }),
    fulfillmentMethod: select({
      type: 'string',
      options: [
        { label: 'Pickup', value: 'pickup' },
        { label: 'Delivery', value: 'delivery' },
        { label: 'Point of sale', value: 'pos' },
      ],
      defaultValue: 'pickup',
    }),
    subtotalAmount: integer({ validation: { isRequired: true, min: 0 } }),
    taxAmount: integer({ validation: { isRequired: true, min: 0 }, defaultValue: 0 }),
    deliveryAmount: integer({ validation: { isRequired: true, min: 0 }, defaultValue: 0 }),
    totalAmount: integer({ validation: { isRequired: true, min: 0 } }),
    currencyCode: text({ validation: { isRequired: true }, defaultValue: 'USD' }),
    pickupAt: timestamp(),
    deliveryWindow: text(),
    shippingAddressSnapshot: json({ access: { read: permissions.canViewPatientPrivateData, update: () => false } }),
    billingAddressSnapshot: json({ access: { read: permissions.canViewPatientPrivateData, update: () => false } }),
    organization: relationship({ ref: 'Organization.orders', db: requiredRelationshipDb }),
    location: relationship({ ref: 'PharmacyLocation.orders', db: requiredRelationshipDb }),
    customer: relationship({ ref: 'User.orders', access: immutableRelationship }),
    patient: relationship({ ref: 'PatientProfile.orders', access: immutableRelationship }),
    prescription: relationship({ ref: 'Prescription.orders', access: immutableRelationship }),
    cart: relationship({ ref: 'Cart.order', access: immutableRelationship }),
    consent: relationship({ ref: 'ConsentRecord.order', access: immutableRelationship }),
    approval: relationship({ ref: 'HumanApproval.orders', access: immutableRelationship }),
    lineItems: relationship({ ref: 'OrderLineItem.order', many: true, access: immutableRelationship }),
    dispensingLabels: relationship({ ref: 'DispensingLabel.order', many: true, access: immutableRelationship }),
    payments: relationship({ ref: 'Payment.order', many: true, access: immutableRelationship }),
    fulfillment: relationship({ ref: 'Fulfillment.order', access: immutableRelationship }),
    ...trackingFields,
  },
})
