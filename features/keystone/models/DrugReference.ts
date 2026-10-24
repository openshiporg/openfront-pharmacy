import { list } from '@keystone-6/core'
import { denyAll } from '@keystone-6/core/access'
import { checkbox, json, relationship, select, text, timestamp } from '@keystone-6/core/fields'

import { permissions } from '../access'
import { trackingFields } from './trackingFields'

// Set only by a drug reference review; read-only in the admin forms.
const REVIEW_ONLY = { createView: { fieldMode: 'hidden' as const }, itemView: { fieldMode: 'read' as const } }

export const DrugReference = list({
  access: {
    operation: {
      query: () => true,
      create: permissions.canManageCatalog,
      update: permissions.canManageCatalog,
      delete: denyAll,
    },
  },
  hooks: {
    validateInput: async ({ operation, resolvedData, item, context, addValidationError }) => {
      const value = (field: string) => resolvedData[field] !== undefined ? resolvedData[field] : (item as any)?.[field]
      for (const [field, label] of [['genericName', 'Generic name'], ['strength', 'Strength'], ['dosageForm', 'Dosage form']] as const) {
        if (!String(value(field) || '').trim()) addValidationError(`${label} is required`)
      }
      // Reviewed reference data is evidence for existing reviews; identity fields cannot change after review.
      if (operation === 'update' && item && ['ndc11', 'genericName', 'strength', 'dosageForm', 'route'].some((field) => resolvedData[field] !== undefined)) {
        const reviews = await context.sudo().query.DrugReferenceReview.count({ where: { drugReference: { id: { equals: String(item.id) } } } })
        if (reviews > 0) addValidationError('Reviewed drug references cannot change NDC, ingredient, strength, dosage form or route')
      }
    },
  },
  graphql: { omit: { delete: true } },
  ui: { hideDelete: true, listView: { initialColumns: ['proprietaryName', 'genericName', 'ndc11', 'marketingStatus'] } },
  fields: {
    ndc11: text({
      isIndexed: 'unique',
      validation: {
        isRequired: true,
        match: { regex: /^\d{11}$/, explanation: 'NDC must be normalized to exactly 11 digits' },
      },
    }),
    proprietaryName: text({ validation: { isRequired: true } }),
    genericName: text(),
    labelerName: text(),
    dosageForm: text(),
    route: text(),
    strength: text(),
    rxNormCui: text(),
    controlledSchedule: select({
      access: { create: denyAll, update: denyAll },
      ui: REVIEW_ONLY,
      type: 'string',
      options: [
        { label: 'Not scheduled', value: 'none' },
        { label: 'Schedule I', value: 'schedule_i' },
        { label: 'Schedule II', value: 'schedule_ii' },
        { label: 'Schedule III', value: 'schedule_iii' },
        { label: 'Schedule IV', value: 'schedule_iv' },
        { label: 'Schedule V', value: 'schedule_v' },
        { label: 'Unverified', value: 'unverified' },
      ],
      defaultValue: 'unverified',
    }),
    marketingStatus: select({
      access: { create: denyAll, update: denyAll },
      ui: REVIEW_ONLY,
      type: 'string',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Unverified', value: 'unverified' },
      ],
      defaultValue: 'unverified',
    }),
    sourceName: text({ defaultValue: 'manual', access: { create: denyAll, update: denyAll },
      ui: REVIEW_ONLY }),
    sourceVersion: text({ access: { create: denyAll, update: denyAll },
      ui: REVIEW_ONLY }),
    sourceReference: text({ access: { create: denyAll, update: denyAll },
      ui: REVIEW_ONLY }),
    sourceVerified: checkbox({
      defaultValue: false,
      access: { create: denyAll, update: denyAll },
      ui: REVIEW_ONLY,
    }),
    reviewedAt: timestamp({ access: { create: denyAll, update: denyAll },
      ui: REVIEW_ONLY }),
    reviewedBy: relationship({ ref: 'User', access: { create: denyAll, update: denyAll },
      ui: REVIEW_ONLY }),
    referenceData: json(),
    products: relationship({ ref: 'Product.drugReference', many: true }),
    reviews: relationship({ ref: 'DrugReferenceReview.drugReference', many: true }),
    prescriptionItems: relationship({ ref: 'PrescriptionItem.drugReference', many: true }),
    ...trackingFields,
  },
})
