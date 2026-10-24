import type { Context } from '.keystone/types'
import { verifyGuestCartToken } from '../security/cart-token'
import { DomainError } from './lib/errors'

export async function getGuestPharmacyOrder(
  _root: unknown,
  args: { orderId: string; guestOrderToken: string },
  context: Context,
) {
  if (!args.guestOrderToken?.trim()) throw new DomainError('Guest order token is required')
  const order = await context.sudo().query.Order.findOne({
    where: { id: args.orderId },
    query: GUEST_ORDER_QUERY,
  })
  if (!order?.guestTokenHash || !verifyGuestCartToken(args.guestOrderToken, order.guestTokenHash)) throw new DomainError('Guest order not found')
  return guestOrderProjection(order)
}

/**
 * Order lookup with what the customer has: the order number from the confirmation and the email used at
 * checkout. Returns null for any mismatch, so it never reveals whether an order number exists.
 */
export async function lookupPharmacyOrder(_root: unknown, args: { orderNumber: string; email: string }, context: Context) {
  const orderNumber = args.orderNumber?.trim().toUpperCase()
  const email = args.email?.trim().toLowerCase()
  if (!orderNumber || !email || orderNumber.length > 64 || email.length > 254) return null
  const order = await context.sudo().query.Order.findOne({ where: { orderNumber }, query: `email ${GUEST_ORDER_QUERY}` }).catch(() => null)
  if (!order?.email || order.email.trim().toLowerCase() !== email) return null
  return guestOrderProjection(order)
}

export const GUEST_ORDER_QUERY = `
      id orderNumber guestTokenHash status fulfillmentMethod subtotalAmount taxAmount deliveryAmount totalAmount currencyCode pickupAt deliveryWindow createdAt
      location { name timezone }
      lineItems { id title sku quantity unitPriceAmount lineTotalAmount imageUrl prescriptionRequirementSnapshot }
      fulfillment { method status readyAt handedOffAt }
    `

export function guestOrderProjection(order: any) {
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
    locationTimezone: order.location?.timezone || 'America/New_York',
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
