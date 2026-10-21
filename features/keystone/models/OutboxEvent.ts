import { list } from '@keystone-6/core'
import { trackingFields } from './trackingFields'
import { denyAll } from '@keystone-6/core/access'
import { integer, json, relationship, select, text, timestamp } from '@keystone-6/core/fields'

import { rules } from '../access'
import { requiredRelationshipDb } from './requiredRelationship'

/**
 * Immutable transactional event snapshot. Delivery state is changed only by
 * controlled worker/replay operations through sudo contexts; raw GraphQL
 * lifecycle mutations are denied.
 */
export const OutboxEvent = list({
  access: {
    operation: {
      query: denyAll,
      create: denyAll,
      update: denyAll,
      delete: denyAll,
    },
    filter: { query: rules.canReadTenantRecords },
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { isHidden: true,
    hideCreate: true,
    hideDelete: true,
    listView: { initialColumns: ['eventType', 'aggregateType', 'aggregateId', 'status', 'occurredAt'] },
  },
  fields: {
    eventKey: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    eventType: text({ validation: { isRequired: true }, isIndexed: true }),
    aggregateType: text({ validation: { isRequired: true }, isIndexed: true }),
    aggregateId: text({ validation: { isRequired: true }, isIndexed: true }),
    payload: json({ access: { update: denyAll } }),
    payloadHash: text({ validation: { isRequired: true }, access: { update: denyAll } }),
    status: select({
      type: 'string',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Processing', value: 'processing' },
        { label: 'Delivered', value: 'delivered' },
        { label: 'Failed', value: 'failed' },
        { label: 'Dead letter', value: 'dead_letter' },
      ],
      defaultValue: 'pending',
      validation: { isRequired: true },
    }),
    attempts: integer({ defaultValue: 0, validation: { isRequired: true, min: 0 } }),
    maxAttempts: integer({ defaultValue: 8, validation: { isRequired: true, min: 1 } }),
    replayCount: integer({ defaultValue: 0, validation: { isRequired: true, min: 0 } }),
    lastError: text({ db: { isNullable: true } }),
    nextAttemptAt: timestamp(),
    lockedAt: timestamp(),
    lockToken: text({ isIndexed: true, db: { isNullable: true } }),
    occurredAt: timestamp({ validation: { isRequired: true }, defaultValue: { kind: 'now' }, access: { update: denyAll } }),
    processedAt: timestamp(),
    ...trackingFields,
    organization: relationship({ ref: 'Organization.outboxEvents', db: requiredRelationshipDb }),
    location: relationship({ ref: 'PharmacyLocation.outboxEvents' }),
  },
})
