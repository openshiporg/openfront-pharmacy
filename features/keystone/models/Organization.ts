import { list } from '@keystone-6/core'
import { denyAll } from '@keystone-6/core/access'
import { checkbox, integer, json, relationship, select, text, timestamp } from '@keystone-6/core/fields'

import { DEFAULT_STORE_LOGO_COLOR, DEFAULT_STORE_LOGO_ICON, normalizeStoreLogoColor } from '../../lib/store-logo'
import { sanitizeStoreLogoSvg } from '../../lib/sanitize-store-logo'
import { normalizeStorefrontTenantKey, safeBrandColor } from '../../pharmacy/branding'
import { isSignedIn, permissions, rules } from '../access'
import { immutableRelationship } from './immutableRelationship'
import { trackingFields } from './trackingFields'

export const Organization = list({
  access: {
    operation: {
      query: isSignedIn,
      create: denyAll,
      update: permissions.canManageOrganizations,
      delete: denyAll,
    },
    filter: { query: rules.canReadOrganizations, update: rules.canReadOrganizations, delete: rules.canReadOrganizations },
  },
  graphql: { omit: { create: true, delete: true } },
  hooks: {
    resolveInput: ({ resolvedData }) => ({
      ...resolvedData,
      ...(resolvedData.storefrontKey !== undefined ? { storefrontKey: normalizeStorefrontTenantKey(resolvedData.storefrontKey) } : {}),
      ...(resolvedData.storefrontHost !== undefined ? { storefrontHost: normalizeStorefrontTenantKey(resolvedData.storefrontHost) } : {}),
      ...(resolvedData.operatorDisplayName !== undefined ? { operatorDisplayName: String(resolvedData.operatorDisplayName || '').trim() } : {}),
      ...(resolvedData.operatorTagline !== undefined ? { operatorTagline: String(resolvedData.operatorTagline || '').trim() } : {}),
    }),
    validateInput: ({ resolvedData, addValidationError }) => {
      if (resolvedData.operatorDisplayName !== undefined && !String(resolvedData.operatorDisplayName || '').trim()) addValidationError('Operator display name is required')
      if (resolvedData.brandPrimaryColor !== undefined && safeBrandColor(resolvedData.brandPrimaryColor, '') !== resolvedData.brandPrimaryColor) addValidationError('Primary brand color must be a six-digit hex color')
      if (resolvedData.brandAccentColor !== undefined && safeBrandColor(resolvedData.brandAccentColor, '') !== resolvedData.brandAccentColor) addValidationError('Accent brand color must be a six-digit hex color')
    },
  },
  ui: { hideCreate: true, hideDelete: true, listView: { initialColumns: ['name', 'slug', 'status'] } },
  fields: {
    name: text({ validation: { isRequired: true } }),
    slug: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    storefrontKey: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    storefrontHost: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    operatorDisplayName: text({ validation: { isRequired: true } }),
    operatorTagline: text({ defaultValue: 'Independent pharmacy care' }),
    brandPrimaryColor: text({ defaultValue: '#18352b' }),
    brandAccentColor: text({ defaultValue: '#8ec9ad' }),
    brandLogoUrl: text(),
    logoIcon: text({ defaultValue: DEFAULT_STORE_LOGO_ICON, hooks: {
      resolveInput: ({ resolvedData, fieldKey }) => resolvedData[fieldKey] === undefined ? undefined : sanitizeStoreLogoSvg(String(resolvedData[fieldKey] || '')),
      validateInput: ({ inputData, resolvedData, fieldKey, addValidationError }) => {
        if (typeof inputData[fieldKey] === 'string' && inputData[fieldKey].trim() && !resolvedData[fieldKey]) addValidationError('Logo must be a valid, safe SVG document')
      },
    } }),
    logoColor: text({ defaultValue: DEFAULT_STORE_LOGO_COLOR, hooks: {
      resolveInput: ({ resolvedData, fieldKey }) => resolvedData[fieldKey] === undefined ? undefined : normalizeStoreLogoColor(resolvedData[fieldKey]),
    } }),
    // Retained column; no longer read or written.
    isDemo: checkbox({ defaultValue: false, access: { create: denyAll, update: denyAll }, ui: { createView: { fieldMode: 'hidden' }, itemView: { fieldMode: 'hidden' }, listView: { fieldMode: 'hidden' } } }),
    supportEmail: text(),
    supportPhone: text(),
    prescriptionFillPolicy: json({ access: { create: denyAll, update: denyAll }, ui: { description: 'Versioned operator-reviewed policy; only the controlled fill policy command may change it. Existing fills keep their snapshot.' } }),
    cashSalesEnabled: checkbox({ defaultValue: false, access: { create: denyAll, update: denyAll }, ui: { description: 'Enabled only by the operator-attested cash/tax policy workflow.' } }),
    cashTaxRateBps: integer({ defaultValue: 0, validation: { min: 0, max: 10000 }, access: { create: denyAll, update: denyAll } }),
    cashTaxPolicyReference: text({ access: { create: denyAll, update: denyAll } }),
    cashPolicyReviewedAt: timestamp({ access: { create: denyAll, update: denyAll } }),
    cashPolicyReviewedBy: relationship({ ref: 'User', access: { create: denyAll, update: denyAll } }),
    status: select({
      type: 'string',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Suspended', value: 'suspended' },
        { label: 'Archived', value: 'archived' },
      ],
      defaultValue: 'active',
    }),
    locations: relationship({ ref: 'PharmacyLocation.organization', many: true, access: immutableRelationship }),
    memberships: relationship({ ref: 'OrganizationMembership.organization', many: true, access: immutableRelationship }),
    patients: relationship({ ref: 'PatientProfile.organizations', many: true, access: immutableRelationship }),
    products: relationship({ ref: 'Product.organization', many: true, access: immutableRelationship }),
    drugReferenceReviews: relationship({ ref: 'DrugReferenceReview.organization', many: true, access: immutableRelationship }),
    prescriptions: relationship({ ref: 'Prescription.organization', many: true, access: immutableRelationship }),
    recalls: relationship({ ref: 'Recall.organization', many: true, access: immutableRelationship }),
    orders: relationship({ ref: 'Order.organization', many: true, access: immutableRelationship }),
    integrationProviders: relationship({ ref: 'IntegrationProvider.organization', many: true, access: immutableRelationship }),
    outboxEvents: relationship({ ref: 'OutboxEvent.organization', many: true, access: immutableRelationship }),
    paymentWebhookEvents: relationship({ ref: 'PaymentWebhookEvent.organization', many: true, access: immutableRelationship }),
    machineCredentials: relationship({ ref: 'MachineCredential.organization', many: true, access: immutableRelationship }),
    externalIntegrationWorkflows: relationship({ ref: 'ExternalIntegrationWorkflow.organization', many: true, access: immutableRelationship }),
    integrationWebhookEvents: relationship({ ref: 'IntegrationWebhookEvent.organization', many: true, access: immutableRelationship }),
    ...trackingFields,
  },
})
