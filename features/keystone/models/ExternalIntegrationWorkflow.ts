import { list } from '@keystone-6/core'
import { denyAll } from '@keystone-6/core/access'
import { integer, json, relationship, select, text, timestamp } from '@keystone-6/core/fields'
import { requiredRelationshipDb } from './requiredRelationship'
import { trackingFields } from './trackingFields'

export const ExternalIntegrationWorkflow = list({
  access: { operation: { query: denyAll, create: denyAll, update: denyAll, delete: denyAll } },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { isHidden: true },
  fields: {
    workflowKey: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    workflowType: select({ type: 'string', options: [{ label: 'eRx', value: 'erx' }, { label: 'Insurance', value: 'insurance' }], validation: { isRequired: true } }),
    resourceType: text({ validation: { isRequired: true } }),
    resourceId: text({ validation: { isRequired: true }, isIndexed: true }),
    status: select({
      type: 'string',
      options: [
        { label: 'Pending submission', value: 'pending_submission' },
        { label: 'Submitted', value: 'submitted' },
        { label: 'Pending', value: 'pending' },
        { label: 'Accepted', value: 'accepted' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Failed', value: 'failed' },
      ],
      defaultValue: 'pending_submission',
    }),
    idempotencyKey: text({ validation: { isRequired: true }, isIndexed: true }),
    externalReference: text({ isIndexed: true }),
    requestPayload: json(),
    responsePayload: json(),
    attempts: integer({ defaultValue: 0, validation: { min: 0 } }),
    lastError: text({ db: { isNullable: true }, ui: { displayMode: 'textarea' } }),
    submittedAt: timestamp(),
    resolvedAt: timestamp(),
    organization: relationship({ ref: 'Organization.externalIntegrationWorkflows', db: requiredRelationshipDb }),
    location: relationship({ ref: 'PharmacyLocation.externalIntegrationWorkflows', db: requiredRelationshipDb }),
    provider: relationship({ ref: 'IntegrationProvider.workflows', db: requiredRelationshipDb }),
    ...trackingFields,
  },
})
