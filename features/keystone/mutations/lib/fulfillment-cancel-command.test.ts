import { test } from 'node:test'
import assert from 'node:assert/strict'
import { transitionOrderFulfillment } from '../fulfillmentWorkflows'
import { availableFulfillmentTransitions } from './fulfillment-cancel'

function fixture(status = 'pending', provider = 'manual') {
  const payment = { id: 'pay', status, provider: { createPaymentFunction: provider } }
  const fulfillment = { id: 'f', status: 'preparing', method: 'pickup', organization: { id: 'org' }, location: { id: 'loc' }, assignedTo: null,
    order: { id: 'o', status: 'processing', payments: [payment], lineItems: [{ id: 'line', product: { id: 'p' }, prescriptionRequirementSnapshot: 'none', lotAllocationSnapshot: [{ lotId: 'lot', quantity: 1 }] }] } }
  const lot = { id: 'lot', quantityAvailable: 55, product: { id: 'p', organization: { id: 'org' } }, location: { id: 'loc' } }
  const movements: any[] = []; const events: any[] = []
  const query: any = {
    User: { findOne: async () => ({ tokenVersion: 0, role: { canManageOrders: true } }) },
    OrganizationMembership: { findMany: async () => [{ organization: { id: 'org', status: 'active' }, location: null }] },
    PharmacyLocation: { findOne: async () => ({ id: 'loc', status: 'active', organization: { id: 'org', status: 'active' } }) },
    Fulfillment: { findOne: async () => fulfillment, updateOne: async ({ data }: any) => Object.assign(fulfillment, data) },
    Order: { updateOne: async ({ data }: any) => Object.assign(fulfillment.order, data) },
    Payment: { updateOne: async ({ data }: any) => Object.assign(payment, data) },
    InventoryLot: { findOne: async () => lot, updateOne: async ({ data }: any) => Object.assign(lot, data) },
    InventoryMovement: { createOne: async ({ data }: any) => { movements.push(data); return { id: 'm' } } },
    HumanApproval: { createOne: async () => ({ id: 'approval' }) },
    AuditEvent: { findOne: async () => null, createOne: async ({ data }: any) => { events.push(data); return { id: 'audit' } } },
  }
  const context: any = { session: { itemId: 'u', data: { role: { canManageOrders: true } } }, query, prisma: { $queryRaw: async () => [] } }
  context.sudo = () => context; context.transaction = async (fn: any) => fn(context)
  return { context, fulfillment, payment, lot, movements, events }
}
const args = { fulfillmentId: 'f', status: 'cancelled', reason: 'QA Test unpaid cancellation', attested: true }
test('admin manual unpaid cancellation voids payment, releases stock once, and updates customer order status', async () => {
  const f = fixture()
  assert.deepEqual(availableFulfillmentTransitions('preparing', [f.payment]), ['ready', 'cancelled'])
  await transitionOrderFulfillment(null, args, f.context)
  assert.equal(f.payment.status, 'cancelled'); assert.equal(f.fulfillment.order.status, 'cancelled')
  assert.equal(f.lot.quantityAvailable, 56); assert.equal(f.movements.length, 1)
  assert.equal(f.movements[0].movementType, 'release'); assert.equal(f.movements[0].quantityDelta, 1)
  assert.equal(f.events[0].eventType, 'fulfillment.cancelled')
  await transitionOrderFulfillment(null, args, f.context)
  assert.equal(f.movements.length, 1); assert.equal(f.lot.quantityAvailable, 56)
})
test('captured, in-flight, and provider-pending tenders cannot be cancelled locally', async () => {
  for (const [status, provider] of [['captured','manual'], ['authorized','manual'], ['refund_pending','manual'], ['pending','stripe']]) {
    const f = fixture(status, provider)
    await assert.rejects(transitionOrderFulfillment(null, args, f.context), /refund/)
    assert.equal(f.movements.length, 0); assert.equal(f.lot.quantityAvailable, 55)
  }
})
test('membership, permission, attestation, and pharmacist boundaries stay enforced', async () => {
  const noPermission = fixture(); noPermission.context.session.data.role.canManageOrders = false
  await assert.rejects(transitionOrderFulfillment(null, args, noPermission.context), /Permission/)
  const noMember = fixture(); noMember.context.query.OrganizationMembership.findMany = async () => []
  await assert.rejects(transitionOrderFulfillment(null, args, noMember.context), /access/)
  const noApproval = fixture()
  await assert.rejects(transitionOrderFulfillment(null, { ...args, attested: false }, noApproval.context))
  const rx = fixture(); rx.fulfillment.order.lineItems[0].prescriptionRequirementSnapshot = 'prescription_required'
  await assert.rejects(transitionOrderFulfillment(null, args, rx.context), /pharmacist/)
  assert.equal(rx.movements.length, 0)
})
