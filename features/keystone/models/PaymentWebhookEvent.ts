import { list } from '@keystone-6/core'
import { denyAll } from '@keystone-6/core/access'
import { json, relationship, select, text, timestamp } from '@keystone-6/core/fields'
import { requiredRelationshipDb } from './requiredRelationship'
import { trackingFields } from './trackingFields'

export const PaymentWebhookEvent = list({
  access: { operation: { query: denyAll, create: denyAll, update: denyAll, delete: denyAll } },
  graphql: { omit: { create: true, update: true, delete: true } },
  fields: {
    eventKey: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    externalEventId: text({ validation: { isRequired: true }, isIndexed: true }),
    eventType: text({ validation: { isRequired: true } }),
    status: select({
      type: 'string',
      options: [
        { label: 'Received', value: 'received' },
        { label: 'Processed', value: 'processed' },
        { label: 'Ignored', value: 'ignored' },
        { label: 'Failed', value: 'failed' },
      ],
      defaultValue: 'received',
    }),
    resource: json(),
    error: text({ ui: { displayMode: 'textarea' } }),
    receivedAt: timestamp({ defaultValue: { kind: 'now' } }),
    processedAt: timestamp(),
    organization: relationship({ ref: 'Organization.paymentWebhookEvents', db: requiredRelationshipDb }),
    provider: relationship({ ref: 'PaymentProvider.webhookEvents', db: requiredRelationshipDb }),
    ...trackingFields,
  },
})
