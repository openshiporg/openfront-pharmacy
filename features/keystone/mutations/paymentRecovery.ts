import type { Context } from '.keystone/types'
import { permissions } from '../access'
import { getPaymentStatus, refundPayment } from '../utils/paymentProviderAdapter'
import { requireTenantMembership } from './lib/authorization'
import { recordAuditAndOutbox } from './lib/evidence'
import { withDomainTransaction } from './lib/transaction'
import { PAYMENT_PROVIDER_ADAPTER_FIELDS } from './paymentOperations'

export async function reconcilePharmacyPaymentSession(
  _root: unknown,
  args: { paymentSessionId: string },
  context: Context,
) {
  if (!permissions.canManagePayments({ session: context.session as any })) throw new Error('Permission required: canManagePayments')
  const session = await context.sudo().query.PaymentSession.findOne({
    where: { id: args.paymentSessionId },
    query: `id status reconciliationStatus reconciliationAttempts externalPaymentId amount currencyCode data cart { id status organization { id } location { id } order { id } } provider { ${PAYMENT_PROVIDER_ADAPTER_FIELDS} }`,
  })
  if (!session?.cart || !session.provider || !session.externalPaymentId) throw new Error('Payment session not found')
  const { userId } = await requireTenantMembership(context, { organizationId: session.cart.organization.id, locationId: session.cart.location.id })
  if (session.cart.order?.id) {
    return withDomainTransaction(context, [`payment-session:${session.id}`], async (transactionContext) => {
      await transactionContext.sudo().query.PaymentSession.updateOne({ where: { id: session.id }, data: { status: 'captured', reconciliationStatus: 'ordered', lastReconciledAt: new Date().toISOString(), failureReason: null } })
      return { success: true, status: 'ordered', paymentSessionId: session.id }
    })
  }

  if (session.reconciliationStatus === 'compensation_pending') {
    const compensation = await refundPayment({ provider: session.provider, paymentId: session.externalPaymentId, amount: session.amount, currency: session.currencyCode, idempotencyKey: `checkout-compensation:${session.id}` })
    if (!['refunded', 'succeeded'].includes(compensation?.status)) throw new Error('Payment compensation is still pending')
    return withDomainTransaction(context, [`payment-session:${session.id}`], async (transactionContext) => {
      await transactionContext.sudo().query.PaymentSession.updateOne({ where: { id: session.id }, data: { status: 'compensated', reconciliationStatus: 'compensated', reconciliationAttempts: session.reconciliationAttempts + 1, lastReconciledAt: new Date().toISOString(), failureReason: null, data: { ...(session.data || {}), compensation } } })
      await recordAuditAndOutbox(transactionContext, {
        eventKey: `payment.compensated:${session.id}`,
        organizationId: session.cart.organization.id,
        locationId: session.cart.location.id,
        actorId: userId,
        eventType: 'payment.compensated',
        resourceType: 'PaymentSession',
        resourceId: session.id,
        metadata: { cartId: session.cart.id },
      })
      return { success: true, status: 'compensated', paymentSessionId: session.id }
    })
  }

  const providerStatus = await getPaymentStatus({ provider: session.provider, paymentId: session.externalPaymentId })
  const settled = ['captured', 'succeeded'].includes(providerStatus?.status)
  return withDomainTransaction(context, [`payment-session:${session.id}`], async (transactionContext) => {
    await transactionContext.sudo().query.PaymentSession.updateOne({
      where: { id: session.id },
      data: {
        status: settled ? 'settled_unordered' : providerStatus?.status === 'failed' ? 'failed' : 'pending',
        reconciliationStatus: settled ? 'settled_unordered' : providerStatus?.status === 'failed' ? 'manual_review' : 'pending',
        reconciliationAttempts: session.reconciliationAttempts + 1,
        lastReconciledAt: new Date().toISOString(),
      },
    })
    return { success: true, status: settled ? 'settled_unordered' : providerStatus?.status || 'pending', paymentSessionId: session.id }
  })
}
