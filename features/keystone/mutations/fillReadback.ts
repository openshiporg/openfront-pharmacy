import type { Context } from '.keystone/types'
import { permissions } from '../access'
import { requireTenantMembership } from './lib/authorization'
import { currentFillPermission, loadFillPrescription } from './fillWorkflows'
import { FILL_LINEAGE, prescriptionItemVersion } from '../workflows/fill-entitlement'
import { prescriptionReadScope, sameScope, scopedFill, readScopeError, record, readCursor, writeCursor, cursorBoundary } from '../workflows/fill-read-scope'
import { readStore, fillMetadataQuery, readFillProjection, readEventProjection, readEventPage, fillReadWhere } from './fillReadProjection'
import { DomainError } from './lib/errors'

export async function authorizedFillReadback(context: Context, prescriptionId: string) {
  if (!context.session?.itemId || !permissions.canViewPatientPrivateData({ session: context.session })) throw new DomainError('Patient private-data permission required')
  const permission = permissions.canReviewPrescriptions({ session: context.session }) ? 'canReviewPrescriptions' : 'canDispenseMedications'
  await currentFillPermission(context, permission)
  const q = readStore(context)
  const actor = record(await q.User.findOne({ where: { id: context.session.itemId }, query: 'id role { canViewPatientPrivateData canManageOrganizations canApproveConsequentialActions }' }))
  const role = record(actor.role)
  if (actor.id !== context.session.itemId || role.canViewPatientPrivateData !== true) throw new DomainError('Current patient private-data permission was revoked')
  // Authorize minimal parent metadata before fetching clinical/policy/item data.
  const metadata = await q.Prescription.findOne({ where: { id: prescriptionId }, query: 'id organization { id } location { id } patient { id } prescriber { id organization { id } } items { id prescription { id } }' })
  const scope = prescriptionReadScope(metadata, prescriptionId)
  await requireTenantMembership(context, { organizationId: scope.organizationId, locationId: scope.locationId, pharmacist: true })
  const p = record(await loadFillPrescription(context, prescriptionId))
  if (!sameScope(prescriptionReadScope(p, prescriptionId), scope)) throw readScopeError()
  return { p, role, scope }
}
export async function pharmacyFillWorkbench(_root: unknown, args: { prescriptionId: string; after?: string | null }, context: Context) {
  const { p, role, scope } = await authorizedFillReadback(context, args.prescriptionId)
  const q = readStore(context)
  let boundary: Record<string, unknown> = {}
  if (args.after) {
    const cursor = readCursor(args.after, scope, 'operator_fill_workbench')
    const anchor = scopedFill(await q.PrescriptionFill.findOne({ where: { id: cursor.id }, query: fillMetadataQuery }), scope, cursor.id)
    if (anchor.createdAt !== cursor.createdAt || anchor.version !== cursor.version) throw new DomainError('Invalid or stale fill cursor')
    boundary = cursorBoundary(cursor)
  }
  const base = fillReadWhere(scope)
  const records = await q.PrescriptionFill.findMany({ where: { AND: [base, boundary] }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 21, query: fillMetadataQuery })
  const validated = records.map(value => scopedFill(value, scope))
  // Validate sentinel snapshots/related request too before returning hasMore.
  const projections = await Promise.all(validated.map(fill => readFillProjection(context, scope, fill)))
  const page = validated.slice(0, 20)
  const fills = await Promise.all(page.map(async (fill, index) => {
    const projection = projections[index]
    const events = await readEventPage(context, scope, fill, 11)
    const projected = await Promise.all(events.map(event => readEventProjection(context, scope, fill, event, projection.policyVersion)))
    return { ...projection, events: projected.slice(0, 10), hasMoreEvents: events.length > 10 }
  }))
  let canConfigure = false
  if (role.canManageOrganizations === true && role.canApproveConsequentialActions === true) {
    try { await requireTenantMembership(context, { organizationId: scope.organizationId, organizationWide: true, pharmacist: true }); canConfigure = true } catch { /* location-only operators do not configure organization policy */ }
  }
  const items = (p.items as unknown[]).map(record)
  const openItems = await Promise.all(items.map(async item => {
    const value = await q.PrescriptionFill.findOne({ where: { openKey: `item:${item.id}` }, query: fillMetadataQuery })
    if (!value) return null
    const fill = scopedFill(value, scope)
    if (fill.itemId !== item.id || fill.openKey !== `item:${item.id}`) throw readScopeError()
    return fill
  }))
  const last = page.at(-1)
  const totalCount = await q.PrescriptionFill.count({ where: base })
  if (!Number.isSafeInteger(totalCount) || totalCount < validated.length) throw readScopeError()
  return { organizationId: scope.organizationId, policyConfigured: Boolean(record(p.organization).prescriptionFillPolicy && record(record(p.organization).prescriptionFillPolicy).approvalId), canConfigure,
    items: items.map((item, index) => ({ id: item.id, itemVersion: prescriptionItemVersion(p, item), lineage: item.fillLineage || 'legacy',
      originalReservable: item.fillLineage === FILL_LINEAGE && ['approved', 'fill_closed'].includes(String(p.status)) && item.quantityDispensed === 0 && item.refillsRemaining === item.refillsAuthorized && !openItems[index] })),
    fills, totalCount, hasMore: records.length > 20,
    nextCursor: records.length > 20 && last ? writeCursor(scope, 'operator_fill_workbench', last) : null }
}
