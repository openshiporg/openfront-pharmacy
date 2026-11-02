import test from 'node:test'
import assert from 'node:assert/strict'
import { fillLabel } from './fills'
import { willCallDays, willCallDue } from './will-call'

test('a returned fill and the fill that reuses its refill number read differently', () => {
  const returned = fillLabel({ fillNumber: 3, attempt: 1, status: 'released', events: [{ action: 'returned_to_stock' }, { action: 'filled' }] })
  const next = fillLabel({ fillNumber: 3, attempt: 2, status: 'dispensed', events: [{ action: 'picked_up' }] })
  assert.equal(returned, 'Fill 3 · returned')
  assert.equal(next, 'Fill 3 (2nd)')
  assert.notEqual(returned, next)
})

test('ordinary fills keep their plain number; a released (not returned) fill is not called returned', () => {
  assert.equal(fillLabel({ fillNumber: 1, attempt: 1, status: 'dispensed' }), 'Fill 1')
  assert.equal(fillLabel({ fillNumber: 2, attempt: 1, status: 'released', events: [{ action: 'released' }] }), 'Fill 2')
  assert.equal(fillLabel({ fillNumber: 4, attempt: 3, status: 'ready' }), 'Fill 4 (3rd)')
  assert.equal(fillLabel({ fillNumber: 4, attempt: 11, status: 'ready' }), 'Fill 4 (11th)')
})

test('days in will-call count whole days from the label and flag the store setting day', () => {
  const now = Date.parse('2026-11-20T12:00:00Z')
  assert.equal(willCallDays(null, now), null)
  assert.equal(willCallDays('2026-11-20T08:00:00Z', now), 0)
  assert.equal(willCallDays('2026-11-12T12:00:00Z', now), 8)
  assert.equal(willCallDue('2026-11-12T12:00:00Z', 10, now), false)
  assert.equal(willCallDue('2026-11-10T12:00:00Z', 10, now), true)
  assert.equal(willCallDue(null, 10, now), false)
})
