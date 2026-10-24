import { createHash } from 'node:crypto'
import type { Context } from '.keystone/types'
import { permissions } from '../access'
import { createPayment, refundPayment } from '../utils/paymentProviderAdapter'
import { loadAndAssertCartAccess } from './lib/cartAccess'
import { requireTenantMembership } from './lib/authorization'
import { recordAuditAndOutbox } from './lib/evidence'
import { withDomainTransaction } from './lib/transaction'
import { DomainError } from './lib/errors'

export const PAYMENT_PROVIDER_ADAPTER_FIELDS = 'id code isInstalled createPaymentFunction capturePaymentFunction refundPaymentFunction getPaymentStatusFunction generatePaymentLinkFunction handleWebhookFunction'

export function isManualPaymentProvider(provider: { createPaymentFunction?: string | null }) {
  return provider.createPaymentFunction === 'manual'
}

function paymentProviderOption(provider: any) {
  return { code: provider.code, name: provider.name, payAtPickup: isManualPaymentProvider(provider) }
}

function paymentSessionResult(session: any) {
  return {
    id: session.id,
    amount: session.amount,
    currencyCode: session.currencyCode,
    status: session.status,
    providerCode: session.provider?.code || '',
    providerName: session.provider?.name || 'Payment provider',
    clientSecret: typeof session.data?.clientSecret === 'string' ? session.data.clientSecret : null,
  }
}

function normalizeStatus(status?: string) {
  if (['succeeded', 'captured'].includes(status || '')) return 'captured'
  if (['requires_action', 'requires_payment_method', 'requires_confirmation'].includes(status || '')) return 'requires_action'
  if (status === 'failed') return 'failed'
  return 'pending'
}

export async function activePharmacyPaymentProviders(_root: unknown, args: { locationId: string }, context: Context) {
  const location = await context.sudo().query.PharmacyLocation.findOne({ where: { id: args.locationId }, query: 'id organization { id } onlineOrderingEnabled' })
  if (!location) return []
  if (!location.onlineOrderingEnabled) {
    if (!permissions.canManageOrders({ session: context.session as any })) return []
    await requireTenantMembership(context, { organizationId: location.organization.id, locationId: location.id })
  }
  const providers = await context.sudo().query.PaymentProvider.findMany({
    where: { organization: { id: { equals: location.organization.id } }, isInstalled: { equals: true } },
    query: 'name code createPaymentFunction',
  })
  return providers.map(paymentProviderOption)
}

export async function refundPharmacyPayment(
  _root: unknown,
  args: { paymentId: string; reason: string; attested: boolean },
  context: Context,
) {
  if (!permissions.canManagePayments({ session: context.session as any })) throw new DomainError('Permission required: canManagePayments')
  if (!args.attested || args.reason.trim().length < 3) throw new DomainError('A refund reason and human confirmation are required')
  const prepared = await withDomainTransaction(context, [`payment:${args.paymentId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const payment = await sudo.query.Payment.findOne({
      where: { id: args.paymentId },
      query: `id status amount currencyCode externalPaymentId data order { id orderNumber organization { id } location { id } } provider { ${PAYMENT_PROVIDER_ADAPTER_FIELDS} }`,
    })
    if (!payment?.order || !payment.provider) throw new DomainError('Payment not found')
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: payment.order.organization.id, locationId: payment.order.location.id })
    if (payment.status === 'refunded') return { reused: true, payment, userId }
    if (!['captured', 'refund_pending'].includes(payment.status) || !payment.externalPaymentId) throw new DomainError('Only captured payments can be refunded')
    if (payment.status === 'captured') {
      await sudo.query.Payment.updateOne({ where: { id: payment.id }, data: { status: 'refund_pending', data: { ...(payment.data || {}), refundReason: args.reason.trim() } } })
    }
    return { reused: false, payment, userId }
  })
  if (prepared.reused) return { success: true, reused: true, paymentId: prepared.payment.id, status: 'refunded', amount: prepared.payment.amount }

  const providerResult = await refundPayment({
    provider: prepared.payment.provider,
    paymentId: prepared.payment.externalPaymentId,
    amount: prepared.payment.amount,
    currency: prepared.payment.currencyCode,
    idempotencyKey: `refund:${prepared.payment.id}`,
  })
  if (!['refunded', 'succeeded'].includes(providerResult.status)) throw new DomainError(`Refund remains pending: ${providerResult.status || 'unknown'}`)

  return withDomainTransaction(context, [`payment:${args.paymentId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const current = await sudo.query.Payment.findOne({ where: { id: args.paymentId }, query: 'id status amount order { id organization { id } location { id } }' })
    if (!current?.order) throw new DomainError('Payment not found')
    if (current.status === 'refunded') return { success: true, reused: true, paymentId: current.id, status: current.status, amount: current.amount }
    await sudo.query.Payment.updateOne({ where: { id: current.id }, data: { status: 'refunded', data: { refund: providerResult, reason: args.reason.trim() } } })
    await recordAuditAndOutbox(transactionContext, {
      eventKey: `payment.refunded:${current.id}`,
      organizationId: current.order.organization.id,
      locationId: current.order.location.id,
      actorId: prepared.userId,
      eventType: 'payment.refunded',
      resourceType: 'Payment',
      resourceId: current.id,
      metadata: { orderId: current.order.id, amount: current.amount, reason: args.reason.trim() },
    })
    return { success: true, reused: false, paymentId: current.id, status: 'refunded', amount: current.amount }
  })
}

export async function initiatePharmacyPaymentSession(
  _root: unknown,
  args: { cartId: string; providerCode: string; guestToken?: string | null },
  context: Context,
) {
  const cart = await loadAndAssertCartAccess(context, args.cartId, args.guestToken)
  if (!cart.items.length || cart.totalAmount < 1) throw new DomainError('Cart is empty')
  const provider = (await context.sudo().query.PaymentProvider.findMany({
    where: { code: { equals: args.providerCode }, organization: { id: { equals: cart.organization.id } } },
    take: 1,
    query: `${PAYMENT_PROVIDER_ADAPTER_FIELDS} organization { id }`,
  }))[0]
  if (!provider?.isInstalled) throw new DomainError('Payment provider is not available for this cart')
  const idempotencyKey = createHash('sha256').update(`${cart.id}:${provider.id}:${cart.totalAmount}`).digest('hex')

  const prepared = await withDomainTransaction(context, [`cart:${cart.id}`, `payment-session:${idempotencyKey}`], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const existing = await sudo.query.PaymentSession.findOne({ where: { idempotencyKey }, query: 'id amount currencyCode status externalPaymentId data provider { code name }' })
    if (existing?.externalPaymentId) return existing
    const current = await loadAndAssertCartAccess(transactionContext, cart.id, args.guestToken)
    for (const session of current.paymentSessions.filter((entry: any) => entry.isSelected)) {
      await sudo.query.PaymentSession.updateOne({ where: { id: session.id }, data: { isSelected: false } })
    }
    if (existing) {
      await sudo.query.PaymentSession.updateOne({ where: { id: existing.id }, data: { isSelected: true } })
      return existing
    }
    return sudo.query.PaymentSession.createOne({
      data: {
        amount: current.totalAmount,
        currencyCode: current.items[0]?.product?.currencyCode || 'USD',
        status: 'pending',
        reconciliationStatus: 'pending',
        isSelected: true,
        idempotencyKey,
        organization: { connect: { id: current.organization.id } },
        location: { connect: { id: current.location.id } },
        cart: { connect: { id: current.id } },
        provider: { connect: { id: provider.id } },
      },
      query: 'id amount currencyCode status externalPaymentId data provider { code name }',
    })
  })
  if (prepared.externalPaymentId) return paymentSessionResult(prepared)

  let providerData: any
  try {
    providerData = await createPayment({ provider, cart: { id: cart.id }, amount: cart.totalAmount, currency: prepared.currencyCode })
  } catch (error) {
    await withDomainTransaction(context, [`payment-session:${prepared.id}`], async (transactionContext) => {
      await transactionContext.sudo().query.PaymentSession.updateOne({
        where: { id: prepared.id },
        data: { status: 'failed', reconciliationStatus: 'manual_review', failureReason: error instanceof Error ? error.message.slice(0, 1000) : 'Provider initiation failed' },
      })
    })
    throw error
  }
  const externalPaymentId = providerData?.paymentIntentId || providerData?.orderId || (isManualPaymentProvider(provider) ? `manual:${prepared.id}` : null)
  if (!externalPaymentId) throw new DomainError('Payment provider did not return a payment reference')

  return withDomainTransaction(context, [`payment-session:${prepared.id}`], async (transactionContext) => {
    const session = await transactionContext.sudo().query.PaymentSession.updateOne({
      where: { id: prepared.id },
      data: {
        status: normalizeStatus(providerData.status),
        externalPaymentId,
        data: providerData,
        reconciliationStatus: 'pending',
        lastReconciledAt: new Date().toISOString(),
      },
      query: 'id amount currencyCode status externalPaymentId data provider { code name }',
    })
    return paymentSessionResult(session)
  })
}
