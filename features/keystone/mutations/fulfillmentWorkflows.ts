import type { Context } from '.keystone/types'
import { requirePermission, requireTenantMembership } from './lib/authorization'
import { createHumanApproval, recordAuditAndOutbox } from './lib/evidence'
import { acquireTransactionLocks, withDomainTransaction } from './lib/transaction'
import { isManualPaymentProvider } from './paymentOperations'
import { DomainError } from './lib/errors'
import { canCancelFulfillment, isUnpaidPickupPayment } from './lib/fulfillment-cancel'
import { notifyOrderReady } from './pickupNotice'

const ORDER_STATUS: Record<string, string> = {
  preparing: 'processing',
  ready: 'ready',
  out_for_delivery: 'out_for_delivery',
  handed_off: 'completed',
  cancelled: 'cancelled',
}

export async function transitionOrderFulfillment(
  _root: unknown,
  args: { fulfillmentId: string; status: string; reason: string; attested: boolean },
  context: Context,
) {
  requirePermission(context, 'canManageOrders')
  if (!ORDER_STATUS[args.status]) throw new DomainError('Unsupported fulfillment status')
  const result = await transitionInTransaction(args, context)
  // Pickup order is on the shelf: tell the customer (once per fulfillment, after commit).
  if (args.status === 'ready') await notifyOrderReady(context, { fulfillmentId: args.fulfillmentId })
  return result
}

async function transitionInTransaction(args: { fulfillmentId: string; status: string; reason: string; attested: boolean }, context: Context) {
  return withDomainTransaction(context, [`fulfillment:${args.fulfillmentId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const fulfillment = await sudo.query.Fulfillment.findOne({
      where: { id: args.fulfillmentId },
      query: 'id method status organization { id } location { id } assignedTo { id } order { id status lineItems { id prescriptionRequirementSnapshot lotAllocationSnapshot product { id } } patient { id } approval { id } payments { id status provider { createPaymentFunction } } }',
    })
    if (!fulfillment?.order) throw new DomainError('Fulfillment not found')
    const { userId } = await requireTenantMembership(transactionContext, {
      organizationId: fulfillment.organization.id,
      locationId: fulfillment.location.id,
    })
    if (args.status === 'out_for_delivery' && fulfillment.method !== 'delivery') throw new DomainError('Only delivery orders can go out for delivery')
    if (args.status === 'cancelled' && fulfillment.status !== 'cancelled' && !canCancelFulfillment(fulfillment.status, fulfillment.order.payments || [])) {
      throw new DomainError('Cancelling a paid order requires a refund; use the refund action instead')
    }
    // Storefront orders start at preparing with nobody assigned; the first staff member to work one claims it.
    const assigneeId = fulfillment.assignedTo?.id || userId
    if (args.status === 'handed_off' && assigneeId !== userId) throw new DomainError('Only the assigned staff member can record the handoff')
    const payments = fulfillment.order.payments || []
    // Pay-at-pickup (manual provider) payments are collected at handoff.
    const pickupPayments = payments.filter((payment: any) => payment.status === 'pending' && isManualPaymentProvider(payment.provider || {}))
    if (args.status === 'handed_off' && !payments.some((payment: any) => payment.status === 'captured') && !pickupPayments.length) throw new DomainError('Payment must be captured before handoff')
    if (fulfillment.status === args.status) {
      return { success: true, reused: true, fulfillmentId: fulfillment.id, orderId: fulfillment.order.id, status: args.status, approvalId: fulfillment.order.approval?.id }
    }
    const consequential = ['handed_off', 'cancelled'].includes(args.status)
    const approval = consequential
      ? await createHumanApproval(transactionContext, {
          organizationId: fulfillment.organization.id,
          locationId: fulfillment.location.id,
          actorId: userId,
          actionType: 'order_handoff',
          reason: args.reason,
          attested: args.attested,
          evidence: { fulfillmentId: fulfillment.id, previousStatus: fulfillment.status, status: args.status },
        })
      : null
    if (args.status === 'cancelled' && pickupPayments.length) {
      if (fulfillment.method !== 'pickup' || !['pending', 'preparing', 'ready'].includes(fulfillment.status)) throw new DomainError('Unpaid cancellation requires an uncollected pickup order')
      const lines = fulfillment.order.lineItems || []
      // Prescription allocations require pharmacist return-to-stock authority.
      if (lines.some((line: any) => line.prescriptionRequirementSnapshot !== 'none')) throw new DomainError('Prescription orders require the pharmacist return-to-stock workflow')
      const allocations = lines.flatMap((line: any) => {
        if (!Array.isArray(line.lotAllocationSnapshot) || !line.product?.id) throw new DomainError('Missing original inventory allocation')
        return line.lotAllocationSnapshot.map((allocation: any) => ({ ...allocation, productId: line.product.id, lineId: line.id }))
      })
      if (allocations.some((a: any) => !a.lotId || !Number.isSafeInteger(a.quantity) || a.quantity <= 0)) throw new DomainError('Invalid original inventory allocation')
      await acquireTransactionLocks(transactionContext, allocations.map((a: any) => `lot:${a.lotId}`))
      for (const allocation of allocations) {
        const lot = await sudo.query.InventoryLot.findOne({ where: { id: allocation.lotId }, query: 'id quantityAvailable product { id organization { id } } location { id }' })
        if (!lot || lot.product?.id !== allocation.productId || lot.product.organization?.id !== fulfillment.organization.id || lot.location?.id !== fulfillment.location.id) throw new DomainError('Allocation does not match this tenant lot')
        await sudo.query.InventoryLot.updateOne({ where: { id: lot.id }, data: { quantityAvailable: lot.quantityAvailable + allocation.quantity } })
        await sudo.query.InventoryMovement.createOne({ data: {
          movementType: 'release', quantityDelta: allocation.quantity, reason: args.reason,
          idempotencyKey: `cancel:${fulfillment.id}:${allocation.lineId}:${lot.id}`,
          organization: { connect: { id: fulfillment.organization.id } }, location: { connect: { id: fulfillment.location.id } },
          product: { connect: { id: allocation.productId } }, lot: { connect: { id: lot.id } },
          order: { connect: { id: fulfillment.order.id } }, actor: { connect: { id: userId } }, approval: { connect: { id: approval!.id } },
        } })
      }
      for (const payment of payments.filter(isUnpaidPickupPayment)) {
        await sudo.query.Payment.updateOne({ where: { id: payment.id }, data: { status: 'cancelled', processedAt: new Date().toISOString(), recordedBy: { connect: { id: userId } }, approval: { connect: { id: approval!.id } } } })
      }
    }
    if (args.status === 'handed_off') {
      for (const payment of pickupPayments) {
        await sudo.query.Payment.updateOne({
          where: { id: payment.id },
          data: { status: 'captured', processedAt: new Date().toISOString(), recordedBy: { connect: { id: userId } }, ...(approval ? { approval: { connect: { id: approval.id } } } : {}) },
          query: 'id',
        })
      }
    }
    await sudo.query.Fulfillment.updateOne({ where: { id: fulfillment.id }, data: { status: args.status, ...(args.status === 'preparing' || !fulfillment.assignedTo ? { assignedTo: { connect: { id: userId } } } : {}) } })
    await sudo.query.Order.updateOne({
      where: { id: fulfillment.order.id },
      data: { status: ORDER_STATUS[args.status], ...(approval ? { approval: { connect: { id: approval.id } } } : {}) },
    })
    await recordAuditAndOutbox(transactionContext, {
      eventKey: `fulfillment.${args.status}:${fulfillment.id}`,
      organizationId: fulfillment.organization.id,
      locationId: fulfillment.location.id,
      actorId: userId,
      patientId: fulfillment.order.patient?.id,
      eventType: `fulfillment.${args.status}`,
      resourceType: 'Fulfillment',
      resourceId: fulfillment.id,
      metadata: { orderId: fulfillment.order.id, previousStatus: fulfillment.status, approvalId: approval?.id || null },
    })
    return { success: true, reused: false, fulfillmentId: fulfillment.id, orderId: fulfillment.order.id, status: args.status, approvalId: approval?.id }
  })
}
