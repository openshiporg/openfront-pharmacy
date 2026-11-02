import { createHash } from 'node:crypto'

export const FILL_LINEAGE = 'per_fill_v1'
export type FillPolicy = {
  version: string
  reference: string
  consumeOn: 'first_dispense'
  allowPartial: boolean
  reservationMinutes: number
  releaseReasons: Array<'cancelled' | 'no_pickup' | 'expired'>
}
export function fillHash(value: unknown): string {
  const canonical = (v: any): any => Array.isArray(v) ? v.map(canonical) : v && typeof v === 'object'
    ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canonical(v[k])])) : v ?? null
  return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex')
}
export function parseFillPolicy(value: any): FillPolicy {
  if (!value || typeof value.version !== 'string' || !value.version.trim() || value.version.length > 100
    || typeof value.reference !== 'string' || !value.reference.trim() || value.reference.length > 1000
    || value.consumeOn !== 'first_dispense' || typeof value.allowPartial !== 'boolean'
    || !Number.isSafeInteger(value.reservationMinutes) || value.reservationMinutes < 1 || value.reservationMinutes > 525600
    || !Array.isArray(value.releaseReasons) || !value.releaseReasons.length
    || value.releaseReasons.some((r: string) => !['cancelled', 'no_pickup', 'expired'].includes(r))) {
    throw new Error('Versioned pharmacist-reviewed fill policy is required; no clinical policy is inferred')
  }
  return { version: value.version.trim(), reference: value.reference.trim(), consumeOn: 'first_dispense',
    allowPartial: value.allowPartial, reservationMinutes: value.reservationMinutes,
    releaseReasons: [...new Set(value.releaseReasons)] as FillPolicy['releaseReasons'] }
}
/** Content version, not mutable dispensing counters or a timestamp-only version. */
export function prescriptionItemVersion(p: any, item: any) {
  return fillHash({ prescriptionId: p.id, organizationId: p.organization?.id, locationId: p.location?.id,
    patientId: p.patient?.id, prescriberId: p.prescriber?.id, itemId: item.id,
    productId: item.product?.id, drugReferenceId: item.drugReference?.id, medicationName: item.medicationNameSnapshot,
    sig: item.sig, quantity: item.quantityPrescribed, daysSupply: item.daysSupply,
    refillsAuthorized: item.refillsAuthorized, substitutionAllowed: item.substitutionAllowed })
}
export function prescriptionAuthorityVersion(p: any) {
  return fillHash({ sourceVerificationStatus: p.sourceVerificationStatus, writtenAt: p.writtenAt, expiresAt: p.expiresAt,
    prescriber: p.prescriber, patient: { id: p.patient?.id, identityVerificationStatus: p.patient?.identityVerificationStatus,
      identityReference: p.patient?.identityReference, identityVerifiedAt: p.patient?.identityVerifiedAt,
      identityVerifiedBy: p.patient?.identityVerifiedBy } })
}
export type FillState = {
  status: string; version: number; kind: string; creditState: string
  authorizedQuantity: number; quantityDispensed: number; quantityReleased: number
  expiresAt: string; policySnapshot: FillPolicy
}
export function assertFillConservation(f: FillState) {
  for (const v of [f.version, f.authorizedQuantity, f.quantityDispensed, f.quantityReleased]) {
    if (!Number.isSafeInteger(v) || v < 0 || v > 2147483647) throw new Error('Fill counters require reconciliation')
  }
  if (f.authorizedQuantity < 1 || f.version < 1 || f.version >= 2147483647 || f.quantityDispensed + f.quantityReleased > f.authorizedQuantity) throw new Error('Fill quantity conservation violated')
  if (!['original', 'refill'].includes(f.kind) || !['reserved', 'consumed', 'released'].includes(f.creditState)) throw new Error('Fill entitlement evidence is invalid')
  if ((f.quantityDispensed > 0) !== (f.creditState === 'consumed')) throw new Error('Dispensed quantity must retain exactly one consumed entitlement')
  if (!['requested', 'approved', 'partially_dispensed', 'ready', 'dispensed', 'released'].includes(f.status) || (f.creditState === 'released' && f.status !== 'released')) throw new Error('Fill lifecycle evidence is invalid')
  if (['requested', 'approved'].includes(f.status) && (f.quantityDispensed !== 0 || f.quantityReleased !== 0 || f.creditState !== 'reserved')) throw new Error('Unconsumed reservation evidence is invalid')
  if (f.status === 'partially_dispensed' && (f.quantityDispensed < 1 || f.quantityDispensed >= f.authorizedQuantity || f.quantityReleased !== 0)) throw new Error('Partial fill evidence is invalid')
  if (['ready', 'dispensed'].includes(f.status) && (f.quantityDispensed !== f.authorizedQuantity || f.quantityReleased !== 0)) throw new Error('Completed fill evidence is invalid')
  if (['ready', 'dispensed', 'released'].includes(f.status) && f.quantityDispensed + f.quantityReleased !== f.authorizedQuantity) throw new Error('Closed fill must account for every authorized unit')
}
/** hold=true fills into will-call: stock leaves the shelf and the refill is consumed, but no sale/handoff exists yet. */
export function dispenseFillPlan(f: FillState, expectedVersion: number, quantity: number, now = Date.now(), hold = false) {
  assertFillConservation(f)
  if (f.version !== expectedVersion) throw new Error('Fill version changed; refresh the workbench')
  if (!['approved', 'partially_dispensed'].includes(f.status)) throw new Error('Fill is not approved for dispensing')
  const expiry = new Date(f.expiresAt).getTime()
  if (!Number.isFinite(expiry) || expiry <= now) throw new Error('Fill reservation expired; record an authorized release')
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > f.authorizedQuantity - f.quantityDispensed - f.quantityReleased) throw new Error('Quantity exceeds this fill reservation')
  const policy = parseFillPolicy(f.policySnapshot)
  if (!policy.allowPartial && quantity !== f.authorizedQuantity - f.quantityDispensed) throw new Error('Partial dispensing is not admitted by the recorded fill policy')
  const quantityDispensed = f.quantityDispensed + quantity
  if (hold && (f.quantityDispensed !== 0 || quantityDispensed !== f.authorizedQuantity)) throw new Error('Will-call holds one complete fill; partial fills are handed off directly')
  return { quantityDispensed, creditState: 'consumed', version: f.version + 1,
    status: hold ? 'ready' : quantityDispensed === f.authorizedQuantity ? 'dispensed' : 'partially_dispensed',
    debitRefill: f.kind === 'refill' && f.creditState === 'reserved' }
}
export function releaseFillPlan(f: FillState, expectedVersion: number, cause: string, now = Date.now()) {
  assertFillConservation(f)
  if (f.version !== expectedVersion) throw new Error('Fill version changed; refresh the workbench')
  if (f.status === 'ready') throw new Error('A filled will-call fill is returned to stock, not released')
  if (!['requested', 'approved', 'partially_dispensed'].includes(f.status)) throw new Error('Fill is already closed')
  if (!parseFillPolicy(f.policySnapshot).releaseReasons.includes(cause as any)) throw new Error('Release reason is not admitted by the recorded fill policy')
  if (cause === 'expired' && (!Number.isFinite(new Date(f.expiresAt).getTime()) || new Date(f.expiresAt).getTime() > now)) throw new Error('Reservation has not expired')
  return { status: 'released', version: f.version + 1,
    quantityReleased: f.authorizedQuantity - f.quantityDispensed,
    creditState: f.creditState === 'consumed' ? 'consumed' : 'released',
    releaseRefill: f.kind === 'refill' && f.creditState === 'reserved' }
}
/** Will-call pickup: the sale/handoff of an already-filled, labelled fill. Counters do not move. */
export function pickupFillPlan(f: FillState, expectedVersion: number) {
  assertFillConservation(f)
  if (f.version !== expectedVersion) throw new Error('Fill version changed; refresh the workbench')
  if (f.status !== 'ready') throw new Error('Only a filled will-call fill can be picked up')
  return { status: 'dispensed', version: f.version + 1 }
}
/**
 * Return to stock: reverse a will-call fill that was never picked up. Filling is undone
 * (units back to the lot, a consumed refill becomes reserved again) and the result goes
 * through releaseFillPlan, so the refill is restored by the same rule a release uses.
 * A fill already returned is a no-op; a picked-up fill is refused because the
 * medication has left the pharmacy.
 */
export function returnToStockPlan(f: FillState, expectedVersion: number, cause: string, alreadyReturned = false, now = Date.now()) {
  assertFillConservation(f)
  if (alreadyReturned && f.status === 'released') return { noop: true as const }
  if (f.status === 'dispensed') throw new Error('Picked-up fills cannot be returned to stock')
  if (f.status !== 'ready') throw new Error('Only a filled will-call fill can be returned to stock')
  if (f.version !== expectedVersion) throw new Error('Fill version changed; refresh the workbench')
  const unconsumed: FillState = { ...f, status: 'approved', quantityDispensed: 0, creditState: 'reserved' }
  const release = releaseFillPlan(unconsumed, f.version, cause, now)
  return { noop: false as const, unitsRestocked: f.quantityDispensed, restoreRefill: f.kind === 'refill', release, data: { quantityDispensed: 0 } }
}
export { fillPricePortion } from './fill-price'
