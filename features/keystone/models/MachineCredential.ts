import { list } from '@keystone-6/core'
import { denyAll } from '@keystone-6/core/access'
import { integer, json, relationship, select, text, timestamp } from '@keystone-6/core/fields'
import { requiredRelationshipDb } from './requiredRelationship'
import { trackingFields } from './trackingFields'

export const MachineCredential = list({
  access: { operation: { query: denyAll, create: denyAll, update: denyAll, delete: denyAll } },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { isHidden: true },
  fields: {
    name: text({ validation: { isRequired: true } }),
    tokenPrefix: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    tokenHash: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    scopes: json(),
    status: select({
      type: 'string',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Revoked', value: 'revoked' },
      ],
      defaultValue: 'active',
    }),
    expiresAt: timestamp({ validation: { isRequired: true } }),
    revokedAt: timestamp(),
    lastUsedAt: timestamp(),
    rateWindowStartedAt: timestamp(),
    rateRequestCount: integer({ defaultValue: 0, validation: { min: 0 } }),
    organization: relationship({ ref: 'Organization.machineCredentials', db: requiredRelationshipDb }),
    location: relationship({ ref: 'PharmacyLocation.machineCredentials' }),
    createdBy: relationship({ ref: 'User.createdMachineCredentials', db: requiredRelationshipDb }),
    ...trackingFields,
  },
})
