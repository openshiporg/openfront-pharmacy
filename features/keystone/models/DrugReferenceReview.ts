import { list } from '@keystone-6/core'
import { denyAll } from '@keystone-6/core/access'
import { relationship, select, text, timestamp } from '@keystone-6/core/fields'

import { isSignedIn, rules } from '../access'
import { requiredRelationshipDb } from './requiredRelationship'
import { trackingFields } from './trackingFields'

export const DrugReferenceReview = list({
  access: {
    operation: { query: isSignedIn, create: denyAll, update: denyAll, delete: denyAll },
    filter: { query: rules.canReadOrganizationRecords },
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  fields: {
    reviewKey: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    status: select({ type: 'string', options: [{ label: 'Active evidence', value: 'active' }, { label: 'Superseded', value: 'superseded' }, { label: 'Rejected', value: 'rejected' }], defaultValue: 'active' }),
    marketingStatusSnapshot: select({ type: 'string', options: [{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }], validation: { isRequired: true } }),
    controlledScheduleSnapshot: select({ type: 'string', options: [{ label: 'Not scheduled', value: 'none' }, { label: 'Controlled or unsupported', value: 'controlled_or_unsupported' }], validation: { isRequired: true } }),
    sourceName: text({ validation: { isRequired: true } }),
    sourceVersion: text({ validation: { isRequired: true } }),
    sourceReference: text({ validation: { isRequired: true } }),
    reviewedAt: timestamp({ defaultValue: { kind: 'now' }, validation: { isRequired: true } }),
    organization: relationship({ ref: 'Organization.drugReferenceReviews', db: requiredRelationshipDb }),
    drugReference: relationship({ ref: 'DrugReference.reviews', db: requiredRelationshipDb }),
    reviewedBy: relationship({ ref: 'User', db: requiredRelationshipDb }),
    approval: relationship({ ref: 'HumanApproval', db: requiredRelationshipDb }),
    ...trackingFields,
  },
})
