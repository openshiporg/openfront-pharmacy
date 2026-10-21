import { createHash } from 'node:crypto'
import type { Context } from '.keystone/types'
import { requirePermission, requireTenantMembership } from './lib/authorization'
import { createHumanApproval, recordAuditAndOutbox } from './lib/evidence'
import { withDomainTransaction } from './lib/transaction'
import { isProductAtActiveTenantLocation } from '../workflows/product-location'

export async function receiveInventoryLot(
  _root: unknown,
  args: {
    productId: string
    locationId: string
    supplierId?: string | null
    lotNumber: string
    serialNumber?: string | null
    expirationDate: string
    quantity: number
    coldChainRequired: boolean
    minimumTemperatureC?: number | null
    maximumTemperatureC?: number | null
    coldChainEvidenceComplete: boolean
    reason: string
    idempotencyKey: string
    attested: boolean
  },
  context: Context,
) {
  requirePermission(context, 'canManageInventory')
  if (!Number.isInteger(args.quantity) || args.quantity < 1) throw new Error('Received quantity must be a positive integer')
  if (!args.idempotencyKey?.trim() || !args.lotNumber?.trim()) throw new Error('Lot number and idempotency key are required')
  const expirationDate = new Date(args.expirationDate)
  if (Number.isNaN(expirationDate.getTime()) || expirationDate.getTime() <= Date.now()) throw new Error('Expiration date must be in the future')
  if (args.coldChainRequired) throw new Error('Cold-chain receiving is not supported yet')
  const requestFingerprint = createHash('sha256').update(JSON.stringify({ productId: args.productId, locationId: args.locationId, supplierId: args.supplierId || null, lotNumber: args.lotNumber.trim(), serialNumber: args.serialNumber?.trim() || null, expirationDate: expirationDate.toISOString(), quantity: args.quantity, coldChainRequired: args.coldChainRequired, minimumTemperatureC: args.minimumTemperatureC ?? null, maximumTemperatureC: args.maximumTemperatureC ?? null, coldChainEvidenceComplete: args.coldChainEvidenceComplete, reason: args.reason?.trim(), attested: args.attested })).digest('hex')

  return withDomainTransaction(context, [`inventory-idempotency:${args.idempotencyKey}`, `product:${args.productId}`, `lot-number:${args.locationId}:${args.lotNumber}`], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const existing = await sudo.query.InventoryMovement.findOne({ where: { idempotencyKey: args.idempotencyKey }, query: 'id requestFingerprint lot { id quantityAvailable location { id } product { organization { id } } }' })
    if (existing) {
      const organizationId = existing.lot?.product?.organization?.id
      const locationId = existing.lot?.location?.id
      if (!organizationId || !locationId) throw new Error('Receiving replay scope is incomplete; operator reconciliation is required')
      await requireTenantMembership(transactionContext, { organizationId, locationId })
      if (existing.requestFingerprint !== requestFingerprint) throw new Error('Receiving idempotency key was reused with different input')
      return { success: true, reused: true, movementId: existing.id, lotId: existing.lot.id, quantityAvailable: existing.lot.quantityAvailable }
    }
    const [product, location, supplier] = await Promise.all([
      sudo.query.Product.findOne({ where: { id: args.productId }, query: 'id organization { id } location { id } coldChainRequired' }),
      sudo.query.PharmacyLocation.findOne({ where: { id: args.locationId }, query: 'id status organization { id status }' }),
      args.supplierId ? sudo.query.Supplier.findOne({ where: { id: args.supplierId }, query: 'id organization { id } status' }) : null,
    ])
    if (!isProductAtActiveTenantLocation(product, location)) {
      throw new Error('This product cannot be received at this location')
    }
    if (args.supplierId && (!supplier || supplier.organization?.id !== location.organization.id || supplier.status !== 'active')) {
      throw new Error('Supplier must be active in the receiving organization')
    }
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: location.organization.id, locationId: location.id })
    const approval = await createHumanApproval(transactionContext, {
      organizationId: location.organization.id,
      locationId: location.id,
      actorId: userId,
      actionType: 'inventory_adjustment',
      reason: args.reason,
      attested: args.attested,
      evidence: { action: 'receive', lotNumber: args.lotNumber.trim(), quantity: args.quantity, idempotencyKey: args.idempotencyKey },
    })
    const lot = await sudo.query.InventoryLot.createOne({
      data: {
        lotNumber: args.lotNumber.trim(),
        serialNumber: args.serialNumber?.trim() || undefined,
        expirationDate: expirationDate.toISOString(),
        quantityReceived: args.quantity,
        quantityAvailable: args.quantity,
        quantityQuarantined: 0,
        status: 'available',
        coldChainRequired: false,
        minimumTemperatureC: null,
        maximumTemperatureC: null,
        coldChainEvidenceComplete: true,
        product: { connect: { id: product.id } },
        location: { connect: { id: location.id } },
        supplier: supplier ? { connect: { id: supplier.id } } : undefined,
      },
      query: 'id quantityAvailable',
    })
    const movement = await sudo.query.InventoryMovement.createOne({
      data: {
        movementType: 'receive',
        quantityDelta: args.quantity,
        reason: args.reason,
        idempotencyKey: args.idempotencyKey,
        requestFingerprint,
        organization: { connect: { id: location.organization.id } },
        location: { connect: { id: location.id } },
        product: { connect: { id: product.id } },
        lot: { connect: { id: lot.id } },
        actor: { connect: { id: userId } },
        approval: { connect: { id: approval.id } },
      },
      query: 'id',
    })
    await recordAuditAndOutbox(transactionContext, {
      eventKey: `inventory.received:${args.idempotencyKey}`,
      organizationId: location.organization.id,
      locationId: location.id,
      actorId: userId,
      eventType: 'inventory.received',
      resourceType: 'InventoryLot',
      resourceId: lot.id,
      metadata: { movementId: movement.id, productId: product.id, lotNumber: args.lotNumber.trim(), serialRecorded: Boolean(args.serialNumber?.trim()), quantity: args.quantity },
    })
    return { success: true, reused: false, movementId: movement.id, lotId: lot.id, quantityAvailable: lot.quantityAvailable, approvalId: approval.id }
  })
}

export async function adjustInventoryLot(
  _root: unknown,
  args: { lotId: string; targetQuantity: number; reason: string; idempotencyKey: string; attested: boolean },
  context: Context,
) {
  requirePermission(context, 'canManageInventory')
  if (!Number.isInteger(args.targetQuantity) || args.targetQuantity < 0) throw new Error('Target quantity must be a non-negative integer')
  if (!args.idempotencyKey?.trim()) throw new Error('Idempotency key is required')
  const requestFingerprint = createHash('sha256').update(JSON.stringify({ lotId: args.lotId, targetQuantity: args.targetQuantity, reason: args.reason?.trim(), attested: args.attested })).digest('hex')

  return withDomainTransaction(context, [`inventory-idempotency:${args.idempotencyKey}`, `lot:${args.lotId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const existing = await sudo.query.InventoryMovement.findOne({
      where: { idempotencyKey: args.idempotencyKey },
      query: 'id quantityDelta requestFingerprint lot { id quantityAvailable product { organization { id } } location { id } }',
    })
    if (existing) {
      const organizationId = existing.lot?.product?.organization?.id
      const locationId = existing.lot?.location?.id
      if (!organizationId || !locationId) throw new Error('Inventory replay scope is incomplete; operator reconciliation is required')
      await requireTenantMembership(transactionContext, { organizationId, locationId })
      if (existing.lot?.id !== args.lotId || existing.requestFingerprint !== requestFingerprint) throw new Error('Inventory idempotency key was reused with different input')
      return { success: true, reused: true, movementId: existing.id, quantityAvailable: existing.lot.quantityAvailable }
    }

    const lot = await sudo.query.InventoryLot.findOne({
      where: { id: args.lotId },
      query: 'id quantityAvailable quantityQuarantined status product { id organization { id } } location { id }',
    })
    if (!lot) throw new Error('Inventory lot not found')
    const { userId } = await requireTenantMembership(transactionContext, {
      organizationId: lot.product.organization.id,
      locationId: lot.location.id,
    })
    if (args.targetQuantity < lot.quantityQuarantined) throw new Error('Available quantity cannot be lower than quarantined quantity')
    const approval = await createHumanApproval(transactionContext, {
      organizationId: lot.product.organization.id,
      locationId: lot.location.id,
      actorId: userId,
      actionType: 'inventory_adjustment',
      reason: args.reason,
      attested: args.attested,
      evidence: { previousQuantity: lot.quantityAvailable, targetQuantity: args.targetQuantity, idempotencyKey: args.idempotencyKey },
    })
    const quantityDelta = args.targetQuantity - lot.quantityAvailable
    await sudo.query.InventoryLot.updateOne({
      where: { id: lot.id },
      data: { quantityAvailable: args.targetQuantity, status: args.targetQuantity === 0 ? 'depleted' : lot.status },
    })
    const movement = await sudo.query.InventoryMovement.createOne({
      data: {
        movementType: 'adjust',
        quantityDelta,
        reason: args.reason,
        idempotencyKey: args.idempotencyKey,
        requestFingerprint,
        organization: { connect: { id: lot.product.organization.id } },
        location: { connect: { id: lot.location.id } },
        product: { connect: { id: lot.product.id } },
        lot: { connect: { id: lot.id } },
        actor: { connect: { id: userId } },
        approval: { connect: { id: approval.id } },
      },
      query: 'id',
    })
    await recordAuditAndOutbox(transactionContext, {
      eventKey: `inventory.adjusted:${args.idempotencyKey}`,
      organizationId: lot.product.organization.id,
      locationId: lot.location.id,
      actorId: userId,
      eventType: 'inventory.adjusted',
      resourceType: 'InventoryLot',
      resourceId: lot.id,
      metadata: { movementId: movement.id, quantityDelta, quantityAvailable: args.targetQuantity },
    })
    return { success: true, reused: false, movementId: movement.id, quantityAvailable: args.targetQuantity }
  })
}

export async function quarantineRecallLots(
  _root: unknown,
  args: { recallId: string; reason: string; attested: boolean },
  context: Context,
) {
  requirePermission(context, 'canManageRecalls')
  const candidate = await context.sudo().query.Recall.findOne({ where: { id: args.recallId }, query: 'id lots { id }' })
  if (!candidate) throw new Error('Recall not found')

  return withDomainTransaction(
    context,
    [`recall:${args.recallId}`, ...candidate.lots.map((lot: any) => `lot:${lot.id}`)],
    async (transactionContext) => {
      const sudo = transactionContext.sudo()
      const recall = await sudo.query.Recall.findOne({
        where: { id: args.recallId },
        query: 'id status organization { id } location { id } approval { id } lots { id quantityAvailable product { id } location { id } }',
      })
      if (!recall) throw new Error('Recall not found')
      const { userId } = await requireTenantMembership(transactionContext, {
        organizationId: recall.organization.id,
        locationId: recall.location?.id,
        organizationWide: !recall.location?.id,
      })
      if (recall.status === 'quarantined') {
        return { success: true, reused: true, recallId: recall.id, status: recall.status, lotCount: recall.lots.length, approvalId: recall.approval?.id }
      }
      if (recall.status !== 'active') throw new Error('Recall must be active before quarantine')
      if (!recall.lots.length) throw new Error('Recall has no affected lots')

      const approval = await createHumanApproval(transactionContext, {
        organizationId: recall.organization.id,
        locationId: recall.location?.id,
        actorId: userId,
        actionType: 'recall_disposition',
        reason: args.reason,
        attested: args.attested,
        evidence: { recallId: recall.id, lotCount: recall.lots.length },
      })
      for (const lot of recall.lots) {
        await sudo.query.InventoryLot.updateOne({
          where: { id: lot.id },
          data: { status: 'recalled', quantityQuarantined: lot.quantityAvailable },
        })
        await sudo.query.InventoryMovement.createOne({
          data: {
            movementType: 'recall',
            quantityDelta: 0,
            reason: args.reason,
            idempotencyKey: `recall:${recall.id}:lot:${lot.id}`,
            organization: { connect: { id: recall.organization.id } },
            location: { connect: { id: lot.location.id } },
            product: { connect: { id: lot.product.id } },
            lot: { connect: { id: lot.id } },
            actor: { connect: { id: userId } },
            approval: { connect: { id: approval.id } },
          },
        })
      }
      await sudo.query.Recall.updateOne({
        where: { id: recall.id },
        data: { status: 'quarantined', approval: { connect: { id: approval.id } } },
      })
      await recordAuditAndOutbox(transactionContext, {
        eventKey: `recall.quarantined:${recall.id}`,
        organizationId: recall.organization.id,
        locationId: recall.location?.id,
        actorId: userId,
        eventType: 'recall.lots_quarantined',
        resourceType: 'Recall',
        resourceId: recall.id,
        metadata: { lotIds: recall.lots.map((lot: any) => lot.id), approvalId: approval.id },
      })
      return { success: true, reused: false, recallId: recall.id, status: 'quarantined', lotCount: recall.lots.length, approvalId: approval.id }
    },
  )
}
