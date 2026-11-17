import type { Context } from '.keystone/types'
import { permissions } from '../access'
import { getPaymentStatus, refundPayment } from '../utils/paymentProviderAdapter'
import { requireTenantMembership } from './lib/authorization'
import { recordAudit } from './lib/evidence'
import { withDomainTransaction } from './lib/transaction'
import { PAYMENT_PROVIDER_ADAPTER_FIELDS } from './paymentOperations'
import { DomainError } from './lib/errors'
import { canMovePaymentSession } from '../workflows/pharmacy-state'

export async function reconcilePharmacyPaymentSession(
  _root: unknown,
  args: { paymentSessionId: string },
  context: Context,
) {
  if (!permissions.canManagePayments({ session: context.session as any })) throw new DomainError('Permission required: canManagePayments')
  const session = await context.sudo().query.PaymentSession.findOne({
    where: { id: args.paymentSessionId },
    query: `id status isSelected reconciliationStatus reconciliationAttempts externalPaymentId amount currencyCode data cart { id status organization { id } location { id } order { id } } provider { ${PAYMENT_PROVIDER_ADAPTER_FIELDS} }`,
  })
  if (!session?.cart || !session.provider || !session.externalPaymentId) throw new DomainError('Payment session not found')
  const { userId } = await requireTenantMembership(context, { organizationId: session.cart.organization.id, locationId: session.cart.location.id })
  if (session.cart.order?.id && canMovePaymentSession(session.status, 'captured')) {
    return withDomainTransaction(context, [`payment-session:${session.id}`], async (transactionContext) => {
      await transactionContext.sudo().query.PaymentSession.updateOne({ where: { id: session.id }, data: { status: 'captured', reconciliationStatus: 'ordered', lastReconciledAt: new Date().toISOString(), failureReason: null } })
      return { success: true, status: 'ordered', paymentSessionId: session.id }
    })
  }

  // Money settled with no order, and no checkout can still use it (another payment was started, the cart is gone,
  // or the provider charged a different amount): reconcile refunds it, exactly like a failed checkout's compensation.
  let compensate = session.reconciliationStatus === 'compensation_pending'
  let refundAmount = session.amount
  if (!compensate && !session.cart.order?.id && !['captured', 'compensated', 'refunded'].includes(session.status)) {
    const providerStatus = await getPaymentStatus({ provider: session.provider, paymentId: session.externalPaymentId })
    const settled = ['captured', 'succeeded'].includes(providerStatus?.status)
    const chargedAmount = Number(providerStatus?.amount)
    compensate = settled && Number.isSafeInteger(chargedAmount) && chargedAmount > 0 && (!session.isSelected || session.cart.status !== 'active' || chargedAmount !== session.amount)
    if (compensate) refundAmount = chargedAmount
  }
  if (compensate) {
    const compensation = await refundPayment({ provider: session.provider, paymentId: session.externalPaymentId, amount: refundAmount, currency: session.currencyCode, idempotencyKey: `checkout-compensation:${session.id}` })
    if (!['refunded', 'succeeded'].includes(compensation?.status)) throw new DomainError('Payment compensation is still pending')
    return withDomainTransaction(context, [`payment-session:${session.id}`], async (transactionContext) => {
      await transactionContext.sudo().query.PaymentSession.updateOne({ where: { id: session.id }, data: { status: 'compensated', reconciliationStatus: 'compensated', isSelected: false, reconciliationAttempts: session.reconciliationAttempts + 1, lastReconciledAt: new Date().toISOString(), failureReason: null, data: { ...(session.data || {}), compensation } } })
      await recordAudit(transactionContext, {
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

  // A captured, refunded or compensated session is final: asking the provider again must not rewind it.
  if (['captured', 'compensated', 'refunded'].includes(session.status)) return { success: true, status: session.status, paymentSessionId: session.id }
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
