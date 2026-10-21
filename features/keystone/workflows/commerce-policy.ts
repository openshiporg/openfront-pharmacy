import { assertMinorUnits } from '../../lib/minor-units'

type PublicCartProduct = {
  status?: string | null
  onlineAvailable?: boolean | null
  prescriptionRequirement?: string | null
}

export function assertProductCanEnterPublicCart(product: PublicCartProduct) {
  if (product.status !== 'published' || product.onlineAvailable !== true) {
    throw new Error('Product is not available for online ordering')
  }
  if (product.prescriptionRequirement !== 'none') {
    throw new Error('This product cannot be added to a public cart; use the authorized prescription workflow')
  }
}

function lineAmount(item: { unitPriceAmount: number; quantity: number }) {
  assertMinorUnits(item.unitPriceAmount, 'Unit price')
  if (!Number.isSafeInteger(item.quantity) || item.quantity < 0) throw new Error('Quantity must be a non-negative integer')
  return assertMinorUnits(item.unitPriceAmount * item.quantity, 'Line total')
}
export function calculateTaxableSubtotal(items: Array<{ unitPriceAmount: number; quantity: number; taxable?: boolean | null }>) {
  return items.reduce((sum, item) => {
    const amount = lineAmount(item)
    return assertMinorUnits(sum + (item.taxable === false ? 0 : amount), 'Taxable subtotal')
  }, 0)
}

export function calculateTaxAmount(subtotalAmount: number, taxRateBps: number) {
  assertMinorUnits(subtotalAmount, 'Subtotal')
  if (!Number.isInteger(taxRateBps) || taxRateBps < 0 || taxRateBps > 10_000) throw new Error('Tax rate basis points are invalid')
  return Math.floor((subtotalAmount * taxRateBps + 5_000) / 10_000)
}

export function assertCashTender(totalAmount: number, cashReceivedAmount: number) {
  if (!Number.isInteger(totalAmount) || totalAmount < 0 || !Number.isInteger(cashReceivedAmount) || cashReceivedAmount < totalAmount || cashReceivedAmount > 100_000_000) {
    throw new Error('Cash received must be an integer amount at least equal to the order total')
  }
  return { cashReceivedAmount, changeDueAmount: cashReceivedAmount - totalAmount }
}

export function calculateCartTotals(
  items: Array<{ unitPriceAmount: number; quantity: number }>,
  taxAmount = 0,
  deliveryAmount = 0,
) {
  const subtotalAmount = items.reduce((sum, item) => assertMinorUnits(sum + lineAmount(item), 'Subtotal'), 0)
  const safeTax = assertMinorUnits(taxAmount, 'Tax')
  const safeDelivery = assertMinorUnits(deliveryAmount, 'Delivery')
  return {
    subtotalAmount,
    taxAmount: safeTax,
    deliveryAmount: safeDelivery,
    totalAmount: assertMinorUnits(subtotalAmount + safeTax + safeDelivery, 'Total'),
  }
}
