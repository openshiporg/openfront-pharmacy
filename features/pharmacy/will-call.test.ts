import test from 'node:test'
import assert from 'node:assert/strict'
import { fillLabel } from './fills'
import { willCallDays, willCallDue, willCallException, willCallWhere } from './will-call'

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

// Will-call aging against a fixed clock. `matches` interprets the Keystone filter operators the queue uses
// (equals, null, lte, some, OR, nested relations) so the test runs the exact `where` the worklist sends.
const NOW = Date.parse('2026-11-20T12:00:00.000Z')
const daysAgo = (days: number) => new Date(NOW - days * 86_400_000).toISOString()
function matches(record: any, where: any): boolean {
  return Object.entries(where).every(([key, condition]: [string, any]) => {
    if (key === 'OR') return condition.some((branch: any) => matches(record, branch))
    const value = record[key]
    if (condition === null) return value === null || value === undefined
    if (condition.some) return (value || []).some((entry: any) => matches(entry, condition.some))
    if ('equals' in condition) return value === condition.equals
    if ('lte' in condition) return value !== null && value !== undefined && value <= condition.lte
    return matches(value || {}, condition)
  })
}
const store = { id: 'org-1', willCallReturnDays: 10 }
const rx = (id: string, label: Record<string, unknown>, status = 'ready_for_pickup') => ({ id, status, organization: { id: 'org-1' }, dispensingLabels: [{ voidedAt: null, order: null, ...label }] })
const queue = [
  rx('3-day', { dispensedAt: daysAgo(3) }),
  rx('8-day', { dispensedAt: daysAgo(8) }),
  rx('11-day', { dispensedAt: daysAgo(11) }),
  rx('voided', { dispensedAt: daysAgo(12), voidedAt: daysAgo(1) }),
  rx('sold', { dispensedAt: daysAgo(12), order: { id: 'order-1' } }, 'dispensed'),
  rx('sold-still-ready', { dispensedAt: daysAgo(12), order: { id: 'order-2' } }),
]
const ids = (where: any) => queue.filter((record) => matches(record, where)).map((record) => record.id)

test('Ready > 7 days: 8- and 11-day labels only; a 3-day label, a voided label and a sold label are excluded', () => {
  assert.deepEqual(ids(willCallWhere('7', [store], NOW)), ['8-day', '11-day'])
})

test('Past return date with N=10: only the 11-day label, and it carries the review exception', () => {
  assert.deepEqual(ids(willCallWhere('due', [store], NOW)), ['11-day'])
  assert.equal(willCallException(daysAgo(11), 10, NOW), 'In will-call 11 days: review for return to stock')
  assert.equal(willCallException(daysAgo(8), 10, NOW), null)
  assert.equal(willCallException(daysAgo(3), 10, NOW), null)
  assert.equal(willCallException(null, 10, NOW), null)
})

test('Past return date follows each store\'s own N', () => {
  assert.deepEqual(ids(willCallWhere('due', [{ id: 'org-1', willCallReturnDays: 3 }], NOW)), ['3-day', '8-day', '11-day'])
  assert.deepEqual(ids(willCallWhere('due', [{ id: 'org-2', willCallReturnDays: 1 }], NOW)), [])
  assert.deepEqual(ids(willCallWhere('due', [{ id: 'org-1', willCallReturnDays: null }], NOW)), ['11-day'])
})
