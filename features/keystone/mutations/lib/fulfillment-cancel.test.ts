import { test } from 'node:test'
import assert from 'node:assert/strict'
import { availableFulfillmentTransitions, canCancelFulfillment } from './fulfillment-cancel'

test('a captured payment blocks cancellation until it is refunded', () => {
  assert.equal(canCancelFulfillment('preparing', ['captured']), false)
  assert.equal(canCancelFulfillment('preparing', ['refund_pending']), false)
  assert.equal(canCancelFulfillment('preparing', ['pending']), false)
  assert.equal(canCancelFulfillment('preparing', ['refunded']), true)
  assert.equal(canCancelFulfillment('ready', ['failed', 'refunded']), true)
  assert.equal(canCancelFulfillment('preparing', []), true)
})

test('finished fulfillments cannot be cancelled', () => {
  assert.equal(canCancelFulfillment('handed_off', ['refunded']), false)
  assert.equal(canCancelFulfillment('cancelled', ['refunded']), false)
  assert.equal(canCancelFulfillment(null, []), false)
})

test('cancel is offered after the forward step only when allowed', () => {
  assert.deepEqual(availableFulfillmentTransitions('preparing', ['captured']), ['ready'])
  assert.deepEqual(availableFulfillmentTransitions('preparing', ['refunded']), ['cancelled'])
  assert.deepEqual(availableFulfillmentTransitions('preparing', ['failed', 'refunded']), ['cancelled'])
  assert.deepEqual(availableFulfillmentTransitions('preparing', ['failed']), ['ready', 'cancelled'])
  assert.deepEqual(availableFulfillmentTransitions('handed_off', ['refunded']), [])
})
