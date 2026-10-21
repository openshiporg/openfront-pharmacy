import type { Context } from '.keystone/types'
import { requirePermission, requireTenantMembership } from './lib/authorization'
import { createHumanApproval, recordAuditAndOutbox } from './lib/evidence'
import { withDomainTransaction } from './lib/transaction'
import { isManualPaymentProvider } from './paymentOperations'

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
  if (!ORDER_STATUS[args.status]) throw new Error('Unsupported fulfillment status')
  return withDomainTransaction(context, [`fulfillment:${args.fulfillmentId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const fulfillment = await sudo.query.Fulfillment.findOne({
      where: { id: args.fulfillmentId },
      query: 'id method status organization { id } location { id } assignedTo { id } order { id status patient { id } approval { id } payments { id status provider { createPaymentFunction } } }',
    })
    if (!fulfillment?.order) throw new Error('Fulfillment not found')
    const { userId } = await requireTenantMembership(transactionContext, {
      organizationId: fulfillment.organization.id,
      locationId: fulfillment.location.id,
    })
    if (args.status === 'out_for_delivery' && fulfillment.method !== 'delivery') throw new Error('Only delivery orders can go out for delivery')
    if (args.status === 'cancelled') throw new Error('Cancelling a paid order requires a refund; use the refund action instead')
    if (args.status === 'handed_off' && fulfillment.assignedTo?.id !== userId) throw new Error('Only the assigned staff member can record the handoff')
    const payments = fulfillment.order.payments || []
    // Pay-at-pickup (manual provider) payments are collected at handoff.
    const pickupPayments = payments.filter((payment: any) => payment.status === 'pending' && isManualPaymentProvider(payment.provider || {}))
    if (args.status === 'handed_off' && !payments.some((payment: any) => payment.status === 'captured') && !pickupPayments.length) throw new Error('Payment must be captured before handoff')
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
    if (args.status === 'handed_off') {
      for (const payment of pickupPayments) {
        await sudo.query.Payment.updateOne({
          where: { id: payment.id },
          data: { status: 'captured', processedAt: new Date().toISOString(), recordedBy: { connect: { id: userId } }, ...(approval ? { approval: { connect: { id: approval.id } } } : {}) },
          query: 'id',
        })
      }
    }
    await sudo.query.Fulfillment.updateOne({ where: { id: fulfillment.id }, data: { status: args.status, ...(args.status === 'preparing' ? { assignedTo: { connect: { id: userId } } } : {}) } })
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
