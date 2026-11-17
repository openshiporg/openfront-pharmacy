import test from 'node:test'
import assert from 'node:assert/strict'
import { lotSafeToHandOver } from './lot-eligibility'

const future = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10)
const past = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10)

test('drawn units from a depleted, in-date, unrecalled lot can be handed over', () => {
  assert.equal(lotSafeToHandOver({ status: 'depleted', expirationDate: future, recalls: [] }), true)
  assert.equal(lotSafeToHandOver({ status: 'available', expirationDate: future, recalls: [{ status: 'closed' }] }), true)
})

test('recalled, quarantined or expired lots cannot be handed over', () => {
  assert.equal(lotSafeToHandOver({ status: 'recalled', expirationDate: future }), false)
  assert.equal(lotSafeToHandOver({ status: 'quarantined', expirationDate: future }), false)
  assert.equal(lotSafeToHandOver({ status: 'depleted', expirationDate: past }), false)
  assert.equal(lotSafeToHandOver({ status: 'depleted', expirationDate: future, recalls: [{ status: 'active' }] }), false)
})
