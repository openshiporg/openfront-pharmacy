import assert from 'node:assert/strict'
import test from 'node:test'
import { canMovePayment, canMovePaymentSession, excursionDispositionError, lotAfterExcursionDisposition, lotStatusAfterAdjustment, QUARANTINABLE_LOT_STATUSES } from './pharmacy-state'
import { validateMovementSign } from '../hooks/inventory-movement'

test('a late webhook cannot revive a compensated session or step back from captured', () => {
  assert.equal(canMovePaymentSession('compensated', 'settled_unordered'), false)
  assert.equal(canMovePaymentSession('compensated', 'failed'), false)
  assert.equal(canMovePaymentSession('captured', 'failed'), false)
  assert.equal(canMovePaymentSession('captured', 'settled_unordered'), false)
  assert.equal(canMovePaymentSession('compensation_pending', 'failed'), false)
})

test('real money arriving after a failure or cancel still surfaces for reconciliation', () => {
  assert.equal(canMovePaymentSession('failed', 'settled_unordered'), true)
  assert.equal(canMovePaymentSession('cancelled', 'settled_unordered'), true)
})

test('normal session path still works and repeats are harmless', () => {
  assert.equal(canMovePaymentSession('pending', 'settled_unordered'), true)
  assert.equal(canMovePaymentSession('settled_unordered', 'captured'), true)
  assert.equal(canMovePaymentSession('captured', 'captured'), true)
  assert.equal(canMovePaymentSession('settled_unordered', 'failed'), false)
})

test('a refunded payment is final; captured can only be refunded', () => {
  assert.equal(canMovePayment('refunded', 'captured'), false)
  assert.equal(canMovePayment('captured', 'refunded'), true)
  assert.equal(canMovePayment('captured', 'pending'), false)
  assert.equal(canMovePayment('cancelled', 'captured'), false)
})

test('a stock count revives a depleted lot and never downgrades a held one', () => {
  assert.equal(lotStatusAfterAdjustment('depleted', 5), 'available')
  assert.equal(lotStatusAfterAdjustment('available', 0), 'depleted')
  assert.equal(lotStatusAfterAdjustment('quarantined', 0), null)
  assert.equal(lotStatusAfterAdjustment('quarantined', 3), null)
  assert.equal(lotStatusAfterAdjustment('recalled', 0), null)
  assert.equal(lotStatusAfterAdjustment('available', 4), null)
})

test('only available or already quarantined lots can be quarantined by an excursion', () => {
  assert.deepEqual([...QUARANTINABLE_LOT_STATUSES], ['available', 'quarantined'])
})

test('excursion disposition: released returns stock unless recalled or expired, destroyed writes it off', () => {
  const future = new Date(Date.now() + 90 * 86_400_000)
  const base = { excursionStatus: 'open', note: 'Data logger reviewed; within stability data', lotStatus: 'quarantined', lotExpiresAt: future }
  assert.equal(excursionDispositionError({ ...base, disposition: 'released' }), null)
  assert.equal(excursionDispositionError({ ...base, disposition: 'destroyed' }), null)
  assert.match(excursionDispositionError({ ...base, disposition: 'released', lotStatus: 'recalled' })!, /recalled lot cannot be released/)
  assert.match(excursionDispositionError({ ...base, disposition: 'released', lotExpiresAt: new Date(Date.now() - 1000) })!, /expired lot cannot be released/)
  assert.match(excursionDispositionError({ ...base, disposition: 'released', lotStatus: 'expired' })!, /expired lot/)
  assert.match(excursionDispositionError({ ...base, disposition: 'released', note: ' ' })!, /note/)
  assert.match(excursionDispositionError({ ...base, disposition: 'destroyed', excursionStatus: 'released' })!, /already closed/)
  assert.match(excursionDispositionError({ ...base, disposition: 'quarantine' })!, /released or destroyed/)
  assert.deepEqual(lotAfterExcursionDisposition('destroyed', { quantityAvailable: 12 }, 0), { status: 'depleted', quantityAvailable: 0, quantityQuarantined: 0, writeOff: 12 })
  assert.deepEqual(lotAfterExcursionDisposition('released', { quantityAvailable: 12 }, 0), { status: 'available', quantityAvailable: 12, quantityQuarantined: 0, writeOff: 0 })
  assert.equal(lotAfterExcursionDisposition('released', { quantityAvailable: 12 }, 1).status, 'quarantined')
})

test('releasing a quarantine hold is a zero-quantity release; other releases still add stock', () => {
  assert.doesNotThrow(() => validateMovementSign('release', 0))
  assert.doesNotThrow(() => validateMovementSign('release', 3))
  assert.throws(() => validateMovementSign('release', -1), /must increase quantity/)
  assert.throws(() => validateMovementSign('receive', 0), /must increase quantity/)
  assert.throws(() => validateMovementSign('destroy', 0), /must reduce quantity/)
})
