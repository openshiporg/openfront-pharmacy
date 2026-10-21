import { calculateCartTotals } from '../workflows/commerce-policy'

export function affectedCartIds(operation: string, item: any, originalItem?: any) {
  const ids = new Set<string>()
  const currentId = item?.cartId || item?.cart?.id
  const originalId = originalItem?.cartId || originalItem?.cart?.id
  if (currentId) ids.add(currentId)
  if ((operation === 'update' || operation === 'delete') && originalId) ids.add(originalId)
  return [...ids].sort()
}

export async function recalculateCartSnapshot(context: any, cartId: string) {
  const sudo = context.sudo()
  const cart = await sudo.query.Cart.findOne({
    where: { id: cartId },
    query: 'id deliveryAmount items { quantity unitPriceAmount }',
  })
  if (!cart) return
  const totals = calculateCartTotals(cart.items, 0, cart.deliveryAmount || 0)
  await sudo.db.Cart.updateOne({ where: { id: cart.id }, data: totals })
}

async function resolveCartAndProduct(context: any, operation: string, resolvedData: any, item: any) {
  const cartId = resolvedData.cart?.connect?.id || item?.cartId
  const productId = resolvedData.product?.connect?.id || item?.productId
  if (!cartId || !productId) return { cart: null, product: null }
  const sudo = context.sudo()
  const [cart, product] = await Promise.all([
    sudo.query.Cart.findOne({ where: { id: cartId }, query: 'id status location { id }' }),
    sudo.query.Product.findOne({ where: { id: productId }, query: 'id status onlineAvailable prescriptionRequirement priceAmount location { id }' }),
  ])
  return { cart, product }
}

export const cartItemHooks = {
  async resolveInput({ operation, resolvedData, item, context }: any) {
    if (operation === 'delete') return resolvedData
    const { product } = await resolveCartAndProduct(context, operation, resolvedData, item)
    return product ? { ...resolvedData, unitPriceAmount: product.priceAmount } : resolvedData
  },
  async validateInput({ operation, resolvedData, item, context, addValidationError }: any) {
    if (operation === 'delete') return
    const { cart, product } = await resolveCartAndProduct(context, operation, resolvedData, item)
    if (!cart || !product) return addValidationError('Cart item requires an existing cart and product')
    if (cart.status !== 'active') addValidationError('Cart items can only change while the cart is active')
    if (cart.location?.id !== product.location?.id) addValidationError('Cart and product must belong to the same location')
    if (product.status !== 'published' || !product.onlineAvailable || product.prescriptionRequirement !== 'none') {
      addValidationError('Only published OTC products can enter this cart')
    }
  },
  async beforeOperation({ operation, resolvedData, item, context }: any) {
    const cartId = resolvedData?.cart?.connect?.id || item?.cartId
    if (cartId) {
      await context.sudo().prisma.$queryRaw`SELECT 1 AS "locked" FROM pg_advisory_xact_lock(hashtext(${`pharmacy:cart:${cartId}`}))`
    }
    if (operation === 'delete' && item?.cartId) {
      const cart = await context.sudo().query.Cart.findOne({ where: { id: item.cartId }, query: 'status' })
      if (cart?.status !== 'active') throw new Error('Cart items can only change while the cart is active')
    }
  },
  async afterOperation({ operation, item, originalItem, context }: any) {
    for (const cartId of affectedCartIds(operation, item, originalItem)) {
      await recalculateCartSnapshot(context, cartId)
    }
  },
}
