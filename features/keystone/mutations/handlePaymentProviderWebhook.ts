import type { Context } from '.keystone/types'
import { handleWebhook } from '../utils/paymentProviderAdapter'
import { withDomainTransaction } from './lib/transaction'

const NO_DIVISION_CURRENCIES = new Set([
  'JPY', 'KRW', 'VND', 'CLP', 'PYG', 'XAF', 'XOF', 'BIF', 'DJF',
  'GNF', 'KMF', 'MGA', 'RWF', 'XPF', 'HTG', 'VUV', 'XAG', 'XDR', 'XAU',
])

function assertProviderAmount(providerCode: string, resource: any, payment: { amount: number; currencyCode: string }) {
  const expectedCurrency = String(payment.currencyCode).toUpperCase()
  if (providerCode.includes('stripe')) {
    const amount = Number(resource.amount_received ?? resource.amount)
    if (amount !== payment.amount || String(resource.currency).toUpperCase() !== expectedCurrency) {
      throw new Error('Provider webhook amount or currency mismatch')
    }
    return
  }
  if (providerCode.includes('paypal')) {
    const evidence = resource.amount
    const divisor = NO_DIVISION_CURRENCIES.has(expectedCurrency) ? 1 : 100
    if (
      !evidence ||
      Number(evidence.value) !== payment.amount / divisor ||
      String(evidence.currency_code).toUpperCase() !== expectedCurrency
    ) {
      throw new Error('Provider webhook amount or currency mismatch')
    }
  }
}

function normalizedHeaders(headers: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(headers || {}).map(([key, value]) => [
      key === '__rawBody' ? key : key.toLowerCase(),
      Array.isArray(value) ? String(value[0] || '') : String(value || ''),
    ]),
  )
}

function webhookPaymentId(resource: any) {
  if (typeof resource?.payment_intent === 'string') return resource.payment_intent
  if (typeof resource?.supplementary_data?.related_ids?.order_id === 'string') return resource.supplementary_data.related_ids.order_id
  if (typeof resource?.id === 'string') return resource.id
  return null
}

async function handlePaymentProviderWebhook(
  _root: unknown,
  { providerId, event, headers }: { providerId: string; event: any; headers: Record<string, unknown> },
  context: Context,
) {
  const provider = await context.sudo().query.PaymentProvider.findOne({
    where: { id: providerId },
    query: 'id code isInstalled handleWebhookFunction organization { id }',
  })
  if (!provider?.isInstalled) throw new Error('Payment provider not found')

  // Provider verification is the authorization boundary for this external
  // callback. Stripe receives the exact raw body from the HTTP route.
  const verified = await handleWebhook({ provider, event, headers: normalizedHeaders(headers) })
  const type = String(verified?.type || '')
  const resource = verified?.resource || {}
  const providerEventId = String(verified?.event?.id || event?.id || resource.id || '')
  if (!verified?.isValid || !type || !providerEventId) throw new Error('Webhook signature or event envelope is invalid')

  const eventKey = `${provider.id}:${providerEventId}`
  return withDomainTransaction(context, [`payment-webhook:${eventKey}`], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const existing = await sudo.query.PaymentWebhookEvent.findOne({ where: { eventKey }, query: 'id status' })
    if (existing) return { accepted: true, reused: true, eventId: providerEventId, status: existing.status }
    const webhookEvent = await sudo.query.PaymentWebhookEvent.createOne({
      data: {
        eventKey,
        externalEventId: providerEventId,
        eventType: type,
        resource,
        status: 'received',
        organization: { connect: { id: provider.organization.id } },
        provider: { connect: { id: provider.id } },
      },
      query: 'id',
    })

    const succeeded = /payment_intent\.succeeded|PAYMENT\.CAPTURE\.COMPLETED/.test(type)
    const failed = /payment_intent\.payment_failed|payment_intent\.canceled|PAYMENT\.CAPTURE\.DENIED|PAYMENT\.AUTHORIZATION\.VOIDED/.test(type)
    const refunded = /^refund\.|PAYMENT\.CAPTURE\.REFUNDED/.test(type)
    const paymentId = webhookPaymentId(resource)
    let handled = false
    if (paymentId) {
      const sessions = await sudo.query.PaymentSession.findMany({
        where: { externalPaymentId: { equals: paymentId }, provider: { id: { equals: provider.id } } },
        query: 'id amount currencyCode payment { id }',
      })
      if (succeeded) {
        for (const session of sessions) {
          assertProviderAmount(provider.code, resource, { amount: session.amount, currencyCode: session.currencyCode })
          await sudo.query.PaymentSession.updateOne({
            where: { id: session.id },
            data: {
              status: session.payment ? 'captured' : 'settled_unordered',
              reconciliationStatus: session.payment ? 'ordered' : 'settled_unordered',
              lastReconciledAt: new Date().toISOString(),
              failureReason: null,
            },
          })
        }
        handled = sessions.length > 0
      } else if (failed) {
        for (const session of sessions) {
          await sudo.query.PaymentSession.updateOne({ where: { id: session.id }, data: { status: 'failed', reconciliationStatus: 'manual_review', lastReconciledAt: new Date().toISOString() } })
        }
        handled = sessions.length > 0
      } else if (refunded) {
        const payments = await sudo.query.Payment.findMany({ where: { externalPaymentId: { equals: paymentId }, provider: { id: { equals: provider.id } } }, query: 'id status' })
        if (resource?.status === 'succeeded' || resource?.status === 'COMPLETED') {
          for (const payment of payments) await sudo.query.Payment.updateOne({ where: { id: payment.id }, data: { status: 'refunded' } })
        }
        handled = payments.length > 0
      }
    }
    await sudo.query.PaymentWebhookEvent.updateOne({
      where: { id: webhookEvent.id },
      data: { status: handled ? 'processed' : 'ignored', processedAt: new Date().toISOString() },
    })
    return { accepted: true, reused: false, eventId: providerEventId, status: handled ? 'processed' : 'ignored' }
  })
}

export default handlePaymentProviderWebhook
