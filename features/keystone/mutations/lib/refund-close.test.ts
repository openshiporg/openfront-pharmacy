import { test } from 'node:test'
import assert from 'node:assert/strict'
import { closeOrderAfterRefund } from '../paymentOperations'

function fixture(order: any) {
  const updates: Record<string, any[]> = { Order: [], Fulfillment: [], PaymentSession: [], AuditEvent: [] }
  const query: any = {
    Order: { findOne: async () => order, updateOne: async ({ data }: any) => { updates.Order.push(data); return { id: order.id } } },
    Fulfillment: { updateOne: async ({ data }: any) => { updates.Fulfillment.push(data); return { id: 'f' } } },
    PaymentSession: { updateOne: async ({ data }: any) => { updates.PaymentSession.push(data); return { id: 's' } } },
    AuditEvent: { findOne: async () => null, createOne: async ({ data }: any) => { updates.AuditEvent.push(data); return { id: 'a' } } },
  }
  const context: any = { query }
  context.sudo = () => context
  return { context, updates }
}

const base = { id: 'o', organization: { id: 'org' }, location: { id: 'loc' }, patient: null }

test('a full refund of a preparing order cancels it and marks the checkout session refunded', async () => {
  const { context, updates } = fixture({ ...base, status: 'processing', fulfillment: { id: 'f', status: 'preparing' }, payments: [{ id: 'p', status: 'refunded', session: { id: 's', status: 'captured' } }] })
  await closeOrderAfterRefund(context, 'o', 'u')
  assert.deepEqual(updates.Order, [{ status: 'cancelled' }])
  assert.deepEqual(updates.Fulfillment, [{ status: 'cancelled' }])
  assert.equal(updates.PaymentSession[0].status, 'refunded')
  assert.equal(updates.AuditEvent[0].eventType, 'order.refunded')
})

test('a refund after handoff leaves the completed order alone', async () => {
  const { context, updates } = fixture({ ...base, status: 'completed', fulfillment: { id: 'f', status: 'handed_off' }, payments: [{ id: 'p', status: 'refunded', session: null }] })
  await closeOrderAfterRefund(context, 'o', 'u')
  assert.deepEqual(updates.Order, [])
  assert.deepEqual(updates.Fulfillment, [])
})

test('an order with another payment still captured stays open', async () => {
  const { context, updates } = fixture({ ...base, status: 'processing', fulfillment: { id: 'f', status: 'preparing' }, payments: [{ id: 'p', status: 'refunded', session: null }, { id: 'q', status: 'captured', session: null }] })
  await closeOrderAfterRefund(context, 'o', 'u')
  assert.deepEqual(updates.Order, [])
})
