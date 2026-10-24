import { createHash } from 'node:crypto'
import type { Context } from '.keystone/types'
import { assertCashTender, calculateTaxAmount, calculateTaxableSubtotal } from '../workflows/commerce-policy'
import { eligibleLotQuantity, isLotEligible } from '../workflows/lot-eligibility'
import { requirePermission, requireTenantMembership } from './lib/authorization'
import { createHumanApproval, recordAuditAndOutbox } from './lib/evidence'
import { acquireTransactionLocks, withDomainTransaction } from './lib/transaction'
import { DomainError } from './lib/errors'

export async function recordPharmacyCashPolicy(
  _root: unknown,
  args: { organizationId: string; taxRateBps: number; policyReference: string; reason: string; attested: boolean },
  context: Context,
) {
  requirePermission(context, 'canManagePayments')
  requirePermission(context, 'canApproveConsequentialActions')
  if (!Number.isInteger(args.taxRateBps) || args.taxRateBps < 0 || args.taxRateBps > 10_000) throw new DomainError('Tax rate must be integer basis points between 0 and 10000')
  if (!args.policyReference?.trim()) throw new DomainError('Cash/tax policy source reference is required')
  return withDomainTransaction(context, [`cash-policy:${args.organizationId}`], async (transactionContext) => {
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: args.organizationId })
    const approval = await createHumanApproval(transactionContext, { organizationId: args.organizationId, actorId: userId, actionType: 'cash_policy', reason: args.reason, attested: args.attested, evidence: { taxRateBps: args.taxRateBps, policyReference: args.policyReference.trim(), scope: 'operator_attested_cash_direct_pay' } })
    await transactionContext.sudo().query.Organization.updateOne({ where: { id: args.organizationId }, data: { cashSalesEnabled: true, cashTaxRateBps: args.taxRateBps, cashTaxPolicyReference: args.policyReference.trim(), cashPolicyReviewedAt: new Date().toISOString(), cashPolicyReviewedBy: { connect: { id: userId } } }, query: 'id' })
    await recordAuditAndOutbox(transactionContext, { eventKey: `cash_policy.recorded:${args.organizationId}:${approval.id}`, organizationId: args.organizationId, actorId: userId, eventType: 'cash_policy.recorded', resourceType: 'Organization', resourceId: args.organizationId, metadata: { taxRateBps: args.taxRateBps, policyReference: args.policyReference.trim(), approvalId: approval.id } })
    return { success: true, organizationId: args.organizationId, status: 'enabled', taxRateBps: args.taxRateBps, approvalId: approval.id }
  })
}

export async function readCommittedPosReceipt(sudo: any, orderId: string, reused: boolean) {
  const order = await sudo.query.Order.findOne({
    where: { id: orderId },
    query: 'id orderNumber status createdAt subtotalAmount taxAmount totalAmount currencyCode lineItems(orderBy: { createdAt: asc }) { title sku quantity unitPriceAmount lineTotalAmount } payments { id status amount currencyCode tenderMethod cashReceivedAmount changeDueAmount }',
  })
  const payment = order?.payments?.find((entry: any) => entry.tenderMethod === 'cash')
  const lineSubtotal = (order?.lineItems || []).reduce((sum: number, line: any) => sum + line.lineTotalAmount, 0)
  if (!order || !payment || !['captured', 'refunded'].includes(payment.status) || payment.amount !== order.totalAmount || payment.currencyCode !== order.currencyCode || payment.cashReceivedAmount == null || payment.changeDueAmount == null || payment.cashReceivedAmount < payment.amount || payment.changeDueAmount !== payment.cashReceivedAmount - payment.amount || lineSubtotal !== order.subtotalAmount || order.subtotalAmount + order.taxAmount !== order.totalAmount) {
    throw new DomainError('Committed POS receipt evidence is incomplete or inconsistent; do not submit a new sale')
  }
  return {
    success: true,
    reused,
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    recordedAt: order.createdAt,
    lines: (order.lineItems || []).map((line: any) => ({ title: line.title, sku: line.sku || '', quantity: line.quantity, unitPriceAmount: line.unitPriceAmount, lineTotalAmount: line.lineTotalAmount })),
    subtotalAmount: order.subtotalAmount,
    taxAmount: order.taxAmount,
    totalAmount: order.totalAmount,
    currencyCode: order.currencyCode,
    paymentId: payment.id,
    paymentStatus: payment.status,
    cashReceivedAmount: payment.cashReceivedAmount,
    changeDueAmount: payment.changeDueAmount,
  }
}

// Adapt E-commerce/Restaurant's cart-owned customer association without email
// claiming or clinical identity linking. Only a current scoped customer cart is admitted.
export async function pharmacyPosCustomers(_root: unknown, args: { locationId: string }, context: Context) {
  requirePermission(context, 'canManageOrders')
  const location = await context.sudo().query.PharmacyLocation.findOne({ where: { id: args.locationId }, query: 'id organization { id }' })
  if (!location) throw new DomainError('Location not found')
  await requireTenantMembership(context, { organizationId: location.organization.id, locationId: location.id })
  const carts = await context.sudo().query.Cart.findMany({ where: { organization: { id: { equals: location.organization.id } }, location: { id: { equals: location.id } }, status: { equals: 'active' }, expiresAt: { gt: new Date().toISOString() }, customer: { role: null }, items: { some: { quantity: { gt: 0 } } } }, orderBy: { createdAt: 'desc' }, take: 100, query: 'id customer { id name }' })
  const seen = new Set<string>()
  return carts.filter(cart => { if (!cart.customer?.id || seen.has(cart.customer.id)) return false; seen.add(cart.customer.id); return true }).map(cart => ({ id: cart.id, label: `${cart.customer!.name} · ${cart.id.slice(-6)}`, scopeId: location.id }))
}

export async function submitPharmacyPosCashOrder(
  _root: unknown,
  args: { locationId: string; customerCartId?: string | null; fulfillmentMethod?: string | null; items: Array<{ productId: string; quantity: number }>; cashReceivedAmount: number; idempotencyKey: string; reason: string; attested: boolean },
  context: Context,
) {
  requirePermission(context, 'canManageOrders')
  requirePermission(context, 'canManagePayments')
  requirePermission(context, 'canManageInventory')
  const method = args.fulfillmentMethod || 'pos'
  if (!['pos', 'pickup'].includes(method)) throw new DomainError('Cash fulfillment method is invalid')
  const items = (args.items || []).filter((entry) => entry?.productId && Number.isInteger(entry.quantity) && entry.quantity > 0 && entry.quantity <= 99)
  if (!items.length || items.length > 50 || items.length !== args.items.length) throw new DomainError('POS order must contain 1-50 valid line items')
  if (!args.idempotencyKey?.trim() || args.idempotencyKey.length > 200) throw new DomainError('A request key is required')
  const requestFingerprint = createHash('sha256').update(JSON.stringify({ locationId: args.locationId, ...(args.customerCartId ? { customerCartId: args.customerCartId } : {}), ...(method === 'pickup' ? { fulfillmentMethod: method } : {}), items: [...items].sort((left, right) => left.productId.localeCompare(right.productId)), cashReceivedAmount: args.cashReceivedAmount, reason: args.reason?.trim(), attested: args.attested })).digest('hex')
  return withDomainTransaction(context, [`pos-cash:${args.idempotencyKey}`, ...(args.customerCartId ? [`cart:${args.customerCartId}`] : []), ...items.map((entry) => `product:${entry.productId}`)], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const existing = await sudo.query.Order.findOne({ where: { idempotencyKey: `pos-cash:${args.idempotencyKey}` }, query: 'id orderNumber status totalAmount currencyCode checkoutEvidence payments { id status } organization { id } location { id }' })
    if (existing) {
      if (!existing.organization?.id || !existing.location?.id) throw new DomainError('POS replay scope is incomplete; operator reconciliation is required')
      await requireTenantMembership(transactionContext, { organizationId: existing.organization.id, locationId: existing.location.id })
      if (existing.checkoutEvidence?.requestFingerprint !== requestFingerprint) throw new DomainError('POS idempotency key was reused with different input')
      return readCommittedPosReceipt(sudo, existing.id, true)
    }
    const location = await sudo.query.PharmacyLocation.findOne({ where: { id: args.locationId }, query: 'id name status pickupEnabled organization { id cashSalesEnabled cashTaxRateBps cashTaxPolicyReference cashPolicyReviewedAt }' })
    if (!location || location.status !== 'active') throw new DomainError('POS location not found')
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: location.organization.id, locationId: location.id })
    if (method === 'pickup' && location.pickupEnabled !== true) throw new DomainError('Pickup is unavailable at this location')
    let customerId: string | undefined
    if (args.customerCartId) {
      const cart = await sudo.query.Cart.findOne({ where: { id: args.customerCartId }, query: 'id status expiresAt organization { id } location { id } customer { id role { id } } items(take: 1) { id }' })
      if (!cart || cart.organization?.id !== location.organization.id || cart.location?.id !== location.id || cart.status !== 'active' || !cart.expiresAt || new Date(cart.expiresAt).getTime() <= Date.now() || !cart.customer?.id || cart.customer.role || !cart.items.length) throw new DomainError('Customer cart is not available in this tenant location')
      customerId = cart.customer.id
    }
    if (location.organization.cashSalesEnabled !== true || !location.organization.cashTaxPolicyReference?.trim() || !location.organization.cashPolicyReviewedAt) throw new DomainError('Operator-attested cash and tax policy must be configured before POS sales')
    const productIds = [...new Set(items.map((entry) => entry.productId))]
    if (productIds.length !== items.length) throw new DomainError('Combine duplicate POS product lines before submission')
    let products = await sudo.query.Product.findMany({ where: { id: { in: productIds } }, take: 50, query: 'id title sku imageUrl priceAmount currencyCode taxable status posAvailable prescriptionRequirement organization { id } location { id } drugReference { ndc11 } inventoryLots(orderBy: { expirationDate: asc }, take: 100) { id lotNumber status expirationDate quantityAvailable quantityQuarantined coldChainRequired coldChainEvidenceComplete recalls { status } location { id } }' })
    if (products.length !== items.length || products.some((product: any) => product.organization?.id !== location.organization.id || product.location?.id !== location.id || product.status !== 'published' || product.posAvailable !== true || product.prescriptionRequirement !== 'none')) throw new DomainError('Every POS item must be an available OTC product in this tenant location')
    await acquireTransactionLocks(transactionContext, products.flatMap((product: any) => product.inventoryLots.map((lot: any) => `lot:${lot.id}`)))
    products = await sudo.query.Product.findMany({ where: { id: { in: productIds } }, take: 50, query: 'id title sku imageUrl priceAmount currencyCode taxable status posAvailable prescriptionRequirement organization { id } location { id } drugReference { ndc11 } inventoryLots(orderBy: { expirationDate: asc }, take: 100) { id lotNumber status expirationDate quantityAvailable quantityQuarantined coldChainRequired coldChainEvidenceComplete recalls { status } location { id } }' })
    const currencies = [...new Set(products.map((product: any) => product.currencyCode))]
    if (currencies.length !== 1) throw new DomainError('POS order currency mismatch')
    const pricedItems = items.map((entry) => ({ ...entry, product: products.find((product: any) => product.id === entry.productId)! }))
    const subtotalAmount = pricedItems.reduce((sum, entry) => sum + entry.product.priceAmount * entry.quantity, 0)
    const taxableSubtotalAmount = calculateTaxableSubtotal(pricedItems.map((entry) => ({ unitPriceAmount: entry.product.priceAmount, quantity: entry.quantity, taxable: entry.product.taxable })))
    const taxAmount = calculateTaxAmount(taxableSubtotalAmount, location.organization.cashTaxRateBps || 0)
    const totalAmount = subtotalAmount + taxAmount
    const tender = assertCashTender(totalAmount, args.cashReceivedAmount)
    const approval = await createHumanApproval(transactionContext, { organizationId: location.organization.id, locationId: location.id, actorId: userId, actionType: 'cash_tender', reason: args.reason, attested: args.attested, evidence: { workflow: 'operator_attested_otc_pos_cash', subtotalAmount, taxableSubtotalAmount, taxAmount, totalAmount, cashReceivedAmount: tender.cashReceivedAmount, changeDueAmount: tender.changeDueAmount, taxRateBps: location.organization.cashTaxRateBps || 0, providerSettlementClaimed: false } })
    const suffix = createHash('sha256').update(args.idempotencyKey).digest('hex').slice(0, 12).toUpperCase()
    const order = await sudo.query.Order.createOne({ data: { orderNumber: `POS-${suffix}`, idempotencyKey: `pos-cash:${args.idempotencyKey}`, checkoutEvidence: { workflow: 'operator_attested_otc_pos_cash', customerCartId: args.customerCartId || null, customerId: customerId || null, approvalId: approval.id, requestFingerprint, taxRateBps: location.organization.cashTaxRateBps || 0, taxableSubtotalAmount, taxAmount, providerSettlementClaimed: false }, status: method === 'pickup' ? 'processing' : 'completed', fulfillmentMethod: method, subtotalAmount, taxAmount, deliveryAmount: 0, totalAmount, currencyCode: currencies[0], customer: customerId ? { connect: { id: customerId } } : undefined, organization: { connect: { id: location.organization.id } }, location: { connect: { id: location.id } }, approval: { connect: { id: approval.id } } }, query: 'id orderNumber status' })
    for (const entry of items) {
      const product = products.find((candidate: any) => candidate.id === entry.productId)!
      let remaining = entry.quantity
      const allocations: Array<{ lotId: string; lotNumber: string; quantity: number; expirationDate: string }> = []
      for (const lot of product.inventoryLots.filter((candidate: any) => candidate.location?.id === location.id && isLotEligible(candidate))) {
        if (remaining === 0) break
        const quantity = Math.min(remaining, eligibleLotQuantity(lot))
        if (quantity < 1) continue
        allocations.push({ lotId: lot.id, lotNumber: lot.lotNumber, quantity, expirationDate: lot.expirationDate })
        remaining -= quantity
      }
      if (remaining > 0) throw new DomainError(`Insufficient eligible inventory for ${product.title}`)
      await sudo.query.OrderLineItem.createOne({ data: { title: product.title, sku: product.sku, ndc11Snapshot: product.drugReference?.ndc11 || undefined, quantity: entry.quantity, unitPriceAmount: product.priceAmount, lineTotalAmount: product.priceAmount * entry.quantity, imageUrl: product.imageUrl || undefined, prescriptionRequirementSnapshot: 'none', metadata: { taxable: product.taxable !== false, taxableAmount: product.taxable === false ? 0 : product.priceAmount * entry.quantity }, lotAllocationSnapshot: allocations, order: { connect: { id: order.id } }, product: { connect: { id: product.id } } } })
      for (const allocation of allocations) {
        const lot = product.inventoryLots.find((candidate: any) => candidate.id === allocation.lotId)!
        const nextQuantity = lot.quantityAvailable - allocation.quantity
        await sudo.query.InventoryLot.updateOne({ where: { id: lot.id }, data: { quantityAvailable: nextQuantity, ...(nextQuantity === 0 ? { status: 'depleted' } : {}) } })
        await sudo.query.InventoryMovement.createOne({ data: { movementType: 'sale', quantityDelta: -allocation.quantity, reason: args.reason, idempotencyKey: `pos:${args.idempotencyKey}:${product.id}:${lot.id}`, organization: { connect: { id: location.organization.id } }, location: { connect: { id: location.id } }, product: { connect: { id: product.id } }, lot: { connect: { id: lot.id } }, actor: { connect: { id: userId } }, order: { connect: { id: order.id } }, approval: { connect: { id: approval.id } } } })
      }
    }
    const payment = await sudo.query.Payment.createOne({ data: { amount: totalAmount, currencyCode: currencies[0], status: 'captured', tenderMethod: 'cash', cashReceivedAmount: tender.cashReceivedAmount, changeDueAmount: tender.changeDueAmount, processedAt: new Date().toISOString(), data: { evidenceType: 'operator_attested_cash_received', approvalId: approval.id, providerSettlementClaimed: false }, organization: { connect: { id: location.organization.id } }, location: { connect: { id: location.id } }, order: { connect: { id: order.id } }, recordedBy: { connect: { id: userId } }, approval: { connect: { id: approval.id } } }, query: 'id status' })
    await sudo.query.Fulfillment.createOne({ data: { method, status: method === 'pickup' ? 'preparing' : 'handed_off', ...(method === 'pos' ? { readyAt: new Date().toISOString(), handedOffAt: new Date().toISOString() } : {}), organization: { connect: { id: location.organization.id } }, location: { connect: { id: location.id } }, order: { connect: { id: order.id } }, assignedTo: { connect: { id: userId } } } })
    await recordAuditAndOutbox(transactionContext, { eventKey: `pos.cash_sale:${args.idempotencyKey}`, organizationId: location.organization.id, locationId: location.id, actorId: userId, eventType: 'pos.cash_sale_recorded', resourceType: 'Order', resourceId: order.id, metadata: { paymentId: payment.id, lineCount: items.length, subtotalAmount, taxableSubtotalAmount, taxAmount, totalAmount, approvalId: approval.id, providerSettlementClaimed: false } })
    return readCommittedPosReceipt(sudo, order.id, false)
  })
}

export async function pharmacyPosCashReceipt(
  _root: unknown,
  args: { idempotencyKey: string },
  context: Context,
) {
  requirePermission(context, 'canManageOrders')
  requirePermission(context, 'canManagePayments')
  if (!args.idempotencyKey?.trim() || args.idempotencyKey.length > 200) throw new DomainError('A request key is required')
  const sudo = context.sudo()
  const order = await sudo.query.Order.findOne({
    where: { idempotencyKey: `pos-cash:${args.idempotencyKey}` },
    query: 'id organization { id } location { id }',
  })
  if (!order) return null
  if (!order.organization?.id || !order.location?.id) throw new DomainError('POS receipt scope is incomplete; operator reconciliation is required')
  await requireTenantMembership(context, { organizationId: order.organization.id, locationId: order.location.id })
  return readCommittedPosReceipt(sudo, order.id, true)
}

export async function refundPharmacyCashPayment(
  _root: unknown,
  args: { paymentId: string; cashReturnedAmount: number; idempotencyKey: string; reason: string; attested: boolean },
  context: Context,
) {
  requirePermission(context, 'canManagePayments')
  if (!args.idempotencyKey?.trim()) throw new DomainError('Idempotency key is required')
  const requestFingerprint = createHash('sha256').update(JSON.stringify({ paymentId: args.paymentId, cashReturnedAmount: args.cashReturnedAmount, reason: args.reason?.trim(), attested: args.attested })).digest('hex')
  return withDomainTransaction(context, [`payment:${args.paymentId}`, `cash-refund:${args.idempotencyKey}`], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const payment = await sudo.query.Payment.findOne({ where: { id: args.paymentId }, query: 'id amount status tenderMethod data organization { id } location { id } order { id patient { id } } approval { id }' })
    if (!payment || payment.tenderMethod !== 'cash') throw new DomainError('Cash payment not found')
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: payment.organization.id, locationId: payment.location?.id })
    const eventKey = `payment.cash_refunded:${args.idempotencyKey}`
    const existing = await sudo.query.AuditEvent.findOne({ where: { eventKey }, query: 'id resourceId metadata' })
    if (existing) {
      if (existing.resourceId !== payment.id || existing.metadata?.requestFingerprint !== requestFingerprint) throw new DomainError('Cash refund idempotency key was reused with different input')
      return { success: true, reused: true, paymentId: payment.id, status: 'refunded', amount: payment.amount }
    }
    if (payment.status === 'refunded') throw new DomainError('Cash payment was already refunded under a different request')
    if (payment.status !== 'captured' || args.cashReturnedAmount !== payment.amount) throw new DomainError('Bounded cash refunds must return the exact captured amount')
    const approval = await createHumanApproval(transactionContext, { organizationId: payment.organization.id, locationId: payment.location?.id, actorId: userId, actionType: 'cash_refund', reason: args.reason, attested: args.attested, evidence: { paymentId: payment.id, cashReturnedAmount: args.cashReturnedAmount, inventoryRestocked: false, custodyClaim: false } })
    await (transactionContext.prisma as any).payment.update({ where: { id: payment.id }, data: { status: 'refunded', data: { ...(payment.data || {}), cashRefund: { returnedAmount: args.cashReturnedAmount, returnedAt: new Date().toISOString(), actorId: userId, approvalId: approval.id, inventoryRestocked: false } }, approvalId: approval.id } })
    await recordAuditAndOutbox(transactionContext, { eventKey, organizationId: payment.organization.id, locationId: payment.location?.id, actorId: userId, patientId: payment.order?.patient?.id, eventType: 'payment.cash_refunded', resourceType: 'Payment', resourceId: payment.id, metadata: { orderId: payment.order?.id, amount: payment.amount, approvalId: approval.id, requestFingerprint, inventoryRestocked: false } })
    return { success: true, reused: false, paymentId: payment.id, status: 'refunded', amount: payment.amount }
  })
}
