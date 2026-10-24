import { list } from '@keystone-6/core'
import { checkbox, integer, relationship, select, text } from '@keystone-6/core/fields'

import { isSignedIn, permissions, rules } from '../access'
import { immutableRelationship } from './immutableRelationship'
import { requiredRelationshipDb } from './requiredRelationship'
import { trackingFields } from './trackingFields'

export const Product = list({
  access: {
    operation: {
      query: isSignedIn,
      create: permissions.canManageCatalog,
      update: permissions.canManageCatalog,
      delete: permissions.canManageCatalog,
    },
    filter: {
      query: ({ session }) => permissions.canManageCatalog({ session }) || permissions.canManageInventory({ session }) || permissions.canManageOrders({ session })
        ? rules.canReadTenantRecords({ session })
        : false,
      update: rules.canReadTenantRecords,
      delete: rules.canReadTenantRecords,
    },
  },
  hooks: {
    resolveInput: {
      // An empty handle is generated from the title, made unique with a numeric suffix.
      create: async ({ resolvedData, context }) => {
        if (String(resolvedData.handle || '').trim() || !resolvedData.title) return resolvedData
        const base = String(resolvedData.title).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'product'
        let handle = base
        for (let suffix = 2; await context.sudo().query.Product.count({ where: { handle: { equals: handle } } }); suffix += 1) handle = `${base}-${suffix}`
        return { ...resolvedData, handle }
      },
    },
    validate: {
      create: async ({ resolvedData, context, addValidationError }) => {
        const organizationId = resolvedData.organization?.connect?.id
        const locationId = resolvedData.location?.connect?.id
        if (!organizationId || !locationId) return addValidationError('Product requires organization and location relationships')
        const [location, membership] = await Promise.all([
          context.sudo().query.PharmacyLocation.findOne({ where: { id: locationId }, query: 'organization { id }' }),
          context.sudo().query.OrganizationMembership.findMany({ where: { user: { id: { equals: context.session?.itemId || '' } }, organization: { id: { equals: organizationId } }, status: { equals: 'active' } }, take: 1, query: 'id' }),
        ])
        if (location?.organization?.id !== organizationId) addValidationError('Product location must belong to its organization')
        if (!membership.length) addValidationError('Product organization must belong to the active operator')
        if ((resolvedData.prescriptionRequirement ?? 'none') !== 'none' && !resolvedData.drugReference?.connect?.id) {
          addValidationError('Prescription products require a drug/NDC reference')
        }
      },
      update: async ({ resolvedData, item, context, addValidationError }) => {
        if (['organization', 'location'].some((field) => resolvedData[field] !== undefined)) {
          addValidationError('Product organization and location cannot be changed')
        }
        const currentRequirement = String((item as any).prescriptionRequirement || 'none')
        const nextRequirement = String(resolvedData.prescriptionRequirement ?? currentRequirement)
        const nextDrugReferenceId = resolvedData.drugReference === undefined
          ? (item as any).drugReferenceId
          : resolvedData.drugReference?.connect?.id || null
        if (nextRequirement !== 'none' && !nextDrugReferenceId) {
          addValidationError('Prescription products require a drug/NDC reference')
        }
        const safetyFieldChanged = (currentRequirement !== 'none' && nextRequirement === 'none')
          || (resolvedData.drugReference !== undefined && nextDrugReferenceId !== (item as any).drugReferenceId)
        if (safetyFieldChanged) {
          const openItems = await context.sudo().query.PrescriptionItem.count({
            where: {
              product: { id: { equals: String(item.id) } },
              prescription: { status: { notIn: ['dispensed', 'fill_closed', 'rejected', 'cancelled'] } },
            },
          })
          if (openItems > 0) addValidationError('This product is on open prescriptions; close them before changing its prescription requirement or drug reference')
        }
        if ((item as any).coldChainRequired === true && resolvedData.coldChainRequired === false) {
          const coldLots = await context.sudo().query.InventoryLot.count({
            where: { product: { id: { equals: String(item.id) } }, coldChainRequired: { equals: true }, quantityAvailable: { gt: 0 } },
          })
          if (coldLots > 0) addValidationError('This product has cold-chain stock on hand; it must stay cold-chain while that stock remains')
        }
      },
      delete: async ({ item, context, addValidationError }) => {
        const [lotCount, orderLineCount] = await Promise.all([
          context.prisma.inventoryLot.count({ where: { productId: String(item.id) } }),
          context.prisma.orderLineItem.count({ where: { productId: String(item.id) } }),
        ])
        if (lotCount || orderLineCount) addValidationError('Referenced products must be archived instead of deleted')
      },
    },
  },
  ui: { listView: { initialColumns: ['title', 'sku', 'prescriptionRequirement', 'status', 'onlineAvailable'] } },
  fields: {
    title: text({ validation: { isRequired: true } }),
    handle: text({ isIndexed: 'unique', label: 'Handle (optional)' }),
    sku: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    description: text({ ui: { displayMode: 'textarea' } }),
    status: select({
      type: 'string',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
      defaultValue: 'draft',
    }),
    category: select({
      type: 'string',
      options: [
        { label: 'Prescription', value: 'prescription' },
        { label: 'OTC medication', value: 'otc_medication' },
        { label: 'First aid', value: 'first_aid' },
        { label: 'Wellness', value: 'wellness' },
        { label: 'Personal care', value: 'personal_care' },
        { label: 'Medical supply', value: 'medical_supply' },
        { label: 'Allergy', value: 'allergy' },
        { label: 'Cold and flu', value: 'cold_and_flu' },
        { label: 'Digestive health', value: 'digestive_health' },
        { label: 'Vitamins and supplements', value: 'vitamins' },
        { label: 'Health devices', value: 'health_devices' },
      ],
      defaultValue: 'otc_medication',
    }),
    prescriptionRequirement: select({
      type: 'string',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Prescription required', value: 'prescription_required' },
        { label: 'Pharmacist review required', value: 'pharmacist_review_required' },
      ],
      defaultValue: 'none',
    }),
    priceAmount: integer({ validation: { isRequired: true, min: 0 }, defaultValue: 0, label: 'Price (cents)' }),
    currencyCode: text({ defaultValue: 'USD', validation: { isRequired: true } }),
    taxable: checkbox({ defaultValue: true }),
    onlineAvailable: checkbox({ defaultValue: false }),
    posAvailable: checkbox({ defaultValue: true }),
    coldChainRequired: checkbox({ defaultValue: false }),
    imageUrl: text({ label: 'Image URL' }),
    organization: relationship({ ref: 'Organization.products', db: requiredRelationshipDb }),
    location: relationship({ ref: 'PharmacyLocation.products', db: requiredRelationshipDb }),
    drugReference: relationship({ ref: 'DrugReference.products' }),
    inventoryLots: relationship({ ref: 'InventoryLot.product', many: true, access: immutableRelationship }),
    cartItems: relationship({ ref: 'CartItem.product', many: true, access: immutableRelationship }),
    orderLineItems: relationship({ ref: 'OrderLineItem.product', many: true, access: immutableRelationship }),
    prescriptionItems: relationship({ ref: 'PrescriptionItem.product', many: true, access: immutableRelationship }),
    ...trackingFields,
  },
})
