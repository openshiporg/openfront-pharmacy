// Read-side DTO validation, not generated Keystone types or clinical admission.
// Historical versions are compared to their own immutable event lineage, never
// to today's prescriber/item hash. Reads cannot grant spendable authority.
export const readScopeError = () => new Error('Fill evidence scope requires reconciliation')
export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw readScopeError()
  return value as Record<string, unknown>
}
export function readId(value: unknown): string {
  if (typeof value !== 'string' || !value || value.length > 200 || !/^[A-Za-z0-9:_-]+$/.test(value)) throw readScopeError()
  return value
}
export const linkedId = (value: unknown) => readId(record(value).id)
export function integer(value: unknown, min = 0): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > 2147483647) throw readScopeError()
  return value
}
export function timestamp(value: unknown): string {
  if (typeof value !== 'string' || !Number.isFinite(new Date(value).getTime())) throw readScopeError()
  return value
}
function hash(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) throw readScopeError()
  return value
}
export type FillReadScope = { prescriptionId: string; organizationId: string; locationId: string; patientId: string; prescriberId: string; itemIds: string[] }
export function prescriptionReadScope(value: unknown, expectedId: string): FillReadScope {
  const p = record(value)
  if (p.id !== expectedId || !Array.isArray(p.items) || !p.items.length) throw readScopeError()
  const itemIds = p.items.map(value => {
    const item = record(value)
    if (linkedId(item.prescription) !== p.id) throw readScopeError()
    return readId(item.id)
  })
  if (new Set(itemIds).size !== itemIds.length || linkedId(record(p.prescriber).organization) !== linkedId(p.organization)) throw readScopeError()
  return { prescriptionId: readId(p.id), organizationId: linkedId(p.organization), locationId: linkedId(p.location), patientId: linkedId(p.patient), prescriberId: linkedId(p.prescriber), itemIds }
}
export const FILL_READ_METADATA = 'id requestFingerprint openKey status kind version fillNumber creditState authorizedQuantity quantityDispensed quantityReleased itemVersion authorityVersion expiresAt createdAt prescription { id } prescriptionItem { id prescription { id } } organization { id } location { id } patient { id } refillRequest { id } reservedBy { id }'
export type ScopedFill = ReturnType<typeof scopedFill>
export function scopedFill(value: unknown, scope: FillReadScope, expectedId?: string) {
  const f = record(value), id = readId(f.id), itemId = linkedId(f.prescriptionItem)
  if ((expectedId && id !== expectedId) || linkedId(record(f.prescriptionItem).prescription) !== scope.prescriptionId || linkedId(f.prescription) !== scope.prescriptionId || linkedId(f.organization) !== scope.organizationId || linkedId(f.location) !== scope.locationId || linkedId(f.patient) !== scope.patientId || !scope.itemIds.includes(itemId)) throw readScopeError()
  const version = integer(f.version, 1), fillNumber = integer(f.fillNumber, 1)
  const authorizedQuantity = integer(f.authorizedQuantity, 1), quantityDispensed = integer(f.quantityDispensed), quantityReleased = integer(f.quantityReleased)
  if (quantityDispensed + quantityReleased > authorizedQuantity || !['original', 'refill'].includes(String(f.kind)) || !['requested', 'approved', 'partially_dispensed', 'dispensed', 'released'].includes(String(f.status)) || !['reserved', 'consumed', 'released'].includes(String(f.creditState))) throw readScopeError()
  return { id, itemId, reservedById: linkedId(f.reservedBy), version, fillNumber, authorizedQuantity, quantityDispensed, quantityReleased, kind: String(f.kind), status: String(f.status), creditState: String(f.creditState), openKey: f.openKey,
    itemVersion: hash(f.itemVersion), authorityVersion: hash(f.authorityVersion), requestFingerprint: hash(f.requestFingerprint), createdAt: timestamp(f.createdAt), expiresAt: timestamp(f.expiresAt), refillRequestId: f.refillRequest ? linkedId(f.refillRequest) : null }
}
export function fillReadWhere(scope: FillReadScope) {
  return { prescription: { id: { equals: scope.prescriptionId } }, prescriptionItem: { id: { in: scope.itemIds }, prescription: { id: { equals: scope.prescriptionId } } }, organization: { id: { equals: scope.organizationId } }, location: { id: { equals: scope.locationId } }, patient: { id: { equals: scope.patientId } } }
}
export const EVENT_READ_METADATA = `id commandFingerprint action version quantity createdAt actor { id } approval { id } prescription { id } fill { ${FILL_READ_METADATA} }`
export function scopedEvent(value: unknown, scope: FillReadScope, fill: ScopedFill, expectedId?: string) {
  const e = record(value), id = readId(e.id), linked = scopedFill(e.fill, scope, fill.id)
  if ((expectedId && id !== expectedId) || linkedId(e.prescription) !== scope.prescriptionId || linked.itemId !== fill.itemId || linked.version !== fill.version || linked.itemVersion !== fill.itemVersion || linked.authorityVersion !== fill.authorityVersion) throw readScopeError()
  const version = integer(e.version, 1)
  if (version > fill.version || !['reserved', 'approved', 'rejected', 'released', 'dispensed', 'clinical_reviewed'].includes(String(e.action))) throw readScopeError()
  const quantity = integer(e.quantity)
  if (e.action === 'dispensed' ? quantity < 1 || quantity > fill.quantityDispensed : e.action === 'released' ? quantity > fill.quantityReleased : quantity !== 0) throw readScopeError()
  const commandFingerprint = hash(e.commandFingerprint)
  if (e.action === 'reserved' && (commandFingerprint !== fill.requestFingerprint || linkedId(e.actor) !== fill.reservedById)) throw readScopeError()
  return { id, action: String(e.action), version, commandFingerprint, quantity, createdAt: timestamp(e.createdAt), actorId: linkedId(e.actor), approvalId: e.approval ? linkedId(e.approval) : null }
}
export function eventReadWhere(scope: FillReadScope, fill: ScopedFill) {
  return { fill: { ...fillReadWhere(scope), id: { equals: fill.id } }, prescription: { id: { equals: scope.prescriptionId } }, version: { gte: 1, lte: fill.version } }
}
export function sameScope(left: FillReadScope, right: FillReadScope) {
  return left.prescriptionId === right.prescriptionId && left.organizationId === right.organizationId && left.locationId === right.locationId && left.patientId === right.patientId && left.prescriberId === right.prescriberId && left.itemIds.length === right.itemIds.length && left.itemIds.every(id => right.itemIds.includes(id))
}
export function readCursor(after: string, scope: FillReadScope, purpose: string, fillId?: string) {
  if (after.length > 2000) throw new Error('Invalid scoped cursor')
  try {
    const c = record(JSON.parse(Buffer.from(after, 'base64url').toString()))
    if (c.purpose !== purpose || c.fillId !== fillId || !sameScope(record(c.scope) as FillReadScope, scope)) throw Error()
    return { id: readId(c.id), createdAt: timestamp(c.createdAt), version: integer(c.version, 1) }
  } catch { throw new Error('Invalid scoped cursor') }
}
export function writeCursor(scope: FillReadScope, purpose: string, row: { id: string; createdAt: string; version: number }, fillId?: string) {
  return Buffer.from(JSON.stringify({ scope, purpose, fillId, ...row })).toString('base64url')
}
export const cursorBoundary = (c: { id: string; createdAt: string }) => ({ OR: [{ createdAt: { lt: c.createdAt } }, { createdAt: { equals: c.createdAt }, id: { lt: c.id } }] })
