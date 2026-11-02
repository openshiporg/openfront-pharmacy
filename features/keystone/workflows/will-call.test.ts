import test from 'node:test'
import assert from 'node:assert/strict'
import { dispenseFillPlan, pickupFillPlan, releaseFillPlan, returnToStockPlan, type FillState } from './fill-entitlement'

const policy = { version: 'qa-v1', reference: 'qa', consumeOn: 'first_dispense', allowPartial: false, reservationMinutes: 60, releaseReasons: ['cancelled', 'no_pickup', 'expired'] } as const
const approvedRefill = (): FillState => ({ status: 'approved', version: 3, kind: 'refill', creditState: 'reserved', authorizedQuantity: 21, quantityDispensed: 0, quantityReleased: 0,
  expiresAt: new Date(Date.now() + 3_600_000).toISOString(), policySnapshot: { ...policy, releaseReasons: [...policy.releaseReasons] } })

// Mirrors the counters the mutations write: lot units, item refills, label state.
type Store = { lot: number; refillsRemaining: number; refillsReserved: number; labelVoided: boolean | null; sales: number }
const fresh = (): Store => ({ lot: 100, refillsRemaining: 2, refillsReserved: 1, labelVoided: null, sales: 0 })
function fillToWillCall(f: FillState, s: Store) {
  const plan = dispenseFillPlan(f, f.version, f.authorizedQuantity, Date.now(), true)
  if (plan.debitRefill) { s.refillsReserved -= 1; s.refillsRemaining -= 1 }
  s.lot -= f.authorizedQuantity; s.labelVoided = false
  const { debitRefill, ...data } = plan
  return { ...f, ...data } as FillState
}
function pickup(f: FillState, s: Store) { const plan = pickupFillPlan(f, f.version); s.sales += 1; return { ...f, ...plan } as FillState }
function returnToStock(f: FillState, s: Store, returned: boolean) {
  const plan = returnToStockPlan(f, f.version, 'no_pickup', returned)
  if (plan.noop) return { fill: f, noop: true }
  s.lot += plan.unitsRestocked
  if (plan.restoreRefill) { s.refillsRemaining += 1; s.refillsReserved += 1 }
  if (plan.release.releaseRefill) s.refillsReserved -= 1
  s.labelVoided = true
  const { releaseRefill, ...data } = plan.release
  return { fill: { ...f, ...data, ...plan.data } as FillState, noop: false }
}

test('dispense -> ready -> pickup: stock and refill consumed once, one sale', () => {
  const s = fresh()
  const ready = fillToWillCall(approvedRefill(), s)
  assert.equal(ready.status, 'ready'); assert.equal(ready.creditState, 'consumed')
  assert.deepEqual([s.lot, s.refillsRemaining, s.refillsReserved, s.sales], [79, 1, 0, 0])
  const done = pickup(ready, s)
  assert.equal(done.status, 'dispensed'); assert.equal(done.version, ready.version + 1)
  assert.deepEqual([s.lot, s.refillsRemaining, s.sales, s.labelVoided], [79, 1, 1, false])
})

test('dispense -> ready -> return to stock: stock and refill restored, label voided', () => {
  const s = fresh()
  const ready = fillToWillCall(approvedRefill(), s)
  const { fill } = returnToStock(ready, s, false)
  assert.equal(fill.status, 'released'); assert.equal(fill.creditState, 'released')
  assert.equal(fill.quantityDispensed, 0); assert.equal(fill.quantityReleased, 21)
  assert.deepEqual([s.lot, s.refillsRemaining, s.refillsReserved, s.labelVoided, s.sales], [100, 2, 0, true, 0])
})

test('double return to stock is a no-op', () => {
  const s = fresh()
  const first = returnToStock(fillToWillCall(approvedRefill(), s), s, false)
  const snapshot = { ...s }
  const second = returnToStock(first.fill, s, true)
  assert.equal(second.noop, true)
  assert.deepEqual(s, snapshot)
})

test('return to stock is refused after pickup', () => {
  const s = fresh()
  const done = pickup(fillToWillCall(approvedRefill(), s), s)
  assert.throws(() => returnToStock(done, s, false), /Picked-up fills cannot be returned to stock/)
  assert.deepEqual([s.lot, s.refillsRemaining], [79, 1])
})

test('a will-call fill cannot be released, picked up twice, or partially held', () => {
  const s = fresh()
  const ready = fillToWillCall(approvedRefill(), s)
  assert.throws(() => releaseFillPlan(ready, ready.version, 'no_pickup'), /returned to stock, not released/)
  const done = pickup(ready, s)
  assert.throws(() => pickupFillPlan(done, done.version), /Only a filled will-call fill/)
  assert.throws(() => dispenseFillPlan(approvedRefill(), 3, 10, Date.now(), true), /Partial dispensing|Will-call holds one complete fill/)
})

test('direct dispense (no will-call) is unchanged', () => {
  const plan = dispenseFillPlan(approvedRefill(), 3, 21)
  assert.equal(plan.status, 'dispensed'); assert.equal(plan.debitRefill, true)
})
