import type { Context } from '.keystone/types'
import { verifyGuestCartToken } from '../../security/cart-token'
import { verifyGuestOrderToken } from '../../security/order-token'

export async function loadAndAssertCartAccess(
  context: Context,
  cartId: string,
  guestToken?: string | null,
  options: { allowSubmitted?: boolean } = {},
) {
  const cart = await context.sudo().query.Cart.findOne({
    where: { id: cartId },
    query: `
      id status guestTokenHash expiresAt fulfillmentMethod
      subtotalAmount taxAmount deliveryAmount totalAmount
      organization { id }
      location { id onlineOrderingEnabled deliveryEnabled pickupEnabled }
      customer { id }
      items {
        id quantity unitPriceAmount
        product {
          id title sku handle status onlineAvailable prescriptionRequirement
          priceAmount currencyCode taxable imageUrl
          drugReference { ndc11 }
        }
      }
      paymentSessions { id amount status externalPaymentId reconciliationStatus data isSelected provider { id code isInstalled organization { id } } }
      order { id orderNumber idempotencyKey status totalAmount currencyCode fulfillment { status } }
    `,
  })
  if (!cart || (cart.status !== 'active' && !(options.allowSubmitted && cart.status === 'submitted'))) throw new Error('Active cart not found')
  if (cart.expiresAt && new Date(cart.expiresAt).getTime() <= Date.now()) throw new Error('Cart has expired')

  const userId = context.session?.itemId
  if (userId) {
    if (cart.customer?.id !== userId) throw new Error('You do not have access to this cart')
  } else {
    const validCartToken = Boolean(guestToken && !cart.customer && cart.guestTokenHash && verifyGuestCartToken(guestToken, cart.guestTokenHash))
    const validReplayToken = Boolean(
      options.allowSubmitted && cart.status === 'submitted' && guestToken && cart.order?.idempotencyKey
      && verifyGuestOrderToken(cart.id, cart.order.idempotencyKey, guestToken),
    )
    if (!validCartToken && !validReplayToken) throw new Error('You do not have access to this cart')
  }
  return cart
}
