import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assertCounterCardCovers, counterCardReference, refundRefusedCounterCard } from '../counterCard'
import { DomainError } from './errors'
import { DomainConflictError } from './transaction'

const card = { providerId: 'prov', paymentIntentId: 'pi_123', amount: 1299, currencyCode: 'USD', last4: '4242', brand: 'visa' }

test('card intent is bound to one sale scope and key', () => {
  assert.equal(counterCardReference('pos', 'k1'), 'pos:k1')
  assert.notEqual(counterCardReference('rx', 'k1'), counterCardReference('pos', 'k1'))
})

test('sale refuses a card charged a different amount or currency', () => {
  assert.doesNotThrow(() => assertCounterCardCovers(card, 1299, 'usd'))
  assert.throws(() => assertCounterCardCovers(card, 1300, 'USD'), /different amount/)
  assert.throws(() => assertCounterCardCovers(card, 1299, 'CAD'), /different amount/)
})

function refundContext(calls: any[]) {
  const provider = { id: 'prov', code: 'pp_stripe_stripe', refundPaymentFunction: 'https://adapter.invalid/refund' }
  const context: any = { sudo: () => context, query: { PaymentProvider: { findOne: async () => provider } } }
  const realFetch = globalThis.fetch
  globalThis.fetch = (async (_url: string, init: any) => { calls.push(JSON.parse(init.body)); return new Response(JSON.stringify({ status: 'succeeded' }), { status: 200 }) }) as any
  return { context, restore: () => { globalThis.fetch = realFetch } }
}

test('a refused sale refunds the charged card once, keyed to the intent', async () => {
  const calls: any[] = []
  const { context, restore } = refundContext(calls)
  try {
    const error = await refundRefusedCounterCard(context, card, new DomainError('Insufficient eligible inventory for Ibuprofen'), async () => false)
    assert.match((error as Error).message, /card charge was refunded/)
    assert.equal(calls.length, 1)
    assert.equal(calls[0].paymentId, 'pi_123')
    assert.equal(calls[0].amount, 1299)
    assert.equal(calls[0].idempotencyKey, 'counter-card-void:pi_123')
  } finally { restore() }
})

test('a validation-hook refusal (not a DomainError) also refunds', async () => {
  const calls: any[] = []
  const { context, restore } = refundContext(calls)
  try {
    const error = await refundRefusedCounterCard(context, card, new Error('You provided invalid data for this operation.'), async () => false)
    assert.match((error as Error).message, /refunded/)
    assert.equal(calls.length, 1)
  } finally { restore() }
})

test('no refund when the sale committed, on retryable conflicts, or for cash', async () => {
  const calls: any[] = []
  const { context, restore } = refundContext(calls)
  try {
    await refundRefusedCounterCard(context, card, new DomainError('replayed'), async () => true)
    await refundRefusedCounterCard(context, card, new DomainConflictError(), async () => false)
    await refundRefusedCounterCard(context, null, new DomainError('cash refusal'), async () => false)
    assert.equal(calls.length, 0)
  } finally { restore() }
})
