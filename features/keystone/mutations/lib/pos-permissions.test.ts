import { test } from 'node:test'
import assert from 'node:assert/strict'
import { submitPharmacyPosCashOrder } from '../cashWorkflows'

// The role that opens the counter card (orders + payments) must be able to record the sale it paid for,
// otherwise the card is charged and then refunded. The Cashier role holds exactly those two permissions.
function sessionFor(role: Record<string, boolean>) {
  const context: any = { session: { itemId: 'u1', data: { role } }, sudo: () => { throw new Error('reached sale') } }
  return context
}
const args: any = { locationId: 'l', items: [], cashReceivedAmount: 0, idempotencyKey: 'k', reason: 'r', attested: true, tenderMethod: 'cash' }

test('a Cashier gets past the permission check of a POS sale', async () => {
  await assert.rejects(() => submitPharmacyPosCashOrder(null, args, sessionFor({ canManageOrders: true, canManagePayments: true })), (error: Error) => !/Permission required/.test(error.message))
})

test('a role without payments is still refused', async () => {
  await assert.rejects(() => submitPharmacyPosCashOrder(null, args, sessionFor({ canManageOrders: true })), /Permission required: canManagePayments/)
})
