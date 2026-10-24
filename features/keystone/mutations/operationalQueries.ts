import { createHash } from 'node:crypto'
import type { Context } from '.keystone/types'
import { permissions } from '../access'
import { prescriptionItemVersion } from '../workflows/fill-entitlement'
import { currentFillNumber, isHumanSafetyReviewStale } from '../workflows/clinical-safety'
import { eligibleLotQuantity, isLotEligible } from '../workflows/lot-eligibility'
import { assessRecallExposureReconciliation, recallExposureMovementWhere } from '../workflows/recall-exposure'
import type { PharmacyCatalogQueueProjection } from '../../pharmacy/contracts'
import { DomainError } from './lib/errors'
import { isValidNpi } from '../workflows/prescription-eligibility'
import { patientAccountWhere } from './lib/patient-accounts'

type StableCursor = { createdAt: string; id: string }

export function decodeStableCursor(cursor?: string | null, expectedScope?: string): StableCursor | null {
  if (!cursor) return null
  if (cursor.length > 2048) throw new DomainError('Worklist cursor is invalid')
  try {
    const value = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'))
    if (typeof value?.createdAt !== 'string' || Number.isNaN(new Date(value.createdAt).getTime()) || typeof value?.id !== 'string' || !value.id || value.id.length > 256) throw new DomainError()
    if (expectedScope !== undefined && value.scope !== expectedScope) throw new DomainError()
    return { createdAt: new Date(value.createdAt).toISOString(), id: value.id }
  } catch {
    throw new DomainError('Worklist cursor is invalid')
  }
}

export function stableCursorWhere(where: Record<string, any>, cursor: StableCursor | null, timestampField = 'createdAt', direction: 'asc' | 'desc' = 'desc') {
  if (!cursor) return where
  const operator = direction === 'asc' ? 'gt' : 'lt'
  return { AND: [where, { OR: [
    { [timestampField]: { [operator]: cursor.createdAt } },
    { AND: [{ [timestampField]: { equals: cursor.createdAt } }, { id: { [operator]: cursor.id } }] },
  ] }] }
}

export function encodeStableCursor(record: { createdAt: string; id: string }, scope?: string) {
  return Buffer.from(JSON.stringify({ createdAt: new Date(record.createdAt).toISOString(), id: record.id, ...(scope ? { scope } : {}) })).toString('base64url')
}

export function boundedPageSize(value?: number | null) {
  if (value == null) return 50
  if (!Number.isInteger(value) || value < 1) throw new DomainError('Worklist page size must be a positive integer')
  return Math.min(value, 100)
}

function requireAny(context: Context, allowed: Array<keyof typeof permissions>) {
  if (!context.session?.itemId) throw new DomainError('Authentication required')
  if (!allowed.some((permission) => permissions[permission]({ session: context.session as any }))) {
    throw new DomainError('You do not have permission to read this pharmacy projection')
  }
}

function requirePatientPrivateData(context: Context) {
  if (!permissions.canViewPatientPrivateData({ session: context.session as any })) {
    throw new DomainError('Patient private-data permission is required for this projection')
  }
}

const fulfillmentTransitions: Record<string, string[]> = {
  pending: ['preparing'],
  preparing: ['ready'],
  ready: ['handed_off'],
}

function prescriptionActions(status: string) {
  if (['pending_review', 'needs_information'].includes(status)) return ['clinical_safety_review', 'review']
  if (status === 'approved') return ['clinical_safety_review', 'authorize_dispensing']
  if (['ready_to_dispense', 'partially_dispensed'].includes(status)) return ['record_dispensing']
  return []
}

async function tenantScope(context: Context) {
  if (!context.session?.itemId) throw new DomainError('Authentication required')
  const memberships = await context.sudo().query.OrganizationMembership.findMany({
    where: {
      user: { id: { equals: context.session.itemId } },
      status: { equals: 'active' },
      organization: { status: { equals: 'active' } },
    },
    query: 'organization { id name locations(where: { status: { equals: "active" } }) { id name status } } location { id name status }',
  })
  const activeMemberships = memberships.filter((membership: any) => !membership.location || membership.location.status === 'active')
  return {
    organizationIds: [...new Set(activeMemberships.map((membership: any) => membership.organization?.id).filter(Boolean))] as string[],
    organizationWideIds: [...new Set(activeMemberships.filter((membership: any) => !membership.location).map((membership: any) => membership.organization?.id).filter(Boolean))] as string[],
    locationIds: [...new Set(activeMemberships.flatMap((membership: any) => membership.location?.id
      ? [membership.location.id]
      : membership.organization?.locations?.map((location: any) => location.id) || []))] as string[],
  }
}

export function tenantEventFilter(scope: { organizationIds: string[]; organizationWideIds: string[]; locationIds: string[] }) {
  return {
    organization: { id: { in: scope.organizationIds } },
    OR: [
      { AND: [{ organization: { id: { in: scope.organizationWideIds } } }, { location: null }] },
      { location: { id: { in: scope.locationIds } } },
    ],
  }
}

async function validatedPharmacistScope(context: Context) {
  if (!context.session?.itemId) return { organizationIds: [] as string[], locationIds: [] as string[] }
  const memberships = await context.sudo().query.OrganizationMembership.findMany({
    where: {
      user: { id: { equals: context.session.itemId } },
      status: { equals: 'active' },
      membershipRole: { in: ['owner', 'pharmacist'] },
      externalCredentialValidated: { equals: true },
      credentialVerificationMethod: { in: ['organization_recorded', 'external_provider'] },
      credentialExpiresAt: { gt: new Date().toISOString() },
      credentialValidationReference: { not: { equals: '' } },
    },
    query: 'organization { id status locations(where: { status: { equals: "active" } }) { id status } } location { id status } credentialType credentialJurisdiction credentialIdentifier',
  })
  const eligible = memberships.filter((entry: any) => entry.organization?.status === 'active' && (!entry.location || entry.location.status === 'active') && entry.credentialType?.trim() && entry.credentialJurisdiction?.trim() && entry.credentialIdentifier?.trim())
  return {
    organizationIds: [...new Set(eligible.map((entry: any) => entry.organization?.id).filter(Boolean))] as string[],
    locationIds: [...new Set(eligible.flatMap((entry: any) => entry.location?.id ? [entry.location.id] : entry.organization?.locations?.map((location: any) => location.id) || []))] as string[],
  }
}

export async function pharmacyCatalogQueue(_root: unknown, _args: unknown, context: Context) {
  requireAny(context, ['canManageCatalog', 'canManageInventory'])
  const scope = await tenantScope(context)
  const records = await context.sudo().query.Product.findMany({
    where: { organization: { id: { in: scope.organizationIds } }, location: { id: { in: scope.locationIds } } },
    orderBy: { title: 'asc' },
    take: 200,
    query: 'id title handle sku status category prescriptionRequirement priceAmount currencyCode onlineAvailable posAvailable coldChainRequired location { id name }',
  })
  return records.map((record: any): PharmacyCatalogQueueProjection => ({
    id: record.id,
    title: record.title,
    handle: record.handle,
    sku: record.sku,
    status: record.status,
    category: record.category,
    prescriptionRequirement: record.prescriptionRequirement,
    priceAmount: record.priceAmount,
    currencyCode: record.currencyCode,
    onlineAvailable: record.onlineAvailable,
    posAvailable: record.posAvailable,
    coldChainRequired: record.coldChainRequired,
    locationId: record.location?.id,
    locationName: record.location?.name || 'Unassigned',
    availableQuantity: null,
    quarantinedQuantity: null,
    inventorySummaryStatus: 'not_verified',
  }))
}

export async function pharmacyPrescriptionIntakeOptions(_root: unknown, _args: unknown, context: Context) {
  requireAny(context, ['canManagePrescriptions'])
  requirePatientPrivateData(context)
  const scope = await validatedPharmacistScope(context)
  if (!scope.organizationIds.length) throw new DomainError('Current organization-recorded pharmacist credential review evidence is required for intake')
  const sudo = context.sudo()
  const [organizations, locations, patients, prescribers, products] = await Promise.all([
    sudo.query.Organization.findMany({ where: { id: { in: scope.organizationIds } }, orderBy: { name: 'asc' }, query: 'id name' }),
    sudo.query.PharmacyLocation.findMany({ where: { id: { in: scope.locationIds } }, orderBy: { name: 'asc' }, query: 'id name organization { id }' }),
    sudo.query.PatientProfile.findMany({ where: { organizations: { some: { id: { in: scope.organizationIds } } }, status: { equals: 'active' } }, orderBy: { createdAt: 'desc' }, take: 200, query: 'id displayName patientNumber organizations { id }' }),
    sudo.query.Prescriber.findMany({ where: { organization: { id: { in: scope.organizationIds } } }, orderBy: { name: 'asc' }, take: 200, query: 'id name verificationStatus organization { id }' }),
    sudo.query.Product.findMany({ where: { organization: { id: { in: scope.organizationIds } }, location: { id: { in: scope.locationIds } }, status: { equals: 'published' }, prescriptionRequirement: { in: ['prescription_required', 'pharmacist_review_required'] } }, orderBy: { title: 'asc' }, take: 200, query: 'id title sku organization { id } location { id }' }),
  ])
  return {
    organizations: organizations.map((entry: any) => ({ id: entry.id, label: entry.name, scopeId: entry.id, detail: null })),
    locations: locations.map((entry: any) => ({ id: entry.id, label: entry.name, scopeId: entry.organization?.id, detail: null })),
    patients: patients.flatMap((entry: any) => (entry.organizations || [])
      .filter((organization: any) => scope.organizationIds.includes(organization.id))
      .map((organization: any) => ({ id: entry.id, label: entry.displayName, scopeId: organization.id, detail: entry.patientNumber }))),
    prescribers: prescribers.map((entry: any) => ({ id: entry.id, label: entry.name, scopeId: entry.organization?.id || '', detail: entry.verificationStatus })),
    products: products.map((entry: any) => ({ id: entry.id, label: entry.title, scopeId: entry.location?.id || '', detail: entry.sku })),
  }
}

export async function pharmacyPatientRecordOptions(_root: unknown, _args: unknown, context: Context) {
  requireAny(context, ['canManagePatients'])
  requirePatientPrivateData(context)
  const scope = await tenantScope(context)
  const organizations = await context.sudo().query.Organization.findMany({ where: { id: { in: scope.organizationIds }, status: { equals: 'active' } }, orderBy: { name: 'asc' }, take: 100, query: 'id name' })
  return { organizations: organizations.map((entry: any) => ({ id: entry.id, label: entry.name, scopeId: entry.id, detail: null })) }
}

export async function pharmacyCredentialReviewOptions(_root: unknown, _args: unknown, context: Context) {
  requireAny(context, ['canManageUsers', 'canReviewPrescriptions'])
  const scope = await tenantScope(context)
  const sudo = context.sudo()
  const [memberships, prescribers, products, organizations, catalog, stockedPrescriptionLots] = await Promise.all([
    sudo.query.OrganizationMembership.findMany({
      where: { organization: { id: { in: scope.organizationIds } }, status: { equals: 'active' }, membershipRole: { in: ['owner', 'pharmacist'] } },
      orderBy: { createdAt: 'asc' },
      take: 100,
      query: 'id membershipRole credentialExpiresAt user { name } organization { id name } location { name }',
    }),
    sudo.query.Prescriber.findMany({ where: { organization: { id: { in: scope.organizationIds } } }, orderBy: { name: 'asc' }, take: 200, query: 'id name npi credentialExpiresAt organization { id }' }),
    sudo.query.Product.findMany({ where: { organization: { id: { in: scope.organizationIds } } }, orderBy: { title: 'asc' }, take: 300, query: 'id title sku organization { id } drugReference { id ndc11 proprietaryName reviews { id status organization { id } reviewedAt } }' }),
    sudo.query.Organization.findMany({ where: { id: { in: scope.organizationIds } }, orderBy: { name: 'asc' }, take: 100, query: 'id name cashSalesEnabled cashTaxRateBps cashTaxPolicyReference' }),
    // The drug reference catalog is shared; each pharmacy reviews an entry before stocking or dispensing it.
    sudo.query.DrugReference.findMany({ orderBy: { proprietaryName: 'asc' }, take: 200, query: 'id ndc11 proprietaryName reviews { id status organization { id } reviewedAt }' }),
    sudo.query.InventoryLot.count({ where: { status: { equals: 'available' }, quantityAvailable: { gt: 0 }, product: { organization: { id: { in: scope.organizationIds } }, prescriptionRequirement: { not: { equals: 'none' } } } } }),
  ])
  const drugReferences = new Map<string, any>()
  for (const product of products) {
    if (!product.drugReference?.id || drugReferences.has(`${product.organization?.id}:${product.drugReference.id}`)) continue
    const currentReview = product.drugReference.reviews?.find((review: any) => review.organization?.id === product.organization?.id && review.status === 'active')
    drugReferences.set(`${product.organization?.id}:${product.drugReference.id}`, { id: product.drugReference.id, label: product.drugReference.proprietaryName || product.title, scopeId: product.organization?.id, detail: `${product.drugReference.ndc11 || 'NDC missing'} · ${currentReview ? `reviewed ${new Date(currentReview.reviewedAt).toISOString().slice(0, 10)}` : 'review required'}` })
  }
  for (const organization of organizations) {
    for (const reference of catalog) {
      if (drugReferences.has(`${organization.id}:${reference.id}`)) continue
      const currentReview = reference.reviews?.find((review: any) => review.organization?.id === organization.id && review.status === 'active')
      drugReferences.set(`${organization.id}:${reference.id}`, { id: reference.id, label: reference.proprietaryName, scopeId: organization.id, detail: `${reference.ndc11 || 'NDC missing'} · ${currentReview ? `reviewed ${new Date(currentReview.reviewedAt).toISOString().slice(0, 10)}` : 'review required'}` })
    }
  }
  const now = Date.now()
  const current = (value?: string | null) => Boolean(value && new Date(value).getTime() > now)
  const reviewedReferenceIds = new Set(catalog.filter((reference: any) => reference.reviews?.some((review: any) => review.status === 'active' && scope.organizationIds.includes(review.organization?.id))).map((reference: any) => reference.id))
  return {
    organizationWideOrganizationIds: scope.organizationWideIds,
    setup: {
      pharmacistReviewed: memberships.some((entry: any) => current(entry.credentialExpiresAt)),
      prescriberHasNpi: prescribers.some((entry: any) => isValidNpi(entry.npi)),
      prescriberReady: prescribers.some((entry: any) => isValidNpi(entry.npi) && current(entry.credentialExpiresAt)),
      drugReferenceReviewed: reviewedReferenceIds.size > 0 || products.some((product: any) => product.drugReference?.reviews?.some((review: any) => review.status === 'active' && review.organization?.id === product.organization?.id)),
      cashPolicyRecorded: organizations.some((entry: any) => entry.cashSalesEnabled),
      prescriptionProductStocked: stockedPrescriptionLots > 0,
    },
    organizations: organizations.map((entry: any) => ({ id: entry.id, label: entry.name, scopeId: entry.id, detail: entry.cashSalesEnabled ? `Cash enabled · ${(entry.cashTaxRateBps / 100).toFixed(2)}% · ${entry.cashTaxPolicyReference}` : 'Cash/tax policy review required' })),
    memberships: memberships.map((entry: any) => ({ id: entry.id, label: `${entry.user?.name || 'Staff member'} · ${entry.membershipRole}`, scopeId: entry.organization?.id, detail: entry.credentialExpiresAt ? `Review expires ${new Date(entry.credentialExpiresAt).toISOString().slice(0, 10)}` : entry.location?.name || entry.organization?.name })),
    prescribers: prescribers.map((entry: any) => ({ id: entry.id, label: entry.name, scopeId: entry.organization?.id, detail: `${entry.npi ? `NPI ${entry.npi}` : 'NPI missing'}${entry.credentialExpiresAt ? ` · review expires ${new Date(entry.credentialExpiresAt).toISOString().slice(0, 10)}` : ''}` })),
    drugReferences: [...drugReferences.values()],
  }
}

export async function pharmacyInventoryReceiptOptions(_root: unknown, _args: unknown, context: Context) {
  requireAny(context, ['canManageInventory'])
  const scope = await tenantScope(context)
  const sudo = context.sudo()
  const [locations, suppliers] = await Promise.all([
    sudo.query.PharmacyLocation.findMany({ where: { id: { in: scope.locationIds } }, orderBy: { name: 'asc' }, query: 'id name organization { id }' }),
    sudo.query.Supplier.findMany({ where: { organization: { id: { in: scope.organizationIds } } }, orderBy: { name: 'asc' }, take: 200, query: 'id name organization { id }' }),
  ])
  return {
    locations: locations.map((entry: any) => ({ id: entry.id, label: entry.name, scopeId: entry.organization?.id || '', detail: null })),
    suppliers: suppliers.map((entry: any) => ({ id: entry.id, label: entry.name, scopeId: entry.organization?.id || '', detail: null })),
  }
}

const receiptProductStatuses = new Set(['draft', 'published'])

export function inventoryReceiptProductQueueFilter(
  scope: { organizationIds: string[]; locationIds: string[] },
  filters: { locationId?: string | null; status?: string | null },
) {
  const organizationIds = [...new Set(scope.organizationIds)].sort()
  const authorizedLocationIds = [...new Set(scope.locationIds)].sort()
  const locationId = filters.locationId
  if (typeof locationId !== 'string' || !locationId.trim() || !authorizedLocationIds.includes(locationId)) {
    throw new DomainError('You do not have access to this location')
  }
  const status = filters.status ?? null
  if (status !== null && (typeof status !== 'string' || !receiptProductStatuses.has(status))) {
    throw new DomainError('Product selector status filter is invalid')
  }
  const where: Record<string, any> = {
    organization: { id: { in: organizationIds } },
    location: { id: { equals: locationId } },
    status: status ? { equals: status } : { in: ['draft', 'published'] },
  }
  const cursorScope = createHash('sha256').update(JSON.stringify({
    worklist: 'inventory-receipt-products', organizationIds, authorizedLocationIds, locationId, status,
  })).digest('base64url')
  return { where, cursorScope }
}

export async function pharmacyInventoryReceiptProductWorklist(
  _root: unknown,
  args: { locationId: string; first?: number | null; after?: string | null; status?: string | null },
  context: Context,
) {
  requireAny(context, ['canManageInventory'])
  const pageSize = boundedPageSize(args.first)
  const scope = await tenantScope(context)
  const { where: baseWhere, cursorScope } = inventoryReceiptProductQueueFilter(scope, args)
  const cursor = decodeStableCursor(args.after, cursorScope)
  const [totalCount, products] = await Promise.all([
    context.sudo().query.Product.count({ where: baseWhere }),
    context.sudo().query.Product.findMany({
      where: stableCursorWhere(baseWhere, cursor),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: pageSize + 1,
      query: 'id title sku createdAt',
    }),
  ])
  const hasMore = products.length > pageSize
  const pageProducts = products.slice(0, pageSize)
  return {
    items: pageProducts.map((product: any) => ({ id: product.id, label: product.title, scopeId: args.locationId, detail: product.sku })),
    totalCount,
    hasMore,
    nextCursor: hasMore && pageProducts.length
      ? encodeStableCursor({ createdAt: pageProducts[pageProducts.length - 1].createdAt, id: pageProducts[pageProducts.length - 1].id }, cursorScope)
      : null,
  }
}

export async function pharmacyPrescriberDirectory(_root: unknown, _args: unknown, context: Context) {
  requireAny(context, ['canManagePrescriptions', 'canReviewPrescriptions'])
  const scope = await tenantScope(context)
  const records = await context.sudo().query.Prescriber.findMany({
    where: { organization: { id: { in: scope.organizationIds } } },
    orderBy: { name: 'asc' },
    take: 200,
    query: 'id name npi phone fax verificationStatus externalValidationComplete organization { name } prescriptions { id }',
  })
  return records.map((record: any) => ({
    id: record.id,
    name: record.name,
    npi: record.npi,
    phone: record.phone,
    fax: record.fax,
    verificationStatus: record.verificationStatus,
    externalValidationComplete: record.externalValidationComplete,
    organizationName: record.organization?.name || 'Unassigned',
    prescriptionCount: record.prescriptions?.length || 0,
  }))
}

export async function pharmacyPrescriptionQueue(_root: unknown, _args: unknown, context: Context) {
  requireAny(context, ['canManagePrescriptions', 'canReviewPrescriptions', 'canDispenseMedications'])
  requirePatientPrivateData(context)
  const scope = await tenantScope(context)
  const records = await context.sudo().query.Prescription.findMany({
    where: { organization: { id: { in: scope.organizationIds } }, location: { id: { in: scope.locationIds } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
    query: 'id prescriptionNumber status source sourceVerificationStatus createdAt writtenAt patient { displayName } prescriber { name verificationStatus } location { name } items(take: 1) { medicationNameSnapshot quantityPrescribed refillsRemaining }',
  })
  return records.map((record: any) => ({
    id: record.id,
    prescriptionNumber: record.prescriptionNumber,
    status: record.status,
    source: record.source,
    sourceVerificationStatus: record.sourceVerificationStatus,
    createdAt: record.createdAt,
    writtenAt: record.writtenAt,
    patientDisplayName: record.patient?.displayName || 'Private patient',
    prescriberName: record.prescriber?.name || 'Unassigned',
    prescriberVerificationStatus: record.prescriber?.verificationStatus || 'unverified',
    locationName: record.location?.name || 'Unassigned',
    medicationName: record.items?.[0]?.medicationNameSnapshot || null,
    quantityPrescribed: record.items?.[0]?.quantityPrescribed ?? null,
    refillsRemaining: record.items?.[0]?.refillsRemaining ?? null,
  }))
}

export async function pharmacyPrescriptionWorklist(_root: unknown, args: { first?: number | null; after?: string | null }, context: Context) {
  requireAny(context, ['canManagePrescriptions', 'canReviewPrescriptions', 'canDispenseMedications'])
  requirePatientPrivateData(context)
  const pharmacistScope = await validatedPharmacistScope(context)
  const pageSize = boundedPageSize(args.first)
  const cursor = decodeStableCursor(args.after)
  const baseWhere = {
    organization: { id: { in: pharmacistScope.organizationIds } },
    location: { id: { in: pharmacistScope.locationIds } },
    OR: [
      { status: { in: ['draft', 'pending_review', 'needs_information', 'approved', 'ready_to_dispense', 'partially_dispensed'] } },
      { refillRequests: { some: { status: { in: ['requested', 'under_review', 'prescriber_contacted'] } } } },
      { transfers: { some: { status: { in: ['requested', 'consent_recorded', 'under_review'] } } } },
    ],
  }
  const [totalCount, records] = await Promise.all([
    context.sudo().query.Prescription.count({ where: baseWhere }),
    context.sudo().query.Prescription.findMany({
      where: stableCursorWhere(baseWhere, cursor),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: pageSize + 1,
      query: 'id prescriptionNumber status source sourceVerificationStatus createdAt writtenAt patient { displayName } prescriber { name verificationStatus } location { name } items(take: 1) { medicationNameSnapshot quantityPrescribed refillsRemaining } refillRequests(where: { status: { in: ["requested", "under_review", "prescriber_contacted"] } }, take: 50) { id } transfers(where: { status: { in: ["requested", "consent_recorded", "under_review"] } }, take: 50) { id }',
    }),
  ])
  const hasMore = records.length > pageSize
  const pageRecords = records.slice(0, pageSize)
  const items = pageRecords.map((record: any) => ({
    id: record.id,
    prescriptionNumber: record.prescriptionNumber,
    status: record.status,
    source: record.source,
    sourceVerificationStatus: record.sourceVerificationStatus,
    createdAt: record.createdAt,
    writtenAt: record.writtenAt,
    patientDisplayName: record.patient?.displayName || 'Private patient',
    prescriberName: record.prescriber?.name || 'Unassigned',
    prescriberVerificationStatus: record.prescriber?.verificationStatus || 'unverified',
    locationName: record.location?.name || 'Unassigned',
    medicationName: record.items?.[0]?.medicationNameSnapshot || null,
    quantityPrescribed: record.items?.[0]?.quantityPrescribed ?? null,
    refillsRemaining: record.items?.[0]?.refillsRemaining ?? null,
    openRefillCount: record.refillRequests?.length || 0,
    openTransferCount: record.transfers?.length || 0,
  }))
  return { items, totalCount, hasMore, nextCursor: hasMore && pageRecords.length ? encodeStableCursor({ createdAt: pageRecords[pageRecords.length - 1].createdAt, id: pageRecords[pageRecords.length - 1].id }) : null }
}

export async function pharmacyPrescriptionTask(_root: unknown, args: { prescriptionId: string }, context: Context) {
  requireAny(context, ['canReviewPrescriptions', 'canDispenseMedications'])
  requirePatientPrivateData(context)
  const scope = await tenantScope(context)
  const pharmacistScope = await validatedPharmacistScope(context)
  const prescription = await context.sudo().query.Prescription.findOne({
    where: { id: args.prescriptionId },
    query: `
      id prescriptionNumber status source sourceVerificationStatus writtenAt expiresAt
      organization { id operatorDisplayName supportPhone cashSalesEnabled cashTaxRateBps cashTaxPolicyReference } location { id name }
      patient { id displayName identityVerificationStatus identityReference identityVerifiedAt allergies(where: { status: { in: ["active", "none_known"] } }) { id allergen reaction severity updatedAt } medications(where: { status: { in: ["current", "none_known"] } }) { id medicationName directions updatedAt } } prescriber { id name verificationStatus }
      approval { id approvedAt }
      items {
        id fillLineage activeFillNumber medicationNameSnapshot sig quantityPrescribed daysSupply refillsAuthorized refillsRemaining substitutionAllowed drugReference { id }
        product {
          id title sku priceAmount currencyCode taxable
          inventoryLots(orderBy: { expirationDate: asc }) {
            id lotNumber status expirationDate quantityAvailable quantityQuarantined coldChainRequired coldChainEvidenceComplete
            recalls { status }
            location { id }
          }
        }
      }
      reviews(orderBy: { reviewedAt: desc }) { id decision reason reviewedAt pharmacist { name } }
      safetyReviews(orderBy: { reviewedAt: desc }, take: 10) { id fillNumber outcome reviewReference notes overrideReason reviewedAt pharmacist { name } }
      dispensingLabels(orderBy: { dispensedAt: desc }, take: 10) { id labelNumber fillNumber operatorNameSnapshot operatorPhoneSnapshot locationNameSnapshot locationAddressSnapshot patientNameSnapshot prescriberNameSnapshot medicationNameSnapshot sigSnapshot quantityDispensed lotNumberSnapshot ndc11Snapshot expirationDateSnapshot auxiliaryWarnings counselingOutcome dispensedAt }
      refillRequests(orderBy: { requestedAt: desc }, take: 50) { id status requestNote resolutionNote requestedAt resolvedAt prescriptionItem { id medicationNameSnapshot } }
      transfers(orderBy: { requestedAt: desc }, take: 50) { id direction status counterpartyName counterpartyPhone requestedAt completedAt consent { id accepted } }
    `,
  })
  if (!prescription || !scope.organizationIds.includes(prescription.organization?.id) || !scope.locationIds.includes(prescription.location?.id) || !pharmacistScope.locationIds.includes(prescription.location?.id)) {
    throw new DomainError('Prescription not found')
  }
  const now = Date.now()
  const fillNumbers = prescription.items.map((item: any) => currentFillNumber(item))
  const fillNumber = fillNumbers.length ? Math.max(...fillNumbers) : 0
  const drugReferenceIds = [...new Set(prescription.items.map((item: any) => item.drugReference?.id).filter(Boolean))] as string[]
  const drugReviews = await context.sudo().query.DrugReferenceReview.findMany({
    where: { organization: { id: { equals: prescription.organization.id } }, drugReference: { id: { in: drugReferenceIds } }, status: { equals: 'active' } },
    take: 100,
    query: 'id reviewedAt',
  })
  const evidenceChanges = [prescription.patient?.identityVerifiedAt, ...(prescription.patient?.allergies || []).map((entry: any) => entry.updatedAt), ...(prescription.patient?.medications || []).map((entry: any) => entry.updatedAt), ...drugReviews.map((entry: any) => entry.reviewedAt)].filter(Boolean)
  const latestEvidenceChange = evidenceChanges.sort((a: string, b: string) => new Date(a).getTime() - new Date(b).getTime()).at(-1)
  const latestSafetyReview = prescription.safetyReviews?.[0]
  const safetyReviewStale = isHumanSafetyReviewStale(latestSafetyReview, fillNumber, latestEvidenceChange)
  const availableActions = prescriptionActions(prescription.status)
  if (['ready_to_dispense', 'partially_dispensed'].includes(prescription.status) && safetyReviewStale) availableActions.push('hold_for_clinical_review')
  return {
    id: prescription.id,
    prescriptionNumber: prescription.prescriptionNumber,
    status: prescription.status,
    source: prescription.source,
    sourceVerificationStatus: prescription.sourceVerificationStatus,
    writtenAt: prescription.writtenAt,
    expiresAt: prescription.expiresAt,
    patientId: prescription.patient?.id,
    patientDisplayName: prescription.patient?.displayName || 'Private patient',
    patientIdentityVerificationStatus: prescription.patient?.identityVerificationStatus || 'unverified',
    patientIdentityEvidenceRecorded: Boolean(prescription.patient?.identityReference && prescription.patient?.identityVerifiedAt),
    prescriberId: prescription.prescriber?.id,
    prescriberName: prescription.prescriber?.name || 'Unassigned',
    prescriberVerificationStatus: prescription.prescriber?.verificationStatus || 'unverified',
    locationId: prescription.location.id,
    locationName: prescription.location.name,
    operatorDisplayName: prescription.organization.operatorDisplayName,
    operatorPhone: prescription.organization.supportPhone || null,
    cashSalesEnabled: prescription.organization.cashSalesEnabled === true && Boolean(prescription.organization.cashTaxPolicyReference),
    cashTaxRateBps: prescription.organization.cashTaxRateBps || 0,
    approvalRecorded: Boolean(prescription.approval?.id),
    approvedAt: prescription.approval?.approvedAt || null,
    availableActions: pharmacistScope.locationIds.includes(prescription.location.id)
      ? availableActions.filter((action) => ['review', 'clinical_safety_review', 'hold_for_clinical_review'].includes(action)
        ? permissions.canReviewPrescriptions({ session: context.session as any })
        : permissions.canDispenseMedications({ session: context.session as any }))
      : [],
    items: (prescription.items || []).map((item: any) => ({
      id: item.id,
      fillLineage: item.fillLineage || null,
      medicationName: item.medicationNameSnapshot,
      sig: item.sig,
      quantityPrescribed: item.quantityPrescribed,
      daysSupply: item.daysSupply,
      refillsAuthorized: item.refillsAuthorized,
      refillsRemaining: item.refillsRemaining,
      substitutionAllowed: item.substitutionAllowed,
      productId: item.product?.id,
      productTitle: item.product?.title || item.medicationNameSnapshot,
      productSku: item.product?.sku || '',
      priceAmount: item.product?.priceAmount || 0,
      currencyCode: item.product?.currencyCode || 'USD',
      taxable: item.product?.taxable !== false,
      eligibleLots: (item.product?.inventoryLots || [])
        .filter((lot: any) => lot.location?.id === prescription.location.id && isLotEligible(lot, now))
        .map((lot: any) => ({
          id: lot.id,
          lotNumber: lot.lotNumber,
          expirationDate: lot.expirationDate,
          eligibleQuantity: eligibleLotQuantity(lot, now),
          coldChainRequired: lot.coldChainRequired,
        })),
    })),
    patientAllergies: (prescription.patient?.allergies || []).map((entry: any) => ({ id: entry.id, allergen: entry.allergen, reaction: entry.reaction, severity: entry.severity })),
    patientMedications: (prescription.patient?.medications || []).map((entry: any) => ({ id: entry.id, medicationName: entry.medicationName, directions: entry.directions })),
    safetyReviews: (prescription.safetyReviews || []).map((review: any) => ({ id: review.id, fillNumber: review.fillNumber, outcome: review.outcome, reviewReference: review.reviewReference, notes: review.notes, overrideReason: review.overrideReason, reviewedAt: review.reviewedAt, pharmacistName: review.pharmacist?.name || 'Authorized reviewer' })),
    dispensingLabels: (prescription.dispensingLabels || []).map((label: any) => ({ id: label.id, labelNumber: label.labelNumber, fillNumber: label.fillNumber, operatorName: label.operatorNameSnapshot, operatorPhone: label.operatorPhoneSnapshot, locationName: label.locationNameSnapshot, locationAddress: label.locationAddressSnapshot, patientName: label.patientNameSnapshot, prescriberName: label.prescriberNameSnapshot, medicationName: label.medicationNameSnapshot, sig: label.sigSnapshot, quantityDispensed: label.quantityDispensed, lotNumber: label.lotNumberSnapshot, ndc11: label.ndc11Snapshot, expirationDate: label.expirationDateSnapshot, auxiliaryWarnings: Array.isArray(label.auxiliaryWarnings) ? label.auxiliaryWarnings : [], counselingOutcome: label.counselingOutcome, dispensedAt: label.dispensedAt })),
    refillRequests: (prescription.refillRequests || []).map((entry: any) => ({ id: entry.id, status: entry.status, requestNote: entry.requestNote, resolutionNote: entry.resolutionNote, requestedAt: entry.requestedAt, resolvedAt: entry.resolvedAt, prescriptionItemId: entry.prescriptionItem?.id, medicationName: entry.prescriptionItem?.medicationNameSnapshot || 'Prescription item' })),
    transfers: (prescription.transfers || []).map((entry: any) => ({ id: entry.id, direction: entry.direction, status: entry.status, counterpartyName: entry.counterpartyName, counterpartyPhone: entry.counterpartyPhone, requestedAt: entry.requestedAt, completedAt: entry.completedAt, consentRecorded: entry.consent?.accepted === true })),
    reviews: (prescription.reviews || []).map((review: any) => ({
      id: review.id,
      decision: review.decision,
      reason: review.reason,
      reviewedAt: review.reviewedAt,
      pharmacistName: review.pharmacist?.name || 'Authorized reviewer',
    })),
  }
}

const inventoryLotQueueStatuses = new Set(['available', 'quarantined', 'expired', 'recalled', 'depleted'])

export function inventoryLotQueueFilter(
  locationIds: string[],
  filters: { locationId?: string | null; status?: string | null },
) {
  const allowedLocationIds = [...new Set(locationIds)].sort()
  let scopedLocationIds = allowedLocationIds
  if (filters.locationId != null) {
    if (typeof filters.locationId !== 'string' || !filters.locationId.trim() || !allowedLocationIds.includes(filters.locationId)) {
      throw new DomainError('You do not have access to this location')
    }
    scopedLocationIds = [filters.locationId]
  }
  const status = filters.status ?? null
  if (status !== null && (typeof status !== 'string' || !inventoryLotQueueStatuses.has(status))) {
    throw new DomainError('Inventory status filter is invalid')
  }
  const where: Record<string, any> = { location: { id: { in: scopedLocationIds } } }
  if (status) where.status = { equals: status }
  const scope = createHash('sha256').update(JSON.stringify({ worklist: 'inventory-lots', locationIds: scopedLocationIds, status })).digest('base64url')
  return { where, scope }
}

export async function pharmacyInventoryQueue(
  _root: unknown,
  args: { first?: number | null; after?: string | null; locationId?: string | null; status?: string | null },
  context: Context,
) {
  requireAny(context, ['canManageInventory', 'canManageRecalls', 'canDispenseMedications'])
  const pageSize = boundedPageSize(args.first)
  const scope = await tenantScope(context)
  const { where: baseWhere, scope: cursorScope } = inventoryLotQueueFilter(scope.locationIds, args)
  const cursor = decodeStableCursor(args.after, cursorScope)
  const [totalCount, records] = await Promise.all([
    context.sudo().query.InventoryLot.count({ where: baseWhere }),
    context.sudo().query.InventoryLot.findMany({
      where: stableCursorWhere(baseWhere, cursor, 'expirationDate', 'asc'),
      orderBy: [{ expirationDate: 'asc' }, { id: 'asc' }],
      take: pageSize + 1,
      query: 'id lotNumber status expirationDate quantityAvailable quantityQuarantined coldChainRequired coldChainEvidenceComplete storageBin product { title sku } location { name } recallsCount(where: { status: { in: ["active", "quarantined"] } }) temperatureExcursionsCount(where: { status: { in: ["open", "under_review"] } })',
    }),
  ])
  const hasMore = records.length > pageSize
  const pageRecords = records.slice(0, pageSize)
  const items = pageRecords.map((record: any) => ({
    id: record.id,
    lotNumber: record.lotNumber,
    status: record.status,
    expirationDate: record.expirationDate,
    quantityAvailable: record.quantityAvailable,
    quantityQuarantined: record.quantityQuarantined,
    coldChainRequired: record.coldChainRequired,
    coldChainEvidenceComplete: record.coldChainEvidenceComplete,
    storageBin: record.storageBin,
    productTitle: record.product?.title || 'Unlinked product',
    productSku: record.product?.sku || '',
    locationName: record.location?.name || 'Unassigned',
    activeRecallCount: record.recallsCount || 0,
    openExcursionCount: record.temperatureExcursionsCount || 0,
  }))
  return {
    items,
    totalCount,
    hasMore,
    nextCursor: hasMore && pageRecords.length
      ? encodeStableCursor({ createdAt: pageRecords[pageRecords.length - 1].expirationDate, id: pageRecords[pageRecords.length - 1].id }, cursorScope)
      : null,
  }
}

export async function pharmacyInventoryLotTask(_root: unknown, args: { lotId: string }, context: Context) {
  requireAny(context, ['canManageInventory', 'canManageRecalls', 'canDispenseMedications'])
  const scope = await tenantScope(context)
  const lot = await context.sudo().query.InventoryLot.findOne({
    where: { id: args.lotId },
    query: `
      id lotNumber serialNumber status expirationDate receivedAt quantityReceived quantityAvailable quantityQuarantined
      storageBin coldChainRequired minimumTemperatureC maximumTemperatureC coldChainEvidenceComplete
      product { id title sku } location { id name }
      recalls { id recallNumber status classification }
      temperatureExcursions(orderBy: { startedAt: desc }) { id status observedMinimumC observedMaximumC startedAt endedAt }
      movements(orderBy: { occurredAt: desc }, take: 50) { id movementType quantityDelta reason occurredAt actor { name } }
    `,
  })
  if (!lot || !scope.locationIds.includes(lot.location?.id)) throw new DomainError('Inventory lot not found')
  return {
    id: lot.id,
    lotNumber: lot.lotNumber,
    serialNumber: lot.serialNumber,
    status: lot.status,
    expirationDate: lot.expirationDate,
    receivedAt: lot.receivedAt,
    quantityReceived: lot.quantityReceived,
    quantityAvailable: lot.quantityAvailable,
    quantityQuarantined: lot.quantityQuarantined,
    eligibleQuantity: eligibleLotQuantity(lot),
    storageBin: lot.storageBin,
    coldChainRequired: lot.coldChainRequired,
    minimumTemperatureC: lot.minimumTemperatureC,
    maximumTemperatureC: lot.maximumTemperatureC,
    coldChainEvidenceComplete: lot.coldChainEvidenceComplete,
    productId: lot.product?.id,
    productTitle: lot.product?.title || 'Unlinked product',
    productSku: lot.product?.sku || '',
    locationId: lot.location.id,
    locationName: lot.location.name,
    canAdjust: !['recalled', 'expired'].includes(lot.status),
    recalls: (lot.recalls || []).map((recall: any) => ({ id: recall.id, recallNumber: recall.recallNumber, status: recall.status, classification: recall.classification })),
    excursions: (lot.temperatureExcursions || []).map((excursion: any) => ({
      id: excursion.id,
      status: excursion.status,
      observedMinimumC: excursion.observedMinimumC,
      observedMaximumC: excursion.observedMaximumC,
      startedAt: excursion.startedAt,
      endedAt: excursion.endedAt,
    })),
    movements: (lot.movements || []).map((movement: any) => ({
      id: movement.id,
      movementType: movement.movementType,
      quantityDelta: movement.quantityDelta,
      reason: movement.reason,
      occurredAt: movement.occurredAt,
      actorName: movement.actor?.name || 'System',
    })),
  }
}

export async function pharmacyRecallOpenOptions(_root: unknown, _args: unknown, context: Context) {
  requireAny(context, ['canManageRecalls'])
  const scope = await tenantScope(context)
  const sudo = context.sudo()
  const [organizations, locations, lots] = await Promise.all([
    sudo.query.Organization.findMany({ where: { id: { in: scope.organizationIds } }, orderBy: { name: 'asc' }, take: 100, query: 'id name' }),
    sudo.query.PharmacyLocation.findMany({ where: { id: { in: scope.locationIds } }, orderBy: { name: 'asc' }, take: 100, query: 'id name organization { id }' }),
    sudo.query.InventoryLot.findMany({ where: { location: { id: { in: scope.locationIds } }, quantityReceived: { gt: 0 } }, orderBy: { expirationDate: 'asc' }, take: 10_000, query: 'id lotNumber status quantityReceived quantityAvailable product { title sku organization { id } } location { id name }' }),
  ])
  return {
    organizations: organizations.map((entry: any) => ({ id: entry.id, label: entry.name, scopeId: entry.id, detail: null })),
    organizationWideOrganizationIds: scope.organizationWideIds,
    locations: locations.map((entry: any) => ({ id: entry.id, label: entry.name, scopeId: entry.organization?.id, detail: null })),
    lots: lots.map((entry: any) => ({ id: entry.id, label: `${entry.product?.title || 'Product'} · ${entry.lotNumber}`, organizationId: entry.product?.organization?.id, locationId: entry.location?.id, detail: `${entry.location?.name || 'Unknown location'} · ${entry.status} · ${entry.quantityAvailable}/${entry.quantityReceived} available/received · ${entry.product?.sku || ''}` })),
  }
}

export async function pharmacyRecallQueue(_root: unknown, _args: unknown, context: Context) {
  requireAny(context, ['canManageRecalls', 'canManageInventory'])
  const scope = await tenantScope(context)
  const records = await context.sudo().query.Recall.findMany({
    where: tenantEventFilter(scope),
    orderBy: { initiatedAt: 'desc' },
    take: 100,
    query: 'id recallNumber classification status reason source initiatedAt location { name } lots { id status quantityAvailable quantityQuarantined } exposures { status } approval { id approvedAt actor { name } }',
  })
  return Promise.all(records.map(async (record: any) => {
    const lotIds = (record.lots || []).map((lot: any) => lot.id)
    const candidateWhere = recallExposureMovementWhere(lotIds)
    const [candidateMovementCount, candidateMovements, exposureCount] = await Promise.all([
      context.sudo().query.InventoryMovement.count({ where: candidateWhere }),
      context.sudo().query.InventoryMovement.findMany({ where: candidateWhere, orderBy: { occurredAt: 'asc' }, take: 10_000, query: 'id' }),
      context.sudo().query.RecallExposure.count({ where: { recall: { id: { equals: record.id } } } }),
    ])
    const candidateMovementIds = candidateMovements.map((movement: any) => movement.id)
    const linkedRows = candidateMovementIds.length ? await context.sudo().query.RecallExposure.findMany({ where: { recall: { id: { equals: record.id } }, movement: { id: { in: candidateMovementIds } } }, take: 10_000, query: 'id movement { id }' }) : []
    const linkedMovementIds = (linkedRows as any[]).map((entry) => entry.movement?.id).filter(Boolean)
    const { unlinkedExposureCount } = assessRecallExposureReconciliation({ candidateMovementCount, linkedMovementIds, exposureCount, linkedExposureCount: linkedRows.length })
    return {
    id: record.id,
    recallNumber: record.recallNumber,
    classification: record.classification,
    status: record.status,
    reason: record.reason,
    source: record.source,
    initiatedAt: record.initiatedAt,
    locationName: record.location?.name || null,
    affectedLotCount: record.lots?.length || 0,
    quarantinedLotCount: (record.lots || []).filter((lot: any) => ['quarantined', 'recalled'].includes(lot.status) || lot.quantityQuarantined >= lot.quantityAvailable).length,
    unresolvedExposureCount: (record.exposures || []).filter((exposure: any) => !['returned', 'resolved', 'unable_to_reach'].includes(exposure.status)).length + unlinkedExposureCount,
    approvalRecorded: Boolean(record.approval?.id),
    approvedAt: record.approval?.approvedAt || null,
    approvedBy: record.approval?.actor?.name || null,
    }
  }))
}

export async function pharmacyRecallWorklist(_root: unknown, args: { first?: number | null; after?: string | null }, context: Context) {
  requireAny(context, ['canManageRecalls'])
  requirePatientPrivateData(context)
  const scope = await tenantScope(context)
  const pageSize = boundedPageSize(args.first)
  const cursor = decodeStableCursor(args.after)
  const baseWhere = tenantEventFilter(scope)
  const [totalCount, records] = await Promise.all([
    context.sudo().query.Recall.count({ where: baseWhere }),
    context.sudo().query.Recall.findMany({
      where: stableCursorWhere(baseWhere, cursor, 'initiatedAt'),
      orderBy: [{ initiatedAt: 'desc' }, { id: 'desc' }],
      take: pageSize + 1,
      query: 'id recallNumber classification status reason source initiatedAt location { name } lots { id status quantityAvailable quantityQuarantined } approval { id approvedAt actor { name } }',
    }),
  ])
  const hasMore = records.length > pageSize
  const pageRecords = records.slice(0, pageSize)
  const items = await Promise.all(pageRecords.map(async (record: any) => {
    const lotIds = (record.lots || []).map((lot: any) => lot.id)
    const candidateWhere = recallExposureMovementWhere(lotIds)
    const [candidateMovementCount, candidateMovements, exposureCount, unresolvedExposureCount] = await Promise.all([
      context.sudo().query.InventoryMovement.count({ where: candidateWhere }),
      context.sudo().query.InventoryMovement.findMany({ where: candidateWhere, orderBy: { occurredAt: 'asc' }, take: 10_000, query: 'id' }),
      context.sudo().query.RecallExposure.count({ where: { recall: { id: { equals: record.id } } } }),
      context.sudo().query.RecallExposure.count({ where: { recall: { id: { equals: record.id } }, status: { in: ['outreach_required', 'contacted'] } } }),
    ])
    const candidateMovementIds = candidateMovements.map((movement: any) => movement.id)
    const linkedRows = candidateMovementIds.length ? await context.sudo().query.RecallExposure.findMany({ where: { recall: { id: { equals: record.id } }, movement: { id: { in: candidateMovementIds } } }, take: 10_000, query: 'id movement { id }' }) : []
    const linkedMovementIds = (linkedRows as any[]).map((entry) => entry.movement?.id).filter(Boolean)
    const { unlinkedExposureCount } = assessRecallExposureReconciliation({ candidateMovementCount, linkedMovementIds, exposureCount, linkedExposureCount: linkedRows.length })
    return {
      id: record.id,
      recallNumber: record.recallNumber,
      classification: record.classification,
      status: record.status,
      reason: record.reason,
      source: record.source,
      initiatedAt: record.initiatedAt,
      locationName: record.location?.name || null,
      affectedLotCount: record.lots?.length || 0,
      quarantinedLotCount: (record.lots || []).filter((lot: any) => ['quarantined', 'recalled'].includes(lot.status) || lot.quantityQuarantined >= lot.quantityAvailable).length,
      unresolvedExposureCount: unresolvedExposureCount + unlinkedExposureCount,
      approvalRecorded: Boolean(record.approval?.id),
      approvedAt: record.approval?.approvedAt || null,
      approvedBy: record.approval?.actor?.name || null,
    }
  }))
  return { items, totalCount, hasMore, nextCursor: hasMore && pageRecords.length ? encodeStableCursor({ createdAt: pageRecords[pageRecords.length - 1].initiatedAt, id: pageRecords[pageRecords.length - 1].id }) : null }
}

export async function pharmacyRecallTask(_root: unknown, args: { recallId: string }, context: Context) {
  requireAny(context, ['canManageRecalls'])
  requirePatientPrivateData(context)
  const scope = await tenantScope(context)
  // Location-bound recalls stay within the member's location. Locationless
  // recalls span tenant-wide exposure evidence and require organization scope.
  const recall = (await context.sudo().query.Recall.findMany({
    take: 1,
    where: {
      id: { equals: args.recallId },
      organization: { id: { in: scope.organizationIds } },
      OR: [
        { location: { id: { in: scope.locationIds } } },
        { AND: [{ location: null }, { organization: { id: { in: scope.organizationWideIds } } }] },
      ],
    },
    query: 'id recallNumber classification status reason source initiatedAt closedAt organization { id } location { id name } lots { id lotNumber status quantityAvailable quantityQuarantined product { title sku } location { name } } exposures(orderBy: { createdAt: asc }, take: 10000) { id status quantityDispensed contactMethod outcome notes lastActionAt resolvedAt patient { id displayName } prescription { id prescriptionNumber } order { id orderNumber } } approval { id approvedAt actor { name } }',
  }))[0]
  if (!recall) throw new DomainError('Recall not found')
  const candidateWhere = recallExposureMovementWhere((recall.lots || []).map((lot: any) => lot.id))
  const [candidateMovementCount, candidateMovements, exposureCount] = await Promise.all([
    context.sudo().query.InventoryMovement.count({ where: candidateWhere }),
    context.sudo().query.InventoryMovement.findMany({ where: candidateWhere, orderBy: { occurredAt: 'asc' }, take: 10_000, query: 'id' }),
    context.sudo().query.RecallExposure.count({ where: { recall: { id: { equals: recall.id } } } }),
  ])
  const candidateMovementIds = candidateMovements.map((movement: any) => movement.id)
  const linkedRows = candidateMovementIds.length ? await context.sudo().query.RecallExposure.findMany({ where: { recall: { id: { equals: recall.id } }, movement: { id: { in: candidateMovementIds } } }, take: 10_000, query: 'id movement { id }' }) : []
  const linkedMovementIds = (linkedRows as any[]).map((entry) => entry.movement?.id).filter(Boolean)
  const { linkedMovementCount, unlinkedExposureCount, exposureReconciliationComplete } = assessRecallExposureReconciliation({ candidateMovementCount, linkedMovementIds, exposureCount, linkedExposureCount: linkedRows.length })
  return {
    id: recall.id,
    recallNumber: recall.recallNumber,
    classification: recall.classification,
    status: recall.status,
    reason: recall.reason,
    source: recall.source,
    initiatedAt: recall.initiatedAt,
    closedAt: recall.closedAt,
    locationId: recall.location?.id || null,
    locationName: recall.location?.name || null,
    approvalRecorded: Boolean(recall.approval?.id),
    approvedAt: recall.approval?.approvedAt || null,
    canQuarantine: recall.status === 'active' && (recall.lots || []).length > 0,
    canClose: exposureReconciliationComplete && unlinkedExposureCount === 0 && ['quarantined', 'resolved'].includes(recall.status) && (recall.lots || []).every((lot: any) => lot.quantityQuarantined === 0) && (recall.exposures || []).every((exposure: any) => ['returned', 'resolved', 'unable_to_reach'].includes(exposure.status)),
    unlinkedExposureCount,
    exposureReconciliationComplete,
    approvedBy: recall.approval?.actor?.name || null,
    exposures: (recall.exposures || []).map((entry: any) => ({ id: entry.id, status: entry.status, quantityDispensed: entry.quantityDispensed, contactMethod: entry.contactMethod, outcome: entry.outcome, notes: entry.notes, lastActionAt: entry.lastActionAt, resolvedAt: entry.resolvedAt, patientId: entry.patient?.id, patientDisplayName: entry.patient?.displayName || 'Private patient', prescriptionId: entry.prescription?.id, prescriptionNumber: entry.prescription?.prescriptionNumber, orderId: entry.order?.id, orderNumber: entry.order?.orderNumber })),
    lots: (recall.lots || []).map((lot: any) => ({
      id: lot.id,
      lotNumber: lot.lotNumber,
      status: lot.status,
      quantityAvailable: lot.quantityAvailable,
      quantityQuarantined: lot.quantityQuarantined,
      productTitle: lot.product?.title || 'Unlinked product',
      productSku: lot.product?.sku || '',
      locationName: lot.location?.name || 'Unassigned',
    })),
  }
}

const orderStatuses = new Set(['pending', 'review_required', 'approved', 'processing', 'ready', 'out_for_delivery', 'completed', 'cancelled'])
const orderFulfillmentMethods = new Set(['pickup', 'delivery', 'pos'])

export function pharmacyOrderQueueFilter(
  scope: { organizationIds: string[]; locationIds: string[] },
  filters: { status?: string | null; fulfillmentMethod?: string | null },
) {
  const organizationIds = [...new Set(scope.organizationIds)].sort()
  const locationIds = [...new Set(scope.locationIds)].sort()
  const status = filters.status ?? null
  const fulfillmentMethod = filters.fulfillmentMethod ?? null
  if (status !== null && (typeof status !== 'string' || !orderStatuses.has(status))) {
    throw new DomainError('Order status filter is invalid')
  }
  if (fulfillmentMethod !== null && (typeof fulfillmentMethod !== 'string' || !orderFulfillmentMethods.has(fulfillmentMethod))) {
    throw new DomainError('Order fulfillment filter is invalid')
  }
  const where: Record<string, any> = {
    organization: { id: { in: organizationIds } },
    location: { id: { in: locationIds } },
  }
  if (status) where.status = { equals: status }
  if (fulfillmentMethod) where.fulfillmentMethod = { equals: fulfillmentMethod }
  const cursorScope = createHash('sha256').update(JSON.stringify({
    worklist: 'orders', organizationIds, locationIds, status, fulfillmentMethod,
  })).digest('base64url')
  return { where, cursorScope }
}

export async function pharmacyOrderQueue(
  _root: unknown,
  args: { first?: number | null; after?: string | null; status?: string | null; fulfillmentMethod?: string | null },
  context: Context,
) {
  requireAny(context, ['canManageOrders'])
  const pageSize = boundedPageSize(args.first)
  const scope = await tenantScope(context)
  const { where: baseWhere, cursorScope } = pharmacyOrderQueueFilter(scope, args)
  const cursor = decodeStableCursor(args.after, cursorScope)
  const [totalCount, records] = await Promise.all([
    context.sudo().query.Order.count({ where: baseWhere }),
    context.sudo().query.Order.findMany({
      where: stableCursorWhere(baseWhere, cursor),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: pageSize + 1,
      query: 'id orderNumber status fulfillmentMethod totalAmount currencyCode createdAt location { name } lineItemsCount lineItems(where: { prescriptionRequirementSnapshot: { not: { equals: "none" } } }, take: 1) { id } fulfillment { id status } payments(take: 1) { status }',
    }),
  ])
  const hasMore = records.length > pageSize
  const pageRecords = records.slice(0, pageSize)
  const items = pageRecords.map((record: any) => ({
    id: record.id,
    orderNumber: record.orderNumber,
    status: record.status,
    fulfillmentMethod: record.fulfillmentMethod,
    totalAmount: record.totalAmount,
    currencyCode: record.currencyCode,
    createdAt: record.createdAt,
    locationName: record.location?.name || 'Unassigned',
    lineItemCount: record.lineItemsCount || 0,
    hasPrescriptionLines: (record.lineItems || []).length > 0,
    fulfillmentId: record.fulfillment?.id || null,
    fulfillmentStatus: record.fulfillment?.status || 'pending',
    paymentStatus: record.payments?.[0]?.status || 'unpaid',
  }))
  return {
    items,
    totalCount,
    hasMore,
    nextCursor: hasMore && pageRecords.length
      ? encodeStableCursor({ createdAt: pageRecords[pageRecords.length - 1].createdAt, id: pageRecords[pageRecords.length - 1].id }, cursorScope)
      : null,
  }
}

export async function pharmacyOrderTask(_root: unknown, args: { orderId: string }, context: Context) {
  requireAny(context, ['canManageOrders'])
  const scope = await tenantScope(context)
  const order = await context.sudo().query.Order.findOne({
    where: { id: args.orderId },
    query: `
      id orderNumber status fulfillmentMethod subtotalAmount taxAmount deliveryAmount totalAmount currencyCode createdAt pickupAt deliveryWindow
      customerName email phone
      organization { id } location { id name }
      lineItems { id title sku ndc11Snapshot quantity unitPriceAmount lineTotalAmount prescriptionRequirementSnapshot }
      fulfillment { id method status readyAt handedOffAt assignedTo { name } }
      payments { id status amount currencyCode tenderMethod cashReceivedAmount changeDueAmount processedAt provider { name code } }
    `,
  })
  if (!order || !scope.organizationIds.includes(order.organization?.id) || !scope.locationIds.includes(order.location?.id)) throw new DomainError('Order not found')
  const contact = permissions.canViewPatientPrivateData({ session: context.session as any })
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    fulfillmentMethod: order.fulfillmentMethod,
    customerName: contact ? order.customerName || null : null,
    customerEmail: contact ? order.email || null : null,
    customerPhone: contact ? order.phone || null : null,
    subtotalAmount: order.subtotalAmount,
    taxAmount: order.taxAmount,
    deliveryAmount: order.deliveryAmount,
    totalAmount: order.totalAmount,
    currencyCode: order.currencyCode,
    createdAt: order.createdAt,
    pickupAt: order.pickupAt,
    deliveryWindow: order.deliveryWindow,
    locationId: order.location.id,
    locationName: order.location.name,
    availableFulfillmentStatuses: fulfillmentTransitions[order.fulfillment?.status || ''] || [],
    lines: (order.lineItems || []).map((line: any) => ({
      id: line.id,
      title: line.title,
      sku: line.sku,
      ndc11: line.ndc11Snapshot,
      quantity: line.quantity,
      unitPriceAmount: line.unitPriceAmount,
      lineTotalAmount: line.lineTotalAmount,
      prescriptionRequirement: line.prescriptionRequirementSnapshot,
    })),
    fulfillment: order.fulfillment ? {
      id: order.fulfillment.id,
      method: order.fulfillment.method,
      status: order.fulfillment.status,
      readyAt: order.fulfillment.readyAt,
      handedOffAt: order.fulfillment.handedOffAt,
      assignedToName: order.fulfillment.assignedTo?.name || null,
    } : null,
    payment: order.payments?.[0] ? {
      id: order.payments[0].id,
      status: order.payments[0].status,
      amount: order.payments[0].amount,
      currencyCode: order.payments[0].currencyCode,
      processedAt: order.payments[0].processedAt,
      tenderMethod: order.payments[0].tenderMethod || 'provider',
      cashReceivedAmount: order.payments[0].cashReceivedAmount,
      changeDueAmount: order.payments[0].changeDueAmount,
      providerName: order.payments[0].tenderMethod === 'cash' ? 'Operator-attested cash' : order.payments[0].provider?.name || 'Unknown provider',
      providerCode: order.payments[0].provider?.code || '',
    } : null,
  }
}

function patientSafeProjection(record: any) {
  const activeConsents = (record.consents || []).filter((consent: any) => consent.accepted && !consent.revokedAt)
  return {
    id: record.id,
    patientNumber: record.patientNumber,
    displayName: record.displayName,
    status: record.status,
    preferredContactMethod: record.preferredContactMethod,
    identityVerificationStatus: record.identityVerificationStatus,
    hasIdentityEvidence: Boolean(record.identityReference && record.identityVerifiedAt),
    organizationNames: (record.organizations || []).map((organization: any) => organization.name),
    prescriptionCount: record.prescriptionsCount || 0,
    activeConsentCount: activeConsents.length,
    latestConsentAt: activeConsents[0]?.grantedAt || null,
    allergies: (record.allergies || []).map((entry: any) => ({ id: entry.id, allergen: entry.allergen, reaction: entry.reaction, severity: entry.severity, status: entry.status, source: entry.source, recordedAt: entry.recordedAt })),
    medications: (record.medications || []).map((entry: any) => ({ id: entry.id, medicationName: entry.medicationName, directions: entry.directions, status: entry.status, source: entry.source, recordedAt: entry.recordedAt })),
  }
}

export async function pharmacyPatientAccountCandidates(_root: unknown, args: { patientId: string }, context: Context) {
  requireAny(context, ['canManagePatients'])
  requirePatientPrivateData(context)
  const scope = await tenantScope(context)
  const patient = await context.sudo().query.PatientProfile.findOne({ where: { id: args.patientId }, query: 'id email user { id email name } organizations { id }' })
  if (!patient || !patient.organizations?.some((organization: any) => scope.organizationIds.includes(organization.id))) throw new DomainError('Patient not found')
  const patientOrganizationIds = patient.organizations.map((organization: any) => organization.id).filter((id: string) => scope.organizationIds.includes(id))
  const users = await context.sudo().query.User.findMany({
    where: {
      OR: [
        ...(patient.user?.id ? [{ id: { equals: patient.user.id } }] : []),
        await patientAccountWhere(context, patientOrganizationIds, patient.email),
      ],
    },
    orderBy: { name: 'asc' },
    take: 200,
    query: 'id name email patientProfile { id }',
  })
  const available = users.filter((user: any) => !user.patientProfile || user.id === patient.user?.id)
  return available.map((user: any) => ({ id: user.id, label: user.name, scopeId: user.id, detail: user.email }))
}

export async function pharmacyPatientPortal(_root: unknown, _args: unknown, context: Context) {
  if (!context.session?.itemId) throw new DomainError('Authentication required')
  const patient = (await context.sudo().query.PatientProfile.findMany({
    where: { user: { id: { equals: context.session.itemId } } },
    take: 1,
    query: `
      id patientNumber displayName preferredContactMethod
      prescriptions(orderBy: { createdAt: desc }) {
        id prescriptionNumber status organization { id } location { id name } prescriber { id name }
        items { id fillLineage product { id } drugReference { id } medicationNameSnapshot sig quantityPrescribed quantityDispensed daysSupply refillsAuthorized refillsRemaining refillsReserved substitutionAllowed }
        refillRequests(orderBy: { requestedAt: desc }, take: 1) { status }
      }
      orders(orderBy: { createdAt: desc }, take: 50) {
        id orderNumber status totalAmount currencyCode createdAt fulfillment { status }
      }
    `,
  }))[0]
  if (!patient) throw new DomainError('No patient profile is linked to this account')
  return {
    id: patient.id,
    patientNumber: patient.patientNumber,
    displayName: patient.displayName,
    preferredContactMethod: patient.preferredContactMethod,
    prescriptions: (patient.prescriptions || []).map((prescription: any) => {
      const refillableItem = prescription.items?.find((item: any) => item.refillsRemaining > item.refillsReserved) || prescription.items?.[0]
      return {
      id: prescription.id,
      prescriptionNumber: prescription.prescriptionNumber,
      status: prescription.status,
      locationId: prescription.location?.id || '',
      locationName: prescription.location?.name || 'Pharmacy',
      prescriberName: prescription.prescriber?.name || 'Prescriber pending',
      prescriptionItemId: refillableItem?.id || '',
      medicationName: refillableItem?.medicationNameSnapshot || 'Prescription',
      refillsRemaining: Math.max(0, (refillableItem?.refillsRemaining || 0) - (refillableItem?.refillsReserved || 0)),
      fillLineage: refillableItem?.fillLineage || null,
      refillEligible: refillableItem?.fillLineage === 'per_fill_v1' && refillableItem?.quantityDispensed > 0 && ['dispensed', 'fill_closed'].includes(prescription.status),
      itemVersion: refillableItem ? prescriptionItemVersion({ ...prescription, patient: { id: patient.id } }, refillableItem) : null,
      lastRefillStatus: prescription.refillRequests?.[0]?.status || null,
    }}),
    orders: (patient.orders || []).map((order: any) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      fulfillmentStatus: order.fulfillment?.status || 'pending',
      totalAmount: order.totalAmount,
      currencyCode: order.currencyCode,
      createdAt: order.createdAt,
    })),
  }
}

export async function pharmacyPatientDirectory(_root: unknown, _args: unknown, context: Context) {
  requireAny(context, ['canManagePatients', 'canManagePrescriptions'])
  requirePatientPrivateData(context)
  const scope = await tenantScope(context)
  const records = await context.sudo().query.PatientProfile.findMany({
    where: { organizations: { some: { id: { in: scope.organizationIds } } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
    query: 'id patientNumber displayName status preferredContactMethod identityVerificationStatus identityReference identityVerifiedAt organizations { name } consents(orderBy: { grantedAt: desc }) { accepted grantedAt revokedAt } allergies(orderBy: { recordedAt: desc }, take: 100) { id allergen reaction severity status source recordedAt } medications(orderBy: { recordedAt: desc }, take: 100) { id medicationName directions status source recordedAt } prescriptionsCount',
  })
  return records.map(patientSafeProjection)
}

export async function pharmacyPatientSafeView(_root: unknown, args: { patientId: string }, context: Context) {
  requireAny(context, ['canManagePatients', 'canManagePrescriptions'])
  requirePatientPrivateData(context)
  const scope = await tenantScope(context)
  const patient = await context.sudo().query.PatientProfile.findOne({
    where: { id: args.patientId },
    query: 'id patientNumber displayName status email phone address preferredContactMethod identityVerificationStatus identityReference identityVerifiedAt organizations { id name } consents(orderBy: { grantedAt: desc }) { accepted grantedAt revokedAt } allergies(orderBy: { recordedAt: desc }, take: 100) { id allergen reaction severity status source recordedAt } medications(orderBy: { recordedAt: desc }, take: 100) { id medicationName directions status source recordedAt } prescriptionsCount',
  })
  if (!patient || !patient.organizations?.some((organization: any) => scope.organizationIds.includes(organization.id))) throw new DomainError('Patient not found')
  // Contact details are returned only on the single-patient view, for the contact update form.
  return { ...patientSafeProjection(patient), email: patient.email || null, phone: patient.phone || null, address: patient.address || null }
}

export async function pharmacyIntegrationStatus(_root: unknown, _args: unknown, context: Context) {
  requireAny(context, ['canManageIntegrations'])
  const scope = await tenantScope(context)
  const records = await context.sudo().query.IntegrationProvider.findMany({
    where: { organization: { id: { in: scope.organizationIds } } },
    orderBy: { providerType: 'asc' },
    query: 'id name code providerType status externalValidationComplete validationReference organization { name }',
  })
  return records.map((record: any) => ({
    id: record.id,
    name: record.name,
    code: record.code,
    providerType: record.providerType,
    status: record.status,
    externalValidationComplete: record.externalValidationComplete,
    hasValidationReference: Boolean(record.validationReference),
    organizationName: record.organization?.name || 'Unassigned',
  }))
}

export async function pharmacyAuditTimeline(_root: unknown, args: { take?: number | null }, context: Context) {
  requireAny(context, ['canViewAuditLogs'])
  const scope = await tenantScope(context)
  const records = await context.sudo().query.AuditEvent.findMany({
    where: tenantEventFilter(scope),
    orderBy: { occurredAt: 'desc' },
    take: Math.max(1, Math.min(100, args.take || 50)),
    query: 'id eventKey eventType resourceType resourceId occurredAt actorType actor { name } location { name }',
  })
  return records.map((record: any) => ({
    id: record.id,
    eventKey: record.eventKey || null,
    eventType: record.eventType,
    resourceType: record.resourceType,
    resourceId: record.resourceId,
    occurredAt: record.occurredAt,
    actorType: record.actorType,
    actorName: record.actor?.name || null,
    locationName: record.location?.name || null,
  }))
}

export async function pharmacyOutboxTimeline(_root: unknown, args: { take?: number | null }, context: Context) {
  requireAny(context, ['canManageIntegrations', 'canViewAuditLogs'])
  const scope = await tenantScope(context)
  const records = await context.sudo().query.OutboxEvent.findMany({
    where: tenantEventFilter(scope),
    orderBy: { occurredAt: 'desc' },
    take: Math.max(1, Math.min(100, args.take || 50)),
    query: 'id eventKey eventType aggregateType aggregateId status attempts replayCount occurredAt processedAt lastError',
  })
  return records.map((record: any) => ({
    id: record.id,
    eventKey: record.eventKey,
    eventType: record.eventType,
    aggregateType: record.aggregateType,
    aggregateId: record.aggregateId,
    status: record.status,
    attempts: record.attempts,
    replayCount: record.replayCount,
    occurredAt: record.occurredAt,
    processedAt: record.processedAt,
    hasError: Boolean(record.lastError),
  }))
}

export async function pharmacyOperatorLocations(_root: unknown, _args: unknown, context: Context) {
  requireAny(context, ['canManageOrders'])
  const scope = await tenantScope(context)
  const records = await context.sudo().query.PharmacyLocation.findMany({
    where: { id: { in: scope.locationIds }, status: { equals: 'active' } },
    orderBy: { name: 'asc' },
    query: 'id name code pickupEnabled deliveryEnabled organization { operatorDisplayName supportPhone cashSalesEnabled cashTaxRateBps cashTaxPolicyReference }',
  })
  return records.map((record: any) => ({
    id: record.id,
    name: record.name,
    code: record.code,
    pickupEnabled: record.pickupEnabled,
    deliveryEnabled: record.deliveryEnabled,
    operatorDisplayName: record.organization?.operatorDisplayName || record.name,
    operatorPhone: record.organization?.supportPhone || null,
    cashSalesEnabled: record.organization?.cashSalesEnabled === true && Boolean(record.organization?.cashTaxPolicyReference),
    cashTaxRateBps: record.organization?.cashTaxRateBps || 0,
  }))
}

export async function pharmacyPosCatalog(_root: unknown, args: { locationId: string }, context: Context) {
  requireAny(context, ['canManageOrders'])
  const scope = await tenantScope(context)
  if (!scope.locationIds.includes(args.locationId)) throw new DomainError('Location not found')
  const records = await context.sudo().query.Product.findMany({
    where: {
      location: { id: { equals: args.locationId } },
      status: { equals: 'published' },
      posAvailable: { equals: true },
      prescriptionRequirement: { equals: 'none' },
    },
    orderBy: { title: 'asc' },
    take: 100,
    query: 'id title handle sku description category priceAmount currencyCode taxable imageUrl prescriptionRequirement inventoryLots { status expirationDate quantityAvailable quantityQuarantined coldChainRequired coldChainEvidenceComplete recalls { status } location { id } }',
  })
  return records.map((record: any) => {
    const availableQuantity = (record.inventoryLots || [])
      .filter((lot: any) => lot.location?.id === args.locationId)
      .reduce((sum: number, lot: any) => sum + eligibleLotQuantity(lot), 0)
    return { ...record, inventoryLots: undefined, availableQuantity, inStock: availableQuantity > 0 }
  }).filter((record: any) => record.inStock)
}

/** @deprecated Use pharmacyOutboxTimeline. */
export const pharmacyOutboxQueue = pharmacyOutboxTimeline
