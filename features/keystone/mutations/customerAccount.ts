import { GraphQLError } from 'graphql'
import type { Context } from '.keystone/types'
import { GUEST_ORDER_QUERY, guestOrderProjection } from './getGuestPharmacyOrder'

function userInputError(message: string) {
  return new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT' } })
}

export async function registerPharmacyCustomer(_root: unknown, args: { name: string; email: string; password: string }, context: Context) {
  if (context.session?.itemId) throw userInputError('Sign out before creating another account')
  const name = args.name.trim()
  const email = args.email.trim().toLowerCase()
  if (!name || name.length > 120 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw userInputError('Enter a valid name and email')
  if (args.password.length < 12) throw userInputError('Password must be at least 12 characters')
  // Initial owner must be provisioned through createInitialUser, never this path.
  const sudo = context.sudo()
  if (await sudo.query.User.count() === 0) throw userInputError('This store is not open for accounts yet')
  if (await sudo.query.User.count({ where: { email: { equals: email } } })) throw userInputError('An account with this email already exists. Sign in instead.')
  await sudo.query.User.createOne({ data: { name, email, password: args.password, onboardingStatus: 'dismissed' }, query: 'id' })
  return true
}

export async function pharmacyCustomerOrder(_root: unknown, args: { orderId: string }, context: Context) {
  const userId = context.session?.itemId
  if (!userId || context.session?.listKey !== 'User') throw new Error('Authentication required')
  const [order] = await context.query.Order.findMany({ where: { id: { equals: args.orderId }, customer: { id: { equals: userId } } }, take: 1, query: 'id orderNumber status totalAmount currencyCode createdAt lineItems { title quantity unitPriceAmount }' })
  if (!order) throw new Error('Order not found')
  return order
}

/** The signed-in customer's own order with the same detail as order tracking. Ownership is checked with a scoped read. */
export async function pharmacyCustomerOrderDetails(_root: unknown, args: { orderId: string }, context: Context) {
  const userId = context.session?.itemId
  if (!userId || context.session?.listKey !== 'User') throw new Error('Authentication required')
  const [owned] = await context.query.Order.findMany({ where: { id: { equals: args.orderId }, customer: { id: { equals: userId } } }, take: 1, query: 'id' })
  if (!owned) throw new Error('Order not found')
  const order = await context.sudo().query.Order.findOne({ where: { id: owned.id }, query: GUEST_ORDER_QUERY })
  if (!order) throw new Error('Order not found')
  return guestOrderProjection(order)
}

export async function pharmacyCustomerAccount(_root: unknown, _args: unknown, context: Context) {
  const userId = context.session?.itemId
  if (!userId || context.session?.listKey !== 'User') throw new Error('Authentication required')
  // Normal scoped reads, no sudo and no email-based historical claiming.
  const user = await context.query.User.findOne({ where: { id: userId }, query: 'id name patientProfile { id }' })
  if (!user) throw new Error('Account not found')
  const orders = await context.query.Order.findMany({ where: { customer: { id: { equals: userId } } }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 50, query: 'id orderNumber status totalAmount currencyCode createdAt lineItems { title quantity unitPriceAmount }' })
  return { id: user.id, name: user.name, hasPatientProfile: Boolean(user.patientProfile?.id), orders }
}
