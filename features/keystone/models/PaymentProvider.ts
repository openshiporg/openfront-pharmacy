import { list } from '@keystone-6/core'
import { denyAll } from '@keystone-6/core/access'
import { checkbox, json, relationship, text } from '@keystone-6/core/fields'

import { permissions, rules } from '../access'
import { requiredRelationshipDb } from './requiredRelationship'
import { trackingFields } from './trackingFields'

export const PaymentProvider = list({
  access: {
    operation: {
      query: permissions.canManagePayments,
      create: permissions.canManagePayments,
      update: permissions.canManagePayments,
      delete: permissions.canManagePayments,
    },
    filter: { query: rules.canReadOrganizationRecords, update: rules.canReadOrganizationRecords, delete: rules.canReadOrganizationRecords },
  },
  hooks: {
    resolveInput: ({ operation, resolvedData }) => {
      if (operation !== 'create') return resolvedData
      const organizationId = resolvedData.organization?.connect?.id
      return organizationId && resolvedData.code
        ? { ...resolvedData, providerKey: `${organizationId}:${resolvedData.code}` }
        : resolvedData
    },
    validateInput: async ({ operation, resolvedData, context, addValidationError }) => {
      const organizationId = resolvedData.organization?.connect?.id
      if (operation === 'create' && (!organizationId || !resolvedData.code)) {
        addValidationError('Payment provider requires organization and code identity')
      }
      if (operation === 'create' && organizationId) {
        const membership = await context.sudo().query.OrganizationMembership.findMany({ where: { user: { id: { equals: context.session?.itemId || '' } }, organization: { id: { equals: organizationId } }, status: { equals: 'active' } }, take: 1, query: 'id' })
        if (!membership.length) addValidationError('Payment provider organization must belong to the active operator')
      }
      if (operation === 'update' && ['organization', 'code', 'providerKey'].some((field) => resolvedData[field] !== undefined)) {
        addValidationError('Payment provider organization and code cannot be changed')
      }
    },
    validateDelete: async ({ item, context, addValidationError }) => {
      const [sessions, payments] = await Promise.all([
        context.prisma.paymentSession.count({ where: { providerId: String(item.id) } }),
        context.prisma.payment.count({ where: { providerId: String(item.id) } }),
      ])
      if (sessions || payments) addValidationError('Payment providers with payment history cannot be deleted; uninstall them instead')
    },
  },
  fields: {
    providerKey: text({ isIndexed: 'unique', access: { update: denyAll } }),
    name: text({ validation: { isRequired: true } }),
    code: text({
      isIndexed: true,
      validation: {
        isRequired: true,
        match: {
          regex: /^pp_[a-zA-Z0-9-_]+$/,
          explanation: 'Payment provider code must start with "pp_" followed by alphanumeric characters, hyphens or underscores',
        },
      },
    }),
    isInstalled: checkbox({ defaultValue: false }),
    credentials: json({ access: { read: denyAll } }),
    metadata: json(),
    createPaymentFunction: text({ validation: { isRequired: true } }),
    capturePaymentFunction: text({ validation: { isRequired: true } }),
    refundPaymentFunction: text({ validation: { isRequired: true } }),
    getPaymentStatusFunction: text({ validation: { isRequired: true } }),
    generatePaymentLinkFunction: text({ validation: { isRequired: true } }),
    handleWebhookFunction: text({ validation: { isRequired: true } }),
    organization: relationship({ ref: 'Organization', db: requiredRelationshipDb }),
    integrationProvider: relationship({ ref: 'IntegrationProvider.paymentProviders' }),
    paymentSessions: relationship({ ref: 'PaymentSession.provider', many: true }),
    payments: relationship({ ref: 'Payment.provider', many: true }),
    webhookEvents: relationship({ ref: 'PaymentWebhookEvent.provider', many: true }),
    ...trackingFields,
  },
})
