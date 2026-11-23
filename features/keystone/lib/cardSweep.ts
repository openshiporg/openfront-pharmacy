import { keystoneContext } from '../context'
import { getPaymentStatus } from '../utils/paymentProviderAdapter'
import { PAYMENT_PROVIDER_ADAPTER_FIELDS, isManualPaymentProvider } from '../mutations/paymentOperations'
import { submitSettledPharmacyOrder } from '../mutations/submitPharmacyOrder'
import { canMovePaymentSession } from '../workflows/pharmacy-state'
import { sendOrderConfirmationEmail } from './mail'

const EVERY_MS = 60_000
// Give the customer's own browser the first chance to finish; the sweep picks up what it leaves behind.
const GRACE_MS = 20_000
const LOOK_BACK_MS = 3 * 86_400_000

/**
 * The shared Stripe test account has no webhook slot left for this store, so a customer who pays and closes the
 * tab before the browser places the order would leave the money taken and no order. Once a minute this asks
 * Stripe about every open card session and, for each one Stripe reports paid, places the order through the same
 * checkout the browser uses, with the same idempotency key, so it can only ever happen once.
 */
export async function sweepOpenCardPayments() {
  const context = keystoneContext.sudo()
  const now = Date.now()
  const sessions = await context.query.PaymentSession.findMany({
    where: {
      status: { in: ['pending', 'requires_action'] },
      isSelected: { equals: true },
      externalPaymentId: { startsWith: 'pi_' },
      cart: { status: { equals: 'active' } },
      createdAt: { gte: new Date(now - LOOK_BACK_MS).toISOString(), lte: new Date(now - GRACE_MS).toISOString() },
    },
    orderBy: [{ createdAt: 'desc' }],
    take: 50,
    query: `id status amount externalPaymentId data cart { id } provider { ${PAYMENT_PROVIDER_ADAPTER_FIELDS} } organization { name }`,
  })
  let placed = 0
  for (const session of sessions as any[]) {
    if (!session.provider?.isInstalled || isManualPaymentProvider(session.provider)) continue
    try {
      const status = await getPaymentStatus({ provider: session.provider, paymentId: session.externalPaymentId })
      if (!['succeeded', 'captured'].includes(status?.status)) continue
      const checkout = session.data?.checkout
      if (!checkout) {
        // Paid before checkout details were kept on the session: list it for staff as settled without an order.
        if (canMovePaymentSession(session.status, 'settled_unordered')) {
          await context.query.PaymentSession.updateOne({ where: { id: session.id }, data: { status: 'settled_unordered', reconciliationStatus: 'settled_unordered', lastReconciledAt: new Date().toISOString() } })
        }
        continue
      }
      const result: any = await submitSettledPharmacyOrder({
        ...checkout,
        cartId: session.cart.id,
        guestToken: null,
        paymentSessionId: session.id,
        idempotencyKey: `checkout:${session.cart.id}:${session.id}`,
      }, keystoneContext)
      if (result?.reused) continue
      placed += 1
      console.log(`Card sweep: placed order ${result.orderNumber} for a paid checkout the browser did not finish`)
      const origin = (process.env.SMTP_STORE_LINK || (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : '')).replace(/\/$/, '')
      if (origin) {
        const params = new URLSearchParams({ orderId: result.orderId, ...(result.guestOrderToken ? { token: result.guestOrderToken } : {}) })
        await sendOrderConfirmationEmail({ to: checkout.email, orderNumber: result.orderNumber, storeName: session.organization?.name || 'Pharmacy', url: `${origin}/order-status?${params}` }).catch(() => console.error('Card sweep: order email failed'))
      }
    } catch (error) {
      console.error(`Card sweep: session ${session.id} not finished:`, error instanceof Error ? error.message : error)
    }
  }
  return { checked: sessions.length, placed }
}

// The minute timer only runs for this long after the last card checkout started, so an idle store can sleep.
// A paid checkout left open longer is still placed by the run at the next server start.
const ACTIVE_MS = 30 * 60_000

type SweepState = { __pharmacyCardSweep?: ReturnType<typeof setInterval>; __pharmacyCardSweepArm?: () => void }

/** One run at start-up, then a minute timer only while a checkout is recent; a run never overlaps the last one. */
export function startCardSweep() {
  const state = globalThis as SweepState
  if (state.__pharmacyCardSweepArm || !process.env.STRIPE_SECRET_KEY) return
  let running = false
  let armedAt = 0
  const run = async () => {
    if (running) return
    running = true
    try {
      await sweepOpenCardPayments()
    } catch (error) {
      console.error('Card sweep failed', error instanceof Error ? error.message : error)
    } finally {
      running = false
      if (state.__pharmacyCardSweep && Date.now() - armedAt > ACTIVE_MS) {
        clearInterval(state.__pharmacyCardSweep)
        state.__pharmacyCardSweep = undefined
      }
    }
  }
  state.__pharmacyCardSweepArm = () => {
    armedAt = Date.now()
    if (state.__pharmacyCardSweep) return
    state.__pharmacyCardSweep = setInterval(run, EVERY_MS)
    state.__pharmacyCardSweep.unref?.()
  }
  setTimeout(run, 15_000).unref?.()
  console.log('Card sweep started (at start-up, then every 60 s for 30 min after a card checkout starts)')
}
