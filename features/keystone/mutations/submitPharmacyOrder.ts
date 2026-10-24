import { randomBytes } from 'node:crypto'
import type { Context } from '.keystone/types'
import { hashGuestCartToken } from '../security/cart-token'
import { createGuestOrderToken } from '../security/order-token'
import { getPaymentStatus, refundPayment } from '../utils/paymentProviderAdapter'
import { calculateCartTotals } from '../workflows/commerce-policy'
import { eligibleLotQuantity, isLotEligible } from '../workflows/lot-eligibility'
import { requirePermission, requireTenantMembership } from './lib/authorization'
import { loadAndAssertCartAccess } from './lib/cartAccess'
import { recordAuditAndOutbox } from './lib/evidence'
import { acquireTransactionLocks, withDomainTransaction } from './lib/transaction'
import { isManualPaymentProvider, PAYMENT_PROVIDER_ADAPTER_FIELDS } from './paymentOperations'
import { DomainError } from './lib/errors'

export const CHECKOUT_CONSENT = {
  policyVersion: '2026-07-18',
  statementKey: 'openfront_pharmacy_checkout_privacy_acknowledgement_v1',
} as const

type CheckoutInput = {
  cartId: string
  paymentSessionId: string
  idempotencyKey: string
  guestToken?: string | null
  email: string
  phone?: string | null
  customerName?: string | null
  fulfillmentMethod: 'pickup' | 'delivery' | 'pos'
  pickupAt?: string | null
  deliveryWindow?: string | null
  shippingAddress?: Record<string, unknown> | null
  privacyConsentAccepted: boolean
  policyVersion: string
  statementKey: string
}

function requireCheckoutConsent(input: CheckoutInput) {
  if (!input.privacyConsentAccepted) throw new DomainError('Privacy acknowledgement is required')
  if (input.policyVersion !== CHECKOUT_CONSENT.policyVersion || input.statementKey !== CHECKOUT_CONSENT.statementKey) {
    throw new DomainError('Privacy acknowledgement does not match the current policy')
  }
}

function normalizedEmail(value: string) {
  const email = value.trim().toLowerCase()
  if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new DomainError('A valid email address is required')
  return email
}

// Read aloud at the counter and over the phone: 8 random characters in two groups, without 0/O or 1/I/L.
const ORDER_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

function orderNumber() {
  const code = [...randomBytes(8)].map((byte) => ORDER_ALPHABET[byte % ORDER_ALPHABET.length]).join('')
  return `RXO-${code.slice(0, 4)}-${code.slice(4)}`
}

function checkoutReplay(cart: any, idempotencyKey: string, guestToken: string | null) {
  if (!cart.order || cart.order.idempotencyKey !== idempotencyKey) throw new DomainError('Cart was already submitted with another idempotency key')
  return {
    success: true,
    reused: true,
    orderId: cart.order.id,
    orderNumber: cart.order.orderNumber,
    status: cart.order.status,
    fulfillmentStatus: cart.order.fulfillment?.status || 'pending',
    totalAmount: cart.order.totalAmount,
    currencyCode: cart.order.currencyCode,
    guestOrderToken: guestToken,
  }
}

export async function submitPharmacyOrder(
  _root: unknown,
  args: { input: CheckoutInput },
  context: Context,
) {
  const input = args.input
  if (!['pickup', 'delivery', 'pos'].includes(input.fulfillmentMethod)) throw new DomainError('Fulfillment method is invalid')
  requireCheckoutConsent(input)
  const idempotencyKey = input.idempotencyKey?.trim()
  if (!idempotencyKey || idempotencyKey.length > 200) throw new DomainError('A bounded idempotency key is required')
  const email = normalizedEmail(input.email)
  const customerName = input.customerName?.trim().replace(/\s+/g, ' ') || ''
  if (customerName.length > 120 || (!customerName && input.fulfillmentMethod !== 'pos')) throw new DomainError(input.fulfillmentMethod === 'delivery' ? 'Enter the name for delivery' : 'Enter the name for pickup')
  const shippingAddress = input.fulfillmentMethod === 'delivery' ? input.shippingAddress || null : null
  if (input.fulfillmentMethod === 'delivery' && !shippingAddress) throw new DomainError('A delivery address is required')
  const cart = await loadAndAssertCartAccess(context, input.cartId, input.guestToken, { allowSubmitted: true })
  const replayToken = context.session?.itemId ? null : createGuestOrderToken(cart.id, idempotencyKey)
  if (cart.status === 'submitted') return checkoutReplay(cart, idempotencyKey, replayToken)

  if (input.fulfillmentMethod === 'pos') {
    requirePermission(context, 'canManageOrders')
    await requireTenantMembership(context, { organizationId: cart.organization.id, locationId: cart.location.id })
  }
  if (!cart.items.length) throw new DomainError('Cart is empty')
  if (input.fulfillmentMethod === 'pickup' && !cart.location.pickupEnabled) throw new DomainError('Pickup is not enabled at this location')
  if (input.fulfillmentMethod === 'delivery' && !cart.location.deliveryEnabled) throw new DomainError('Delivery is not available at this location')
  if (input.fulfillmentMethod === 'pos' && !context.session?.itemId) throw new DomainError('Point-of-sale checkout requires an authenticated staff session')

  const paymentSession = cart.paymentSessions.find((session: any) => session.id === input.paymentSessionId)
  if (!paymentSession?.isSelected || !paymentSession.provider?.isInstalled) throw new DomainError('Selected payment session not found for this cart')
  if (paymentSession.amount !== cart.totalAmount) throw new DomainError('Payment amount does not match cart total')
  const paymentId = paymentSession.externalPaymentId || paymentSession.data?.paymentIntentId || paymentSession.data?.orderId
  if (!paymentId) throw new DomainError('Payment session is missing provider payment id')
  const provider = await context.sudo().query.PaymentProvider.findOne({ where: { id: paymentSession.provider.id }, query: PAYMENT_PROVIDER_ADAPTER_FIELDS })
  if (!provider?.isInstalled) throw new DomainError('Selected payment session not found for this cart')
  // Manual tender (pay at pickup or delivery) is collected later; the order is
  // created with a pending payment instead of a provider settlement check.
  const manualTender = isManualPaymentProvider(provider)
  if (manualTender && input.fulfillmentMethod === 'delivery') throw new DomainError('Delivery orders are paid online. Choose card payment.')
  const paymentStatus = manualTender ? { status: 'pending' } : await getPaymentStatus({ provider, paymentId })
  if (!manualTender && !['captured', 'succeeded'].includes(paymentStatus.status)) throw new DomainError(`Payment is not settled: ${paymentStatus.status || 'unknown'}`)
  await withDomainTransaction(context, [`payment-session:${paymentSession.id}`], async (transactionContext) => {
    await transactionContext.sudo().query.PaymentSession.updateOne({
      where: { id: paymentSession.id },
      data: {
        status: manualTender ? 'pending' : 'settled_unordered',
        reconciliationStatus: manualTender ? 'pending' : 'settled_unordered',
        externalPaymentId: paymentId,
        reconciliationAttempts: 1,
        lastReconciledAt: new Date().toISOString(),
        failureReason: null,
      },
    })
  })

  const productIds = [...new Set(cart.items.map((item: any) => item.product.id))] as string[]
  try {
    return await withDomainTransaction(context, [`cart:${cart.id}`, ...productIds.map((id) => `product:${id}`)], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const transactionLots = await sudo.query.InventoryLot.findMany({
      where: { product: { id: { in: productIds } }, location: { id: { equals: cart.location.id } } },
      query: 'id',
    })
    await acquireTransactionLocks(transactionContext, transactionLots.map((lot: any) => `lot:${lot.id}`))
    const accessCart = await loadAndAssertCartAccess(transactionContext, input.cartId, input.guestToken, { allowSubmitted: true })
    if (accessCart.status === 'submitted') return checkoutReplay(accessCart, idempotencyKey, replayToken)
    const current = await sudo.query.Cart.findOne({
      where: { id: cart.id },
      query: `
        id status subtotalAmount taxAmount deliveryAmount totalAmount
        organization { id } location { id }
        customer { id patientProfile { id } }
        items {
          id quantity unitPriceAmount
          product {
            id title sku handle status onlineAvailable prescriptionRequirement priceAmount currencyCode imageUrl taxable
            drugReference { ndc11 }
            inventoryLots(orderBy: { expirationDate: asc }) {
              id lotNumber expirationDate quantityAvailable quantityQuarantined coldChainRequired coldChainEvidenceComplete status
              recalls { status }
              location { id }
            }
          }
        }
      `,
    })
    if (!current || current.status !== 'active' || !current.items.length) throw new DomainError('Cart is no longer available')
    for (const item of current.items) {
      if (item.product.prescriptionRequirement !== 'none') throw new DomainError('Prescription products require the authorized prescription workflow')
      if (item.product.status !== 'published' || !item.product.onlineAvailable) throw new DomainError(`${item.product.title} is no longer available`)
      if (item.unitPriceAmount !== item.product.priceAmount) throw new DomainError('Product price changed; review the cart before checkout')
    }
    const totals = calculateCartTotals(current.items, current.taxAmount, current.deliveryAmount)
    if (totals.totalAmount !== current.totalAmount) throw new DomainError('Cart total changed; review the cart before checkout')

    const createdOrder = await sudo.query.Order.createOne({
      data: {
        orderNumber: orderNumber(),
        idempotencyKey,
        guestTokenHash: replayToken ? hashGuestCartToken(replayToken) : undefined,
        checkoutEvidence: {
          policyVersion: input.policyVersion,
          statementKey: input.statementKey,
          acceptedAt: new Date().toISOString(),
          captureMethod: 'storefront_checkout',
          idempotencyKey,
        },
        email,
        phone: input.phone?.trim() || undefined,
        customerName: customerName || undefined,
        status: 'processing',
        fulfillmentMethod: input.fulfillmentMethod,
        subtotalAmount: totals.subtotalAmount,
        taxAmount: totals.taxAmount,
        deliveryAmount: totals.deliveryAmount,
        totalAmount: totals.totalAmount,
        currencyCode: current.items[0].product.currencyCode,
        pickupAt: input.pickupAt || undefined,
        deliveryWindow: input.deliveryWindow || undefined,
        shippingAddressSnapshot: (shippingAddress || undefined) as any,
        organization: { connect: { id: current.organization.id } },
        location: { connect: { id: current.location.id } },
        customer: current.customer?.id ? { connect: { id: current.customer.id } } : undefined,
        patient: current.customer?.patientProfile?.id ? { connect: { id: current.customer.patientProfile.id } } : undefined,
        cart: { connect: { id: current.id } },
      },
      query: 'id orderNumber',
    })

    for (const item of current.items) {
      let remaining = item.quantity
      const allocations: Array<{ lotId: string; lotNumber: string; quantity: number; expirationDate: string }> = []
      for (const lot of item.product.inventoryLots) {
        if (remaining === 0) break
        if (lot.location?.id !== current.location.id || !isLotEligible(lot)) continue
        const available = eligibleLotQuantity(lot)
        const allocated = Math.min(remaining, available)
        if (!allocated) continue
        await sudo.query.InventoryLot.updateOne({ where: { id: lot.id }, data: { quantityAvailable: lot.quantityAvailable - allocated } })
        await sudo.query.InventoryMovement.createOne({
          data: {
            movementType: 'sale',
            quantityDelta: -allocated,
            reason: `Order ${createdOrder.orderNumber}`,
            idempotencyKey: `order:${createdOrder.id}:lot:${lot.id}`,
            organization: { connect: { id: current.organization.id } },
            location: { connect: { id: current.location.id } },
            product: { connect: { id: item.product.id } },
            lot: { connect: { id: lot.id } },
            actor: context.session?.itemId ? { connect: { id: context.session.itemId } } : undefined,
          },
        })
        allocations.push({ lotId: lot.id, lotNumber: lot.lotNumber, quantity: allocated, expirationDate: lot.expirationDate })
        remaining -= allocated
      }
      if (remaining > 0) throw new DomainError(`Insufficient eligible lot inventory for ${item.product.title}`)
      await sudo.query.OrderLineItem.createOne({
        data: {
          order: { connect: { id: createdOrder.id } },
          product: { connect: { id: item.product.id } },
          title: item.product.title,
          sku: item.product.sku,
          ndc11Snapshot: item.product.drugReference?.ndc11 || undefined,
          quantity: item.quantity,
          unitPriceAmount: item.unitPriceAmount,
          lineTotalAmount: item.unitPriceAmount * item.quantity,
          imageUrl: item.product.imageUrl || undefined,
          prescriptionRequirementSnapshot: item.product.prescriptionRequirement,
          metadata: { productId: item.product.id, handle: item.product.handle },
          lotAllocationSnapshot: allocations,
        },
      })
    }

    const fulfillment = await sudo.query.Fulfillment.createOne({
      data: {
        method: input.fulfillmentMethod,
        status: 'preparing',
        organization: { connect: { id: current.organization.id } },
        location: { connect: { id: current.location.id } },
        order: { connect: { id: createdOrder.id } },
      },
      query: 'id',
    })
    await sudo.query.Payment.createOne({
      data: {
        amount: totals.totalAmount,
        currencyCode: current.items[0].product.currencyCode,
        status: manualTender ? 'pending' : 'captured',
        externalPaymentId: paymentId,
        processedAt: manualTender ? undefined : new Date().toISOString(),
        data: { providerStatus: paymentStatus.status },
        organization: { connect: { id: current.organization.id } },
        location: { connect: { id: current.location.id } },
        order: { connect: { id: createdOrder.id } },
        provider: { connect: { id: paymentSession.provider.id } },
        session: { connect: { id: paymentSession.id } },
      },
    })
    await sudo.query.PaymentSession.updateOne({ where: { id: paymentSession.id }, data: { status: manualTender ? 'pending' : 'captured', reconciliationStatus: 'ordered', failureReason: null, lastReconciledAt: new Date().toISOString() } })
    for (const item of current.items) await sudo.query.CartItem.deleteOne({ where: { id: item.id } })
    await sudo.query.Cart.updateOne({ where: { id: current.id }, data: { status: 'submitted' } })

    if (current.customer?.patientProfile?.id) {
      const consent = await sudo.query.ConsentRecord.createOne({
        data: {
          consentType: 'privacy_notice',
          policyVersion: input.policyVersion,
          statementKey: input.statementKey,
          accepted: true,
          captureMethod: 'storefront_checkout',
          patient: { connect: { id: current.customer.patientProfile.id } },
          actor: current.customer.id ? { connect: { id: current.customer.id } } : undefined,
          order: { connect: { id: createdOrder.id } },
          evidence: { fulfillmentMethod: input.fulfillmentMethod, idempotencyKey },
        },
        query: 'id',
      })
      await sudo.query.Order.updateOne({ where: { id: createdOrder.id }, data: { consent: { connect: { id: consent.id } } } })
    }
    await recordAuditAndOutbox(transactionContext, {
      eventKey: `order.submitted:${idempotencyKey}`,
      organizationId: current.organization.id,
      locationId: current.location.id,
      actorId: context.session?.itemId,
      patientId: current.customer?.patientProfile?.id,
      eventType: 'order.submitted',
      resourceType: 'Order',
      resourceId: createdOrder.id,
      metadata: { fulfillmentMethod: input.fulfillmentMethod, fulfillmentId: fulfillment.id, totalAmount: totals.totalAmount },
    })
    return {
      success: true,
      reused: false,
      orderId: createdOrder.id,
      orderNumber: createdOrder.orderNumber,
      status: 'processing',
      fulfillmentStatus: 'preparing',
      totalAmount: totals.totalAmount,
      currencyCode: current.items[0].product.currencyCode,
      guestOrderToken: replayToken,
    }
    })
  } catch (error) {
    const completedCart = await context.sudo().query.Cart.findOne({
      where: { id: cart.id },
      query: 'id status order { id orderNumber idempotencyKey status totalAmount currencyCode fulfillment { status } }',
    })
    if (completedCart?.status === 'submitted' && completedCart.order) {
      if (completedCart.order.idempotencyKey === idempotencyKey) return checkoutReplay({ ...cart, order: completedCart.order }, idempotencyKey, replayToken)
      throw new DomainError('Cart was committed by another checkout request; payment remains bound to the committed order')
    }
    const recoveryState = await context.sudo().query.PaymentSession.findOne({
      where: { id: paymentSession.id },
      query: 'id payment { id order { id } } cart { order { id } }',
    })
    if (recoveryState?.payment?.order?.id || recoveryState?.cart?.order?.id) {
      throw new DomainError('Payment is already bound to a committed order and cannot be compensated')
    }
    if (manualTender) throw error
    let compensation: any = null
    let compensationError: unknown = null
    try {
      compensation = await refundPayment({
        provider,
        paymentId,
        amount: cart.totalAmount,
        currency: cart.items[0]?.product?.currencyCode || 'USD',
        idempotencyKey: `checkout-compensation:${paymentSession.id}`,
      })
      if (!['refunded', 'succeeded'].includes(compensation?.status)) throw new DomainError(`Provider returned ${compensation?.status || 'unknown'}`)
    } catch (cause) {
      compensationError = cause
    }
    await withDomainTransaction(context, [`payment-session:${paymentSession.id}`], async (transactionContext) => {
      await transactionContext.sudo().query.PaymentSession.updateOne({
        where: { id: paymentSession.id },
        data: {
          status: compensationError ? 'compensation_pending' : 'compensated',
          reconciliationStatus: compensationError ? 'compensation_pending' : 'compensated',
          failureReason: compensationError
            ? `Order creation failed: ${error instanceof Error ? error.message : 'unknown'}; compensation failed: ${compensationError instanceof Error ? compensationError.message : 'unknown'}`.slice(0, 2000)
            : `Order creation failed and payment was compensated: ${error instanceof Error ? error.message : 'unknown'}`.slice(0, 2000),
          lastReconciledAt: new Date().toISOString(),
          data: { ...(paymentSession.data || {}), compensation },
        },
      })
      await recordAuditAndOutbox(transactionContext, {
        eventKey: `payment.checkout_recovery:${paymentSession.id}`,
        organizationId: cart.organization.id,
        locationId: cart.location.id,
        actorId: context.session?.itemId,
        eventType: compensationError ? 'payment.compensation_required' : 'payment.compensated',
        resourceType: 'PaymentSession',
        resourceId: paymentSession.id,
        metadata: { cartId: cart.id, idempotencyKey, paymentId },
      })
    })
    if (compensationError) throw new DomainError('Payment settled but order creation failed. Recovery is pending; contact the pharmacy with the cart reference.')
    throw new DomainError('Order creation failed after payment. The payment was automatically refunded; retry checkout with a new payment session.')
  }
}
