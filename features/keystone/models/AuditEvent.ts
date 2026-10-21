import { list } from '@keystone-6/core'
import { trackingFields } from './trackingFields'
import { json, relationship, text, timestamp } from '@keystone-6/core/fields'

import { permissions, rules } from '../access'
import { requiredRelationshipDb } from './requiredRelationship'

const denyMutation = () => false

export const AuditEvent = list({
  access: {
    operation: { query: permissions.canViewAuditLogs, create: denyMutation, update: denyMutation, delete: denyMutation },
    filter: { query: rules.canReadTenantRecords },
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  fields: {
    eventKey: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    eventType: text({ validation: { isRequired: true } }),
    resourceType: text({ validation: { isRequired: true } }),
    resourceId: text({ validation: { isRequired: true } }),
    occurredAt: timestamp({ validation: { isRequired: true }, defaultValue: { kind: 'now' } }),
    actorType: text({ validation: { isRequired: true }, defaultValue: 'user' }),
    metadata: json({ ui: { description: 'Minimum necessary, non-secret audit metadata.' } }),
    organization: relationship({ ref: 'Organization', db: requiredRelationshipDb }),
    location: relationship({ ref: 'PharmacyLocation' }),
    actor: relationship({ ref: 'User.auditEvents', access: { create: denyMutation, update: denyMutation } }),
    patient: relationship({ ref: 'PatientProfile.auditEvents', access: { create: denyMutation, update: denyMutation } }),
    ...trackingFields,
  },
})
