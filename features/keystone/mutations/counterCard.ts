import type { Context } from '.keystone/types'
import { createPayment, getPaymentStatus, refundPayment } from '../utils/paymentProviderAdapter'
import { DomainError } from './lib/errors'
import { DomainConflictError } from './lib/transaction'
import { PAYMENT_PROVIDER_ADAPTER_FIELDS } from './paymentOperations'

/*
 * Card at the counter (POS sale and will-call pickup), the way PioneerRx and Square take it: the
 * card is charged first through the store's Stripe provider, then the same sale the cash path
 * records is written with a provider Payment. The PaymentIntent is bound to the request key
 * (metadata cartId = "<scope>:<key>"), and the sale re-checks status, amount and currency before it commits.
 * If the sale is refused after the charge, the charge is refunded.
 */

export type CounterCardScope = 'pos' | 'rx'

export function counterCardReference(scope: CounterCardScope, idempotencyKey: string) {
  return `${scope}:${idempotencyKey}`
}

export async function counterCardProvider(context: Context, organizationId: string) {
  const [provider] = await context.sudo().query.PaymentProvider.findMany({
    where: { organization: { id: { equals: organizationId } }, isInstalled: { equals: true }, createPaymentFunction: { equals: 'stripe' } },
    take: 1,
    query: `${PAYMENT_PROVIDER_ADAPTER_FIELDS} name`,
  })
  if (!provider) throw new DomainError('Card payments need Stripe installed under Payment providers')
  return provider
}

export async function openCounterCardIntent(context: Context, input: { organizationId: string; scope: CounterCardScope; idempotencyKey: string; amount: number; currencyCode: string }) {
  if (!Number.isInteger(input.amount) || input.amount < 50) throw new DomainError('Card payments must be at least $0.50')
  const provider = await counterCardProvider(context, input.organizationId)
  const result = await createPayment({ provider, cart: { id: counterCardReference(input.scope, input.idempotencyKey) }, amount: input.amount, currency: input.currencyCode })
  if (!result?.clientSecret || !result?.paymentIntentId) throw new DomainError('Stripe did not open a card payment')
  return { clientSecret: result.clientSecret as string, paymentIntentId: result.paymentIntentId as string, amount: input.amount, currencyCode: input.currencyCode }
}

export type VerifiedCounterCard = { providerId: string; paymentIntentId: string; amount: number; currencyCode: string; last4: string | null; brand: string | null }

/** Fetches the PaymentIntent from Stripe and checks it settled for this request. Amount is checked again inside the sale transaction. */
export async function verifyCounterCardIntent(context: Context, input: { organizationId: string; scope: CounterCardScope; idempotencyKey: string; paymentIntentId: string }): Promise<VerifiedCounterCard> {
  if (!/^pi_[A-Za-z0-9]+$/.test(input.paymentIntentId || '')) throw new DomainError('Card payment reference is invalid')
  const provider = await counterCardProvider(context, input.organizationId)
  const status = await getPaymentStatus({ provider, paymentId: input.paymentIntentId })
  const intent = status?.data || {}
  if (intent.metadata?.cartId !== counterCardReference(input.scope, input.idempotencyKey)) throw new DomainError('Card payment belongs to a different sale')
  if (status.status !== 'succeeded') throw new DomainError(status.status === 'processing' ? 'The card payment is still processing. Retry in a moment.' : 'The card has not been charged yet')
  const card = intent.payment_method_details?.card || intent.latest_charge?.payment_method_details?.card || null
  return { providerId: provider.id, paymentIntentId: input.paymentIntentId, amount: Number(status.amount), currencyCode: String(status.currency || '').toUpperCase(), last4: card?.last4 || null, brand: card?.brand || null }
}

export function assertCounterCardCovers(card: VerifiedCounterCard, totalAmount: number, currencyCode: string) {
  if (card.amount !== totalAmount || card.currencyCode !== currencyCode.toUpperCase()) {
    throw new DomainError('The card was charged a different amount than this sale. The charge will be refunded; start the sale again.')
  }
}

/**
 * The sale was refused after the card was charged: refund the charge unless a sale under the same key
 * committed (a replay) or the refusal is a retryable conflict. Returns the error to surface.
 */
export async function refundRefusedCounterCard(context: Context, card: VerifiedCounterCard | null, error: unknown, committed: () => Promise<boolean>) {
  // Any refusal that left no sale behind refunds the charge (domain rules, validation hooks, Prisma errors),
  // except a retryable conflict, where the client retries the same key against the same charge.
  if (!card || error instanceof DomainConflictError) return error
  if (await committed().catch(() => true)) return error
  const message = error instanceof Error ? error.message : 'The sale could not be recorded'
  try {
    const provider = await context.sudo().query.PaymentProvider.findOne({ where: { id: card.providerId }, query: PAYMENT_PROVIDER_ADAPTER_FIELDS })
    await refundPayment({ provider: provider!, paymentId: card.paymentIntentId, amount: card.amount, currency: card.currencyCode, idempotencyKey: `counter-card-void:${card.paymentIntentId}` })
    return new DomainError(`${message}. The card charge was refunded.`)
  } catch {
    return new DomainError(`${message}. The card was charged and the automatic refund failed: refund ${card.paymentIntentId} in Stripe.`)
  }
}
