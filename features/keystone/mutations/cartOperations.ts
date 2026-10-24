import type { Context } from '.keystone/types'
import { permissions } from '../access'
import { createGuestCartToken, hashGuestCartToken } from '../security/cart-token'
import { assertProductCanEnterPublicCart } from '../workflows/commerce-policy'
import { eligibleLotQuantity } from '../workflows/lot-eligibility'
import { loadAndAssertCartAccess } from './lib/cartAccess'
import { requireTenantMembership } from './lib/authorization'
import { withDomainTransaction } from './lib/transaction'
import { loadPublicTenant } from './publicQueries'
import { DomainError } from './lib/errors'

const CART_QUERY = `
  id status fulfillmentMethod subtotalAmount taxAmount deliveryAmount totalAmount expiresAt
  organization { id name }
  location { id name pickupEnabled deliveryEnabled }
  customer { id }
  items {
    id quantity unitPriceAmount
    product { id title handle sku description category priceAmount currencyCode imageUrl prescriptionRequirement }
  }
`

async function cartResponse(context: Context, cartId: string) {
  return context.sudo().query.Cart.findOne({ where: { id: cartId }, query: CART_QUERY })
}

export async function createPharmacyCart(
  _root: unknown,
  args: { locationId: string; tenantKey?: string | null },
  context: Context,
) {
  const location = await context.sudo().query.PharmacyLocation.findOne({
    where: { id: args.locationId },
    query: 'id status onlineOrderingEnabled pickupEnabled deliveryEnabled organization { id slug storefrontKey storefrontHost }',
  })
  const staffPos = permissions.canManageOrders({ session: context.session as any })
  if (!location || location.status !== 'active' || (!location.onlineOrderingEnabled && !staffPos)) throw new DomainError('Location is not accepting orders')
  if (staffPos) await requireTenantMembership(context, { organizationId: location.organization.id, locationId: location.id })
  if (!staffPos) {
    const organization = await loadPublicTenant(context, args.tenantKey)
    if (organization.id !== location.organization.id) throw new DomainError('This location is not available')
    if (location.pickupEnabled !== true && location.deliveryEnabled !== true) throw new DomainError('Location is not accepting orders')
  }

  const guestToken = context.session?.itemId ? null : createGuestCartToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const cart = await context.sudo().query.Cart.createOne({
    data: {
      organization: { connect: { id: location.organization.id } },
      location: { connect: { id: location.id } },
      customer: context.session?.itemId ? { connect: { id: context.session.itemId } } : undefined,
      guestTokenHash: guestToken ? hashGuestCartToken(guestToken) : undefined,
      expiresAt,
    },
    query: CART_QUERY,
  })
  return { cart, guestToken }
}

export async function pharmacyCart(
  _root: unknown,
  args: { cartId: string; guestToken?: string | null },
  context: Context,
) {
  const cart = await loadAndAssertCartAccess(context, args.cartId, args.guestToken)
  return cartResponse(context, cart.id)
}

export async function addPharmacyCartItem(
  _root: unknown,
  args: { cartId: string; productId: string; quantity: number; guestToken?: string | null },
  context: Context,
) {
  if (!Number.isInteger(args.quantity) || args.quantity < 1 || args.quantity > 99) throw new DomainError('Quantity must be between 1 and 99')
  return withDomainTransaction(context, [`cart:${args.cartId}`], async (transactionContext) => {
    const cart = await loadAndAssertCartAccess(transactionContext, args.cartId, args.guestToken)
    const product = await transactionContext.sudo().query.Product.findOne({
      where: { id: args.productId },
      query: 'id status onlineAvailable prescriptionRequirement priceAmount location { id } inventoryLots { status expirationDate quantityAvailable quantityQuarantined coldChainRequired coldChainEvidenceComplete recalls { status } location { id } }',
    })
    if (!product || product.location?.id !== cart.location.id) throw new DomainError('Product is not available at this location')
    assertProductCanEnterPublicCart(product)

    const existing = cart.items.find((item: any) => item.product?.id === product.id)
    const requestedQuantity = (existing?.quantity || 0) + args.quantity
    const availableQuantity = (product.inventoryLots || [])
      .filter((lot: any) => lot.location?.id === cart.location.id)
      .reduce((sum: number, lot: any) => sum + eligibleLotQuantity(lot), 0)
    if (requestedQuantity > availableQuantity) throw new DomainError('Requested quantity is not available from eligible inventory')
    if (existing) {
      const quantity = requestedQuantity
      if (quantity > 99) throw new DomainError('Quantity must be between 1 and 99')
      await transactionContext.sudo().query.CartItem.updateOne({ where: { id: existing.id }, data: { quantity } })
    } else {
      await transactionContext.sudo().query.CartItem.createOne({
        data: {
          cart: { connect: { id: cart.id } },
          product: { connect: { id: product.id } },
          quantity: args.quantity,
        },
      })
    }
    return cartResponse(transactionContext, cart.id)
  })
}

export async function updatePharmacyCartItem(
  _root: unknown,
  args: { cartItemId: string; quantity: number; guestToken?: string | null },
  context: Context,
) {
  const item = await context.sudo().query.CartItem.findOne({ where: { id: args.cartItemId }, query: 'id cart { id }' })
  if (!item?.cart) throw new DomainError('Cart item not found')
  if (!Number.isInteger(args.quantity) || args.quantity < 0 || args.quantity > 99) throw new DomainError('Quantity must be between 0 and 99')
  return withDomainTransaction(context, [`cart:${item.cart.id}`], async (transactionContext) => {
    const cart = await loadAndAssertCartAccess(transactionContext, item.cart.id, args.guestToken)
    const current = await transactionContext.sudo().query.CartItem.findOne({ where: { id: args.cartItemId }, query: 'id cart { id } product { inventoryLots { status expirationDate quantityAvailable quantityQuarantined coldChainRequired coldChainEvidenceComplete recalls { status } location { id } } }' })
    if (!current || current.cart?.id !== cart.id) throw new DomainError('Cart item not found')
    if (args.quantity > 0) {
      const availableQuantity = (current.product?.inventoryLots || [])
        .filter((lot: any) => lot.location?.id === cart.location.id)
        .reduce((sum: number, lot: any) => sum + eligibleLotQuantity(lot), 0)
      if (args.quantity > availableQuantity) throw new DomainError('Requested quantity is not available from eligible inventory')
    }
    if (args.quantity === 0) await transactionContext.sudo().query.CartItem.deleteOne({ where: { id: current.id } })
    else await transactionContext.sudo().query.CartItem.updateOne({ where: { id: current.id }, data: { quantity: args.quantity } })
    return cartResponse(transactionContext, cart.id)
  })
}

export async function removePharmacyCartItem(
  root: unknown,
  args: { cartItemId: string; guestToken?: string | null },
  context: Context,
) {
  return updatePharmacyCartItem(root, { ...args, quantity: 0 }, context)
}
