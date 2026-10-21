import type { Context } from '.keystone/types'
import { fillStore } from './fillWorkflows'
import { parseFillPolicy, assertFillConservation } from '../workflows/fill-entitlement'
import { FILL_READ_METADATA, EVENT_READ_METADATA, fillReadWhere, eventReadWhere, scopedFill, scopedEvent, record, linkedId, readId, integer, readScopeError, type FillReadScope, type ScopedFill } from '../workflows/fill-read-scope'

// Explicit unknown-return read interface: no generated-schema compatibility claim.
type ReadList = {
  findOne(args: { where: Record<string, unknown>; query: string }): Promise<unknown>
  findMany(args: { where: Record<string, unknown>; query: string; take: number; orderBy: Array<Record<string, string>> }): Promise<unknown[]>
  count(args: { where: Record<string, unknown> }): Promise<number>
}
export const readStore = (context: Context) => fillStore(context) as Record<string, ReadList>
export const fillMetadataQuery = FILL_READ_METADATA
export const eventMetadataQuery = EVENT_READ_METADATA
const equalFill = (a: ScopedFill, b: ScopedFill) => JSON.stringify(a) === JSON.stringify(b)
function tuple(value: unknown, scope: FillReadScope) {
  const r = record(value)
  if (linkedId(r.organization) !== scope.organizationId || linkedId(r.location) !== scope.locationId || linkedId(r.patient) !== scope.patientId || linkedId(r.prescription) !== scope.prescriptionId) throw readScopeError()
  return r
}
export async function readFillProjection(context: Context, scope: FillReadScope, fill: ScopedFill) {
  const q = readStore(context)
  // Only scoped metadata above may authorize this privileged snapshot read.
  const value = record(await q.PrescriptionFill.findOne({ where: { id: fill.id }, query: `${FILL_READ_METADATA} policySnapshot priceSnapshot` }))
  if (!equalFill(scopedFill(value, scope, fill.id), fill)) throw readScopeError()
  const policy = parseFillPolicy(value.policySnapshot), price = record(value.priceSnapshot)
  assertFillConservation({ ...fill, policySnapshot: policy })
  const priceAmount = integer(price.amount), taxAmount = integer(price.taxAmount)
  if (typeof price.currencyCode !== 'string' || !/^[A-Z]{3}$/.test(price.currencyCode) || typeof price.taxable !== 'boolean') throw readScopeError()
  if (fill.refillRequestId) {
    const request = record(await q.RefillRequest.findOne({ where: { id: fill.refillRequestId }, query: 'id prescription { id } prescriptionItem { id } patient { id } location { id }' }))
    if (request.id !== fill.refillRequestId || linkedId(request.prescription) !== scope.prescriptionId || linkedId(request.prescriptionItem) !== fill.itemId || linkedId(request.patient) !== scope.patientId || linkedId(request.location) !== scope.locationId) throw readScopeError()
  }
  return { id: fill.id, prescriptionItemId: fill.itemId, refillRequestId: fill.refillRequestId,
    kind: fill.kind, status: fill.status, version: fill.version, fillNumber: fill.fillNumber, creditState: fill.creditState,
    authorizedQuantity: fill.authorizedQuantity, quantityDispensed: fill.quantityDispensed, quantityReleased: fill.quantityReleased,
    quantityRemaining: fill.authorizedQuantity - fill.quantityDispensed - fill.quantityReleased,
    expiresAt: fill.expiresAt, policyVersion: policy.version, policyReference: policy.reference,
    allowPartial: policy.allowPartial, releaseReasons: policy.releaseReasons,
    priceAmount, taxAmount, currencyCode: price.currencyCode, taxable: price.taxable, itemVersion: fill.itemVersion }
}
export async function readEventProjection(context: Context, scope: FillReadScope, fill: ScopedFill, metadata: unknown, policyVersion: string) {
  const q = readStore(context), event = scopedEvent(metadata, scope, fill)
  const data = record(await q.PrescriptionFillEvent.findOne({ where: { id: event.id }, query: `${EVENT_READ_METADATA} evidence result` }))
  if (JSON.stringify(scopedEvent(data, scope, fill, event.id)) !== JSON.stringify(event)) throw readScopeError()
  const evidence = record(data.evidence), result = record(data.result)
  if (evidence.itemVersion !== fill.itemVersion || evidence.authorityVersion !== fill.authorityVersion || evidence.policyVersion !== policyVersion || (result.fillId != null && result.fillId !== fill.id) || (result.prescriptionId != null && result.prescriptionId !== scope.prescriptionId) || (result.approvalId != null && result.approvalId !== event.approvalId) || (result.version != null && result.version !== event.version) || (result.refillRequestId != null && result.refillRequestId !== fill.refillRequestId) || (evidence.refillRequestId != null && evidence.refillRequestId !== fill.refillRequestId)) throw readScopeError()
  if (evidence.readBindingVersion != null && (evidence.readBindingVersion !== 1 || evidence.purpose !== 'prescription_fill_history' || evidence.fillId !== fill.id || evidence.prescriptionId !== scope.prescriptionId || evidence.prescriptionItemId !== fill.itemId || evidence.organizationId !== scope.organizationId || evidence.locationId !== scope.locationId || evidence.patientId !== scope.patientId || evidence.actorId !== event.actorId || evidence.refillRequestId !== fill.refillRequestId || evidence.fillVersion !== event.version)) throw readScopeError()
  if (event.action === 'clinical_reviewed') {
    const reviewId = readId(evidence.clinicalSafetyReviewId)
    const review = tuple(await q.ClinicalSafetyReview.findOne({ where: { id: reviewId }, query: 'id fillNumber organization { id } location { id } patient { id } prescription { id } pharmacist { id } approval { id }' }), scope)
    if (review.id !== reviewId || review.fillNumber !== fill.fillNumber || linkedId(review.pharmacist) !== event.actorId || linkedId(review.approval) !== event.approvalId) throw readScopeError()
    const detail = record(await q.ClinicalSafetyReview.findOne({ where: { id: reviewId }, query: 'id evidenceSnapshot' }))
    const snapshot = record(detail.evidenceSnapshot)
    if (detail.id !== reviewId || snapshot.fillId !== fill.id || snapshot.fillVersion !== event.version || snapshot.itemVersion !== fill.itemVersion || snapshot.authorityVersion !== fill.authorityVersion || snapshot.requestFingerprint !== event.commandFingerprint) throw readScopeError()
  }
  let reason: string | null = null
  if (event.approvalId) {
    const approval = record(await q.HumanApproval.findOne({ where: { id: event.approvalId }, query: 'id organization { id } location { id } actor { id } actionType attested' }))
    const actionType = event.action === 'dispensed' ? 'dispense' : event.action === 'clinical_reviewed' ? 'clinical_safety_review' : 'prescription_review'
    if (approval.id !== event.approvalId || linkedId(approval.organization) !== scope.organizationId || linkedId(approval.location) !== scope.locationId || linkedId(approval.actor) !== event.actorId || approval.attested !== true || approval.actionType !== actionType) throw readScopeError()
    const bound = record(await q.HumanApproval.findOne({ where: { id: event.approvalId }, query: 'id evidence' }))
    const binding = record(bound.evidence)
    // Old approvals without exact-fill evidence remain historical metadata only;
    // never infer provenance or show their private rationale as this fill's.
    if (binding.fillId != null) {
      if (bound.id !== event.approvalId || binding.fillId !== fill.id || (binding.itemVersion != null && binding.itemVersion !== fill.itemVersion) || (binding.authorityVersion != null && binding.authorityVersion !== fill.authorityVersion)) throw readScopeError()
      const privateApproval = record(await q.HumanApproval.findOne({ where: { id: event.approvalId }, query: 'id reason' }))
      if (privateApproval.id !== event.approvalId || typeof privateApproval.reason !== 'string') throw readScopeError()
      reason = privateApproval.reason
    }
  }
  let orderId: string | null = null, orderNumber: string | null = null
  if (result.orderId != null) {
    if (event.action !== 'dispensed') throw readScopeError()
    const movementId = readId(evidence.movementId)
    const movement = tuple(await q.InventoryMovement.findOne({ where: { id: movementId }, query: 'id requestFingerprint movementType quantityDelta organization { id } location { id } patient { id } prescription { id } prescriptionItem { id } order { id } actor { id } approval { id }' }), scope)
    if (movement.id !== movementId || movement.requestFingerprint !== event.commandFingerprint || movement.movementType !== 'dispense' || movement.quantityDelta !== -event.quantity || linkedId(movement.prescriptionItem) !== fill.itemId || linkedId(movement.actor) !== event.actorId || linkedId(movement.approval) !== event.approvalId || linkedId(movement.order) !== result.orderId) throw readScopeError()
    const id = readId(result.orderId)
    const order = tuple(await q.Order.findOne({ where: { id }, query: 'id organization { id } location { id } patient { id } prescription { id }' }), scope)
    if (order.id !== id) throw readScopeError()
    const receipt = record(await q.Order.findOne({ where: { id }, query: 'id orderNumber' }))
    if (receipt.id !== id || typeof receipt.orderNumber !== 'string' || receipt.orderNumber !== result.orderNumber) throw readScopeError()
    orderId = id; orderNumber = receipt.orderNumber
  }
  return { id: event.id, action: event.action, version: event.version, quantity: event.quantity, occurredAt: event.createdAt, actorName: 'Recorded operator', reason, orderId, orderNumber }
}
export async function readEventPage(context: Context, scope: FillReadScope, fill: ScopedFill, take: number, boundary: Record<string, unknown> = {}) {
  const q = readStore(context)
  const records = await q.PrescriptionFillEvent.findMany({ where: { AND: [eventReadWhere(scope, fill), boundary] }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take, query: EVENT_READ_METADATA })
  // Validate the sentinel too; a foreign 11th/21st record cannot mint pagination.
  records.forEach(value => scopedEvent(value, scope, fill))
  return records
}
export { fillReadWhere }
