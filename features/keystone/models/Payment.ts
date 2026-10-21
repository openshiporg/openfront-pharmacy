import { list } from '@keystone-6/core'
import { denyAll } from '@keystone-6/core/access'
import { integer, json, relationship, select, text, timestamp } from '@keystone-6/core/fields'

import { permissions, rules } from '../access'
import { requiredRelationshipDb } from './requiredRelationship'
import { trackingFields } from './trackingFields'

export const Payment = list({
  access: {
    operation: {
      query: permissions.canManagePayments,
      create: denyAll,
      update: denyAll,
      delete: denyAll,
    },
    filter: { query: rules.canReadPayments },
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
        { label: 'Authorized', value: 'authorized' },
        { label: 'Captured', value: 'captured' },
        { label: 'Refund pending', value: 'refund_pending' },
        { label: 'Refunded', value: 'refunded' },
        { label: 'Failed', value: 'failed' },
      ],
      defaultValue: 'pending',
    }),
    tenderMethod: select({ type: 'string', options: [{ label: 'Provider', value: 'provider' }, { label: 'Operator-attested cash', value: 'cash' }], defaultValue: 'provider' }),
    cashReceivedAmount: integer({ validation: { min: 0 } }),
    changeDueAmount: integer({ validation: { min: 0 } }),
    externalPaymentId: text({ isIndexed: true }),
    processedAt: timestamp(),
    data: json({ access: { read: permissions.canManagePayments } }),
    organization: relationship({ ref: 'Organization' }),
    location: relationship({ ref: 'PharmacyLocation' }),
    order: relationship({ ref: 'Order.payments', db: requiredRelationshipDb }),
    provider: relationship({ ref: 'PaymentProvider.payments' }),
    session: relationship({ ref: 'PaymentSession.payment' }),
    recordedBy: relationship({ ref: 'User' }),
    approval: relationship({ ref: 'HumanApproval' }),
    ...trackingFields,
  },
})
