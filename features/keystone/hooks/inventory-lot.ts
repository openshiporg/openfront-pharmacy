export function validateLotQuantities(input: {
  quantityReceived: number
  quantityAvailable: number
  quantityQuarantined: number
  coldChainRequired?: boolean
  coldChainEvidenceComplete?: boolean
  minimumTemperatureC?: number | null
  maximumTemperatureC?: number | null
  status?: string
}) {
  for (const [name, value] of Object.entries({
    quantityReceived: input.quantityReceived,
    quantityAvailable: input.quantityAvailable,
    quantityQuarantined: input.quantityQuarantined,
  })) {
    if (!Number.isInteger(value) || value < 0) throw new Error(`${name} must be a non-negative integer`)
  }
  if (input.quantityQuarantined > input.quantityAvailable) throw new Error('Quarantined quantity cannot exceed available quantity')
  if (input.coldChainRequired) {
    if (typeof input.minimumTemperatureC !== 'number' || typeof input.maximumTemperatureC !== 'number') {
      throw new Error('Cold-chain lots require a temperature range')
    }
    if (input.minimumTemperatureC >= input.maximumTemperatureC) throw new Error('Cold-chain temperature range is invalid')
    if (input.status === 'available' && !input.coldChainEvidenceComplete) {
      throw new Error('Cold-chain evidence is required before a lot becomes available')
    }
  }
}

export const inventoryLotHooks = {
  resolveInput({ operation, resolvedData, item }: any) {
    if (operation === 'delete') return resolvedData
    const quantityAvailable = resolvedData.quantityAvailable ?? item?.quantityAvailable
    const status = resolvedData.status ?? item?.status
    if (quantityAvailable === 0 && !['quarantined', 'recalled', 'expired'].includes(status)) {
      return { ...resolvedData, status: 'depleted' }
    }
    return resolvedData
  },
  async validateInput({ operation, resolvedData, item, context, addValidationError }: any) {
    if (operation === 'delete') return
    const merged = { ...item }
    for (const [field, value] of Object.entries(resolvedData)) {
      if (value !== undefined) merged[field] = value
    }
    try {
      validateLotQuantities(merged)
    } catch (error) {
      addValidationError(error instanceof Error ? error.message : 'Invalid inventory lot')
    }
    const productId = resolvedData.product?.connect?.id || item?.productId
    const locationId = resolvedData.location?.connect?.id || item?.locationId
    if (!productId || !locationId) {
      addValidationError('Inventory lot requires product and location')
      return
    }
    const [product, location] = await Promise.all([
      context.sudo().query.Product.findOne({ where: { id: productId }, query: 'organization { id } location { id }' }),
      context.sudo().query.PharmacyLocation.findOne({ where: { id: locationId }, query: 'organization { id }' }),
    ])
    if (!product || !location || product.organization?.id !== location.organization?.id || product.location?.id !== locationId) {
      addValidationError('Inventory lot product and location must belong to the same tenant')
    }
  },
  beforeOperation({ operation, resolvedData, item }: any) {
    if (operation === 'delete' && (item?.quantityAvailable > 0 || item?.quantityQuarantined > 0)) {
      throw new Error('A non-empty inventory lot cannot be deleted')
    }
    if (operation === 'update') {
      const immutable = ['lotNumber', 'product', 'location', 'quantityReceived', 'receivedAt']
      if (immutable.some((field) => resolvedData[field] !== undefined)) {
        throw new Error('Inventory lot identity and receiving snapshot are immutable')
      }
    }
  },
}
