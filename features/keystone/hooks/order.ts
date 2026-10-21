import { assertMinorUnits } from '../../lib/minor-units'

const IMMUTABLE_ORDER_FIELDS = new Set([
  'orderNumber',
  'idempotencyKey',
  'guestTokenHash',
  'checkoutEvidence',
  'fulfillmentMethod',
  'subtotalAmount',
  'taxAmount',
  'deliveryAmount',
  'totalAmount',
  'currencyCode',
  'shippingAddressSnapshot',
  'billingAddressSnapshot',
  'organization',
  'location',
  'customer',
  'patient',
  'prescription',
  'cart',
])

export function validateOrderTotals(input: { subtotalAmount: number; taxAmount: number; deliveryAmount: number; totalAmount: number }) {
  for (const [name, value] of Object.entries(input)) {
    assertMinorUnits(value, name)
  }
  if (input.totalAmount !== input.subtotalAmount + input.taxAmount + input.deliveryAmount) {
    throw new Error('Order total does not match its immutable component snapshots')
  }
}

export const orderHooks = {
  validateInput({ operation, resolvedData, inputData, addValidationError }: any) {
    if (operation === 'create') {
      if (!resolvedData.idempotencyKey) addValidationError('Order idempotency key is required')
      const sourceCount = [
        Boolean(resolvedData.cart?.connect?.id),
        Boolean(resolvedData.prescription?.connect?.id),
        ['pos', 'pickup'].includes(resolvedData.fulfillmentMethod)
          && resolvedData.checkoutEvidence?.workflow === 'operator_attested_otc_pos_cash'
          && Boolean(resolvedData.approval?.connect?.id)
          && resolvedData.checkoutEvidence.approvalId === resolvedData.approval.connect.id,
      ].filter(Boolean).length
      if (!resolvedData.organization?.connect?.id || !resolvedData.location?.connect?.id || sourceCount !== 1) {
        addValidationError('Order requires organization, location, and exactly one authorized cart, prescription, or cash-POS source')
      }
      try {
        validateOrderTotals({
          subtotalAmount: resolvedData.subtotalAmount,
          taxAmount: resolvedData.taxAmount,
          deliveryAmount: resolvedData.deliveryAmount,
          totalAmount: resolvedData.totalAmount,
        })
      } catch (error) {
        addValidationError(error instanceof Error ? error.message : 'Invalid order totals')
      }
    }
    if (operation === 'update') {
      const changedImmutableFields = Object.keys(inputData || {}).filter((field) => IMMUTABLE_ORDER_FIELDS.has(field))
      if (changedImmutableFields.length) addValidationError(`Checkout identity, tenant ownership, and snapshots are immutable: ${changedImmutableFields.join(', ')}`)
    }
  },
  beforeOperation({ operation, item }: any) {
    if (operation === 'delete') throw new Error(`Order ${item?.id || ''} is immutable lifecycle evidence`)
  },
}

export const orderLineItemHooks = {
  validateInput({ operation, resolvedData, addValidationError }: any) {
    if (operation !== 'create') return
    if (!resolvedData.order?.connect?.id || !resolvedData.product?.connect?.id) {
      addValidationError('Order line requires order and product relationships')
    }
    if (resolvedData.lineTotalAmount !== resolvedData.unitPriceAmount * resolvedData.quantity) {
      addValidationError('Order line total does not match unit price and quantity snapshots')
    }
  },
  beforeOperation({ operation }: any) {
    if (operation !== 'create') throw new Error('Order line snapshots are immutable')
  },
}
