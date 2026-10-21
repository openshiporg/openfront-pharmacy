import { list } from '@keystone-6/core'
import { denyAll } from '@keystone-6/core/access'
import { relationship, select, text, timestamp } from '@keystone-6/core/fields'

import { isSignedIn, permissions, rules } from '../access'
import { requiredRelationshipDb } from './requiredRelationship'
import { trackingFields } from './trackingFields'

export const PatientMedication = list({
  access: {
    operation: { query: isSignedIn, create: denyAll, update: denyAll, delete: denyAll },
    filter: { query: rules.canReadPatientChildren },
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  fields: {
    medicationKey: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    requestFingerprint: text({ validation: { isRequired: true } }),
    medicationName: text({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    directions: text({ access: { read: permissions.canViewPatientPrivateData } }),
    status: select({ type: 'string', options: [{ label: 'Current', value: 'current' }, { label: 'Discontinued', value: 'discontinued' }, { label: 'Entered in error', value: 'entered_in_error' }], defaultValue: 'current' }),
    source: text({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    sourceReference: text({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    recordedAt: timestamp({ defaultValue: { kind: 'now' }, validation: { isRequired: true } }),
    organization: relationship({ ref: 'Organization', db: requiredRelationshipDb }),
    patient: relationship({ ref: 'PatientProfile.medications', db: requiredRelationshipDb }),
    recordedBy: relationship({ ref: 'User', db: requiredRelationshipDb }),
    approval: relationship({ ref: 'HumanApproval' }),
    ...trackingFields,
  },
})
