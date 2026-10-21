import { list } from '@keystone-6/core'
import { denyAll } from '@keystone-6/core/access'
import { json, relationship, select, text, timestamp } from '@keystone-6/core/fields'
import { requiredRelationshipDb } from './requiredRelationship'
import { trackingFields } from './trackingFields'

export const IntegrationWebhookEvent = list({
  access: { operation: { query: denyAll, create: denyAll, update: denyAll, delete: denyAll } },
  graphql: { omit: { create: true, update: true, delete: true } },
  fields: {
    eventKey: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    externalEventId: text({ validation: { isRequired: true }, isIndexed: true }),
    eventType: text({ validation: { isRequired: true } }),
    status: select({ type: 'string', options: [{ label: 'Processed', value: 'processed' }, { label: 'Ignored', value: 'ignored' }, { label: 'Failed', value: 'failed' }], defaultValue: 'processed' }),
    payload: json(),
    receivedAt: timestamp({ defaultValue: { kind: 'now' } }),
    organization: relationship({ ref: 'Organization.integrationWebhookEvents', db: requiredRelationshipDb }),
    provider: relationship({ ref: 'IntegrationProvider.webhookEvents', db: requiredRelationshipDb }),
    workflow: relationship({ ref: 'ExternalIntegrationWorkflow' }),
    ...trackingFields,
  },
})
