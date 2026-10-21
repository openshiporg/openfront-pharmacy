import { createHash } from 'node:crypto'
import type { Context } from '.keystone/types'
import { eligibleLotQuantity } from '../workflows/lot-eligibility'
import { isSignedIn } from '../access'
import { operatorBrandFromOrganization, normalizeStorefrontTenantKey } from '../../pharmacy/branding'
import type { PublicPharmacyCatalogPageProjection, PublicPharmacyCatalogProductProjection, PublicPharmacyTenantProjection } from '../../pharmacy/contracts'

const PUBLIC_CATALOG_SEARCH_LIMIT = 100
const PUBLIC_CATALOG_CURSOR_LIMIT = 2048

function normalizePublicCatalogSearch(search?: string | null) {
  if (search == null) return null
  if (typeof search !== 'string') throw new Error('Catalog search is invalid')
  const normalized = search.trim()
  if (!normalized) return null
  if (normalized.length > PUBLIC_CATALOG_SEARCH_LIMIT || /[\u0000-\u001f\u007f]/u.test(normalized)) {
    throw new Error('Catalog search is invalid')
  }
  return normalized
}

function publicCatalogPageSize(first?: number | null) {
  if (first == null) return 50
  if (!Number.isInteger(first) || first < 1) throw new Error('Catalog page size must be a positive integer')
  return Math.min(first, 100)
}

type PublicCatalogCursor = { title: string; id: string }

function decodePublicCatalogCursor(cursor: string | null | undefined, expectedScope: string): PublicCatalogCursor | null {
  if (cursor == null) return null
  if (typeof cursor !== 'string' || cursor.length > PUBLIC_CATALOG_CURSOR_LIMIT) throw new Error('Catalog cursor is invalid')
  try {
    const value = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'))
    if (typeof value?.title !== 'string' || value.title.length > 1000 || typeof value?.id !== 'string' || !value.id || value.id.length > 256 || value.scope !== expectedScope) throw new Error()
    return { title: value.title, id: value.id }
  } catch {
    throw new Error('Catalog cursor is invalid')
  }
}

function encodePublicCatalogCursor(record: PublicCatalogCursor, scope: string) {
  return Buffer.from(JSON.stringify({ ...record, scope })).toString('base64url')
}

function publicCatalogCursorWhere(where: Record<string, any>, cursor: PublicCatalogCursor | null) {
  if (!cursor) return where
  return {
    AND: [where, {
      OR: [
        { title: { gt: cursor.title } },
        { AND: [{ title: { equals: cursor.title } }, { id: { gt: cursor.id } }] },
      ],
    }],
  }
}

function normalizePublicLocationSearch(search?: string | null) {
  if (search == null) return null
  if (typeof search !== 'string') throw new Error('Location search is invalid')
  const normalized = search.trim()
  if (!normalized) return null
  if (normalized.length > PUBLIC_CATALOG_SEARCH_LIMIT || /[\u0000-\u001f\u007f]/u.test(normalized)) {
    throw new Error('Location search is invalid')
  }
  return normalized
}

function publicLocationPageSize(first?: number | null) {
  if (first == null) return 50
  if (!Number.isInteger(first) || first < 1) throw new Error('Location page size must be a positive integer')
  return Math.min(first, 100)
}

type PublicLocationCursor = { name: string; id: string }

function decodePublicLocationCursor(cursor: string | null | undefined, expectedScope: string): PublicLocationCursor | null {
  if (cursor == null) return null
  if (typeof cursor !== 'string' || cursor.length > PUBLIC_CATALOG_CURSOR_LIMIT) throw new Error('Location cursor is invalid')
  try {
    const value = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'))
    if (typeof value?.name !== 'string' || value.name.length > 1000 || typeof value?.id !== 'string' || !value.id || value.id.length > 256 || value.scope !== expectedScope) throw new Error()
    return { name: value.name, id: value.id }
  } catch {
    throw new Error('Location cursor is invalid')
  }
}

function encodePublicLocationCursor(record: PublicLocationCursor, scope: string) {
  return Buffer.from(JSON.stringify({ ...record, scope })).toString('base64url')
}

function publicLocationCursorWhere(where: Record<string, any>, cursor: PublicLocationCursor | null) {
  if (!cursor) return where
  return {
    AND: [where, {
      OR: [
        { name: { gt: cursor.name } },
        { AND: [{ name: { equals: cursor.name } }, { id: { gt: cursor.id } }] },
      ],
    }],
  }
}

const PUBLIC_TENANT_QUERY = 'id storefrontKey storefrontHost operatorDisplayName operatorTagline brandPrimaryColor brandAccentColor brandLogoUrl logoIcon logoColor supportEmail supportPhone'

function optionalTenantKey(tenantKey?: string | null) {
  if (!tenantKey?.trim()) return null
  try {
    return normalizeStorefrontTenantKey(tenantKey)
  } catch {
    return null
  }
}

// Single-store default (as in E-commerce and Restaurant): a matching storefront
// key/host/slug wins; otherwise the only active organization serves the storefront.
export async function loadPublicTenant(context: Context, tenantKey?: string | null) {
  const key = optionalTenantKey(tenantKey)
  const sudo = context.sudo()
  if (key) {
    const matches = await sudo.query.Organization.findMany({
      where: {
        status: { equals: 'active' },
        OR: [
          { storefrontKey: { equals: key } },
          { storefrontHost: { equals: key } },
          { slug: { equals: key } },
        ],
      },
      take: 2,
      query: PUBLIC_TENANT_QUERY,
    })
    if (matches.length === 1) return matches[0]
  }
  const active = await sudo.query.Organization.findMany({
    where: { status: { equals: 'active' } },
    orderBy: [{ createdAt: 'asc' }],
    take: 2,
    query: PUBLIC_TENANT_QUERY,
  })
  if (active.length === 1) return active[0]
  throw new Error(active.length ? 'Store not found' : 'Store is not set up yet')
}

export async function publicPharmacyTenant(
  _root: unknown,
  args: { tenantKey?: string | null; search?: string | null; first?: number | null; after?: string | null },
  context: Context,
): Promise<PublicPharmacyTenantProjection> {
  const search = normalizePublicLocationSearch(args.search)
  const pageSize = publicLocationPageSize(args.first)
  const organization = await loadPublicTenant(context, args.tenantKey)
  const baseWhere: Record<string, any> = {
    organization: { id: { equals: organization.id } },
    status: { equals: 'active' },
    OR: [{ pickupEnabled: { equals: true } }, { deliveryEnabled: { equals: true } }],
  }
  if (search) {
    baseWhere.AND = [{ OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
    ] }]
  }
  const cursorScope = createHash('sha256').update(JSON.stringify({
    locations: 'public-pharmacy',
    organizationId: organization.id,
    search,
    status: 'active',
  })).digest('base64url')
  const cursor = decodePublicLocationCursor(args.after, cursorScope)
  const sudo = context.sudo()
  const [totalCount, records] = await Promise.all([
    sudo.query.PharmacyLocation.count({ where: baseWhere }),
    sudo.query.PharmacyLocation.findMany({
      where: publicLocationCursorWhere(baseWhere, cursor),
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      take: pageSize + 1,
      query: 'id name code status address phone onlineOrderingEnabled pickupEnabled deliveryEnabled',
    }),
  ])
  const hasMore = records.length > pageSize
  const pageRecords = records.slice(0, pageSize)
  const locations = pageRecords.map((location: any) => ({
    id: location.id,
    name: location.name,
    code: location.code,
    address: location.address,
    phone: location.phone,
    onlineOrderingEnabled: location.onlineOrderingEnabled === true,
    pickupEnabled: location.pickupEnabled === true,
    deliveryEnabled: location.deliveryEnabled === true,
  }))
  const lastLocation = pageRecords.at(-1)
  return {
    brand: operatorBrandFromOrganization(organization),
    locations,
    locationsTotalCount: totalCount,
    hasMoreLocations: hasMore,
    nextLocationCursor: hasMore && lastLocation ? encodePublicLocationCursor({ name: lastLocation.name, id: lastLocation.id }, cursorScope) : null,
  }
}

export async function publicPharmacyLocations(
  root: unknown,
  args: { tenantKey?: string | null },
  context: Context,
) {
  return (await publicPharmacyTenant(root, args, context)).locations
}

export async function publicPharmacyCatalog(
  _root: unknown,
  args: { tenantKey?: string | null; locationId: string; search?: string | null; first?: number | null; after?: string | null },
  context: Context,
): Promise<PublicPharmacyCatalogPageProjection> {
  const organization = await loadPublicTenant(context, args.tenantKey)
  const location = (await context.sudo().query.PharmacyLocation.findMany({
    take: 1,
    where: {
      id: { equals: args.locationId },
      organization: { id: { equals: organization.id } },
      status: { equals: 'active' },
    },
    query: 'id status pickupEnabled deliveryEnabled',
  }))[0]
  if (!location || location.status !== 'active' || (location.pickupEnabled !== true && location.deliveryEnabled !== true)) {
    throw new Error('This location is not available')
  }

  const search = normalizePublicCatalogSearch(args.search)
  const pageSize = publicCatalogPageSize(args.first)
  const baseWhere: Record<string, any> = {
    organization: { id: { equals: organization.id } },
    location: { id: { equals: args.locationId } },
    status: { equals: 'published' },
    onlineAvailable: { equals: true },
    prescriptionRequirement: { equals: 'none' },
  }
  if (search) {
    baseWhere.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { category: { equals: search.toLowerCase().replaceAll(' ', '_') } },
    ]
  }
  const cursorScope = createHash('sha256').update(JSON.stringify({
    catalog: 'public-pharmacy',
    organizationId: organization.id,
    locationId: args.locationId,
    search,
    status: 'published',
    onlineAvailable: true,
    prescriptionRequirement: 'none',
  })).digest('base64url')
  const cursor = decodePublicCatalogCursor(args.after, cursorScope)
  const sudo = context.sudo()
  const [totalCount, records] = await Promise.all([
    sudo.query.Product.count({ where: baseWhere }),
    sudo.query.Product.findMany({
      where: publicCatalogCursorWhere(baseWhere, cursor),
      orderBy: [{ title: 'asc' }, { id: 'asc' }],
      take: pageSize + 1,
      query: 'id title handle sku description category priceAmount currencyCode taxable imageUrl prescriptionRequirement inventoryLots(where: { quantityAvailable: { gt: 0 } }, orderBy: { expirationDate: asc }, take: 101) { status expirationDate quantityAvailable quantityQuarantined coldChainRequired coldChainEvidenceComplete recalls { status } location { id } }',
    }),
  ])
  const hasMore = records.length > pageSize
  const pageRecords = records.slice(0, pageSize)
  const items = pageRecords.map((record: any): PublicPharmacyCatalogProductProjection => {
    const lots = (record.inventoryLots || []).filter((lot: any) => lot.location?.id === args.locationId)
    const availableQuantity = lots.reduce((sum: number, lot: any) => sum + eligibleLotQuantity(lot), 0)
    return {
    id: record.id,
    title: record.title,
    handle: record.handle,
    sku: record.sku,
    description: record.description,
    category: record.category,
    priceAmount: record.priceAmount,
    currencyCode: record.currencyCode,
    taxable: record.taxable,
    imageUrl: record.imageUrl,
    prescriptionRequirement: record.prescriptionRequirement,
    availableQuantity,
    inStock: availableQuantity > 0,
    inventorySummaryStatus: (record.inventoryLots?.length || 0) <= 100 ? 'verified' : 'not_verified',
    }
  })
  const lastRecord = pageRecords.at(-1)
  return {
    items,
    totalCount,
    hasMore,
    nextCursor: hasMore && lastRecord ? encodePublicCatalogCursor({ title: lastRecord.title, id: lastRecord.id }, cursorScope) : null,
  }
}

export async function pharmacyOperationalSummary(
  _root: unknown,
  _args: unknown,
  context: Context,
) {
  if (!isSignedIn({ session: context.session as any })) throw new Error('Authentication required')
  const sudo = context.sudo()
  const memberships = await sudo.query.OrganizationMembership.findMany({
    where: { user: { id: { equals: context.session!.itemId } }, status: { equals: 'active' } },
    query: 'organization { id locations { id } } location { id }',
  })
  const organizationIds = [...new Set(memberships.map((membership: any) => membership.organization?.id).filter(Boolean))]
  const locationIds = [...new Set(memberships.flatMap((membership: any) => membership.location?.id
    ? [membership.location.id]
    : membership.organization?.locations?.map((location: any) => location.id) || []))]
  if (!organizationIds.length) return { pendingReview: 0, readyToDispense: 0, activeRecalls: 0, expiringLots: 0, processingOrders: 0 }
  const [pendingReview, readyToDispense, activeRecalls, expiringLots, processingOrders] = await Promise.all([
    sudo.query.Prescription.count({ where: { organization: { id: { in: organizationIds } }, status: { equals: 'pending_review' } } }),
    sudo.query.Prescription.count({ where: { organization: { id: { in: organizationIds } }, status: { equals: 'ready_to_dispense' } } }),
    sudo.query.Recall.count({ where: { organization: { id: { in: organizationIds } }, status: { in: ['active', 'quarantined'] } } }),
    sudo.query.InventoryLot.count({ where: { location: { id: { in: locationIds } }, expirationDate: { lte: new Date(Date.now() + 60 * 86400000).toISOString() }, status: { equals: 'available' } } }),
    sudo.query.Order.count({ where: { organization: { id: { in: organizationIds } }, status: { in: ['pending', 'processing', 'ready'] } } }),
  ])
  return { pendingReview, readyToDispense, activeRecalls, expiringLots, processingOrders }
}
