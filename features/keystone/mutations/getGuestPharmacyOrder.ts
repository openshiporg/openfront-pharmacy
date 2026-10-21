import type { Context } from '.keystone/types'
import { verifyGuestCartToken } from '../security/cart-token'

export async function getGuestPharmacyOrder(
  _root: unknown,
  args: { orderId: string; guestOrderToken: string },
  context: Context,
) {
  if (!args.guestOrderToken?.trim()) throw new Error('Guest order token is required')
  const order = await context.sudo().query.Order.findOne({
    where: { id: args.orderId },
    query: `
      id orderNumber guestTokenHash status fulfillmentMethod subtotalAmount taxAmount deliveryAmount totalAmount currencyCode pickupAt deliveryWindow createdAt
      location { name }
      lineItems { id title sku quantity unitPriceAmount lineTotalAmount imageUrl prescriptionRequirementSnapshot }
      fulfillment { method status readyAt handedOffAt }
    `,
  })
  if (!order?.guestTokenHash || !verifyGuestCartToken(args.guestOrderToken, order.guestTokenHash)) throw new Error('Guest order not found')
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    fulfillmentMethod: order.fulfillmentMethod,
    subtotalAmount: order.subtotalAmount,
    taxAmount: order.taxAmount,
    deliveryAmount: order.deliveryAmount,
    totalAmount: order.totalAmount,
    currencyCode: order.currencyCode,
    pickupAt: order.pickupAt,
    deliveryWindow: order.deliveryWindow,
    createdAt: order.createdAt,
    locationName: order.location?.name || 'Pharmacy',
    lines: (order.lineItems || []).map((line: any) => ({
      id: line.id,
      title: line.title,
      sku: line.sku,
      quantity: line.quantity,
      unitPriceAmount: line.unitPriceAmount,
      lineTotalAmount: line.lineTotalAmount,
      imageUrl: line.imageUrl,
      prescriptionRequirement: line.prescriptionRequirementSnapshot,
    })),
    fulfillment: order.fulfillment ? {
      method: order.fulfillment.method,
      status: order.fulfillment.status,
      readyAt: order.fulfillment.readyAt,
      handedOffAt: order.fulfillment.handedOffAt,
    } : null,
  }
}
