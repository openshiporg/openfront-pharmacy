import assert from 'node:assert/strict'
import test from 'node:test'
import { canMovePayment, canMovePaymentSession, lotStatusAfterAdjustment, QUARANTINABLE_LOT_STATUSES } from './pharmacy-state'

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
