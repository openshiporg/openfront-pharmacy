import { list } from '@keystone-6/core'
import { denyAll } from '@keystone-6/core/access'
import { checkbox, integer, json, relationship, select, text, timestamp } from '@keystone-6/core/fields'

import { permissions, rules } from '../access'
import { requiredRelationshipDb } from './requiredRelationship'
import { trackingFields } from './trackingFields'

export const PaymentSession = list({
  access: {
    operation: {
      query: permissions.canManagePayments,
      create: denyAll,
      update: denyAll,
      delete: denyAll,
    },
    filter: { query: rules.canReadPaymentSessions },
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  fields: {
    amount: integer({ validation: { isRequired: true, min: 0 } }),
    currencyCode: text({ validation: { isRequired: true }, defaultValue: 'USD' }),
    status: select({
      type: 'string',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Requires action', value: 'requires_action' },
        { label: 'Authorized', value: 'authorized' },
        { label: 'Captured', value: 'captured' },
        { label: 'Settled without order', value: 'settled_unordered' },
        { label: 'Compensation pending', value: 'compensation_pending' },
        { label: 'Compensated', value: 'compensated' },
        { label: 'Failed', value: 'failed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      defaultValue: 'pending',
    }),
    isSelected: checkbox({ defaultValue: true }),
    idempotencyKey: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    externalPaymentId: text({ isIndexed: true, db: { isNullable: true } }),
    reconciliationStatus: select({
      type: 'string',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Settled without order', value: 'settled_unordered' },
        { label: 'Ordered', value: 'ordered' },
        { label: 'Compensation pending', value: 'compensation_pending' },
        { label: 'Compensated', value: 'compensated' },
        { label: 'Manual review', value: 'manual_review' },
      ],
      defaultValue: 'pending',
    }),
    reconciliationAttempts: integer({ validation: { min: 0 }, defaultValue: 0 }),
    lastReconciledAt: timestamp(),
    failureReason: text({ db: { isNullable: true }, ui: { displayMode: 'textarea' } }),
    data: json({ access: { read: permissions.canManagePayments } }),
    organization: relationship({ ref: 'Organization' }),
    location: relationship({ ref: 'PharmacyLocation' }),
    cart: relationship({ ref: 'Cart.paymentSessions', db: requiredRelationshipDb }),
    provider: relationship({ ref: 'PaymentProvider.paymentSessions', db: requiredRelationshipDb }),
    payment: relationship({ ref: 'Payment.session' }),
    ...trackingFields,
  },
})
