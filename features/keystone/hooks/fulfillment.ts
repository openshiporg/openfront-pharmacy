const TRANSITIONS: Record<string, string[]> = {
  pending: ['preparing', 'cancelled'],
  preparing: ['ready', 'out_for_delivery', 'cancelled'],
  ready: ['handed_off', 'cancelled'],
  out_for_delivery: ['handed_off', 'cancelled'],
  handed_off: [],
  cancelled: [],
}

export function assertFulfillmentTransition(from: string, to: string) {
  if (from === to) return
  if (!TRANSITIONS[from]?.includes(to)) throw new Error(`Invalid fulfillment transition: ${from} -> ${to}`)
}

export const fulfillmentHooks = {
  async validateInput({ operation, resolvedData, item, context, addValidationError }: any) {
    if (operation === 'create') {
      const organizationId = resolvedData.organization?.connect?.id
      const locationId = resolvedData.location?.connect?.id
      const orderId = resolvedData.order?.connect?.id
      if (!organizationId || !locationId || !orderId) {
        addValidationError('Fulfillment requires organization, location, and order relationships')
      } else {
        const order = await context.sudo().query.Order.findOne({ where: { id: orderId }, query: 'organization { id } location { id } fulfillment { id }' })
        if (!order || order.organization?.id !== organizationId || order.location?.id !== locationId || order.fulfillment?.id) {
          addValidationError('Fulfillment must be the sole fulfillment for one tenant order')
        }
      }
    }
    if (operation === 'update' && resolvedData.status) {
      try {
        assertFulfillmentTransition(item.status, resolvedData.status)
      } catch (error) {
        addValidationError(error instanceof Error ? error.message : 'Invalid fulfillment transition')
      }
    }
  },
  resolveInput({ operation, resolvedData }: any) {
    if (operation !== 'update') return resolvedData
    if (resolvedData.status === 'ready' && !resolvedData.readyAt) return { ...resolvedData, readyAt: new Date().toISOString() }
    if (resolvedData.status === 'handed_off' && !resolvedData.handedOffAt) return { ...resolvedData, handedOffAt: new Date().toISOString() }
    return resolvedData
  },
  beforeOperation({ operation, inputData }: any) {
    if (operation === 'update') {
      if (['organization', 'location', 'order', 'method'].some((field) => inputData?.[field] !== undefined)) throw new Error('Fulfillment identity and method are immutable')
    }
    if (operation === 'delete') throw new Error('Fulfillment lifecycle evidence cannot be deleted')
  },
}
