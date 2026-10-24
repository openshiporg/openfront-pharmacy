import { list } from '@keystone-6/core'
import { denyAll } from '@keystone-6/core/access'
import { relationship, select, text, timestamp } from '@keystone-6/core/fields'

import { isSignedIn, permissions, rules } from '../access'
import { requiredRelationshipDb } from './requiredRelationship'
import { trackingFields } from './trackingFields'

export const PatientAllergy = list({
  access: {
    operation: { query: isSignedIn, create: denyAll, update: denyAll, delete: denyAll },
    filter: { query: rules.canReadPatientChildren },
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  fields: {
    allergyKey: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    requestFingerprint: text({ validation: { isRequired: true } }),
    allergen: text({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    reaction: text({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    severity: select({
      type: 'string',
      options: [
        { label: 'Unknown', value: 'unknown' },
        { label: 'Mild', value: 'mild' },
        { label: 'Moderate', value: 'moderate' },
        { label: 'Severe', value: 'severe' },
      ],
      defaultValue: 'unknown',
    }),
    status: select({ type: 'string', options: [{ label: 'Active', value: 'active' }, { label: 'No known allergies', value: 'none_known' }, { label: 'Entered in error', value: 'entered_in_error' }, { label: 'Inactive', value: 'inactive' }], defaultValue: 'active' }),
    source: text({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    sourceReference: text({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    recordedAt: timestamp({ defaultValue: { kind: 'now' }, validation: { isRequired: true } }),
    organization: relationship({ ref: 'Organization', db: requiredRelationshipDb }),
    patient: relationship({ ref: 'PatientProfile.allergies', db: requiredRelationshipDb }),
    recordedBy: relationship({ ref: 'User', db: requiredRelationshipDb }),
    approval: relationship({ ref: 'HumanApproval' }),
    ...trackingFields,
  },
})
