const NEGATIVE_MOVEMENTS = new Set(['dispense', 'sale', 'reserve', 'expire', 'destroy'])
const POSITIVE_MOVEMENTS = new Set(['receive', 'return', 'release'])

export function validateMovementSign(type: string, quantityDelta: number) {
  if (!Number.isInteger(quantityDelta)) throw new Error('Inventory movement quantity must be an integer')
  if (NEGATIVE_MOVEMENTS.has(type) && quantityDelta >= 0) throw new Error(`${type} inventory movements must reduce quantity`)
  if (POSITIVE_MOVEMENTS.has(type) && quantityDelta <= 0) throw new Error(`${type} inventory movements must increase quantity`)
}

export const inventoryMovementHooks = {
  resolveInput({ operation, resolvedData, context }: any) {
    if (operation === 'create' && !resolvedData.actor && context.session?.itemId) {
      return { ...resolvedData, actor: { connect: { id: context.session.itemId } } }
    }
    return resolvedData
  },
  async validateInput({ operation, resolvedData, context, addValidationError }: any) {
    if (operation !== 'create') return
    try {
      validateMovementSign(resolvedData.movementType, resolvedData.quantityDelta)
    } catch (error) {
      addValidationError(error instanceof Error ? error.message : 'Invalid inventory movement')
    }
    const organizationId = resolvedData.organization?.connect?.id
    const locationId = resolvedData.location?.connect?.id
    const productId = resolvedData.product?.connect?.id
    const lotId = resolvedData.lot?.connect?.id
    if (!organizationId || !locationId || !productId || !lotId) {
      addValidationError('Inventory movement requires organization, location, product, and lot')
      return
    }
    const lot = await context.sudo().query.InventoryLot.findOne({
      where: { id: lotId },
      query: 'product { id organization { id } } location { id }',
    })
    if (!lot || lot.product?.id !== productId || lot.product?.organization?.id !== organizationId || lot.location?.id !== locationId) {
      addValidationError('Inventory movement relations must identify one tenant lot')
    }
  },
  beforeOperation({ operation }: any) {
    if (operation !== 'create') throw new Error('Inventory movements are immutable evidence')
  },
}
