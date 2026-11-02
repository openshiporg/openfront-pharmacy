import { test } from 'node:test'
import assert from 'node:assert/strict'
import { plural } from './plural'

test('plural picks the singular only for exactly one', () => {
  assert.equal(plural(1, 'line item'), '1 line item')
  assert.equal(plural(0, 'line item'), '0 line items')
  assert.equal(plural(3, 'active recall link'), '3 active recall links')
  assert.equal(plural(2, 'person', 'people'), '2 people')
})
