import type { Context } from '.keystone/types'
import { permissions } from '../../access'
import { DomainError } from './errors'

export const CURRENT_ACTOR_SELECTION = `id tokenVersion role { id name ${Object.keys(permissions).join(' ')} }`

/** Run inside the domain transaction: revocation writers cannot commit ahead of this command. */
export async function assertCurrentTransactionActor(context: Context) {
  const id = context.session?.itemId
  if (!id) return // Guest commands still prove their cart/order token separately.
  await context.prisma.$queryRaw`SELECT id FROM "User" WHERE id = ${id} FOR SHARE`
  await context.prisma.$queryRaw`SELECT id FROM "Role" WHERE id = (SELECT role FROM "User" WHERE id = ${id}) FOR SHARE`
  const actor = await context.sudo().query.User.findOne({ where: { id }, query: CURRENT_ACTOR_SELECTION })
  if (!actor) throw new DomainError('Current actor is unavailable')
  const session = context.session as any
  if (session.tokenVersion !== undefined && Number(session.tokenVersion) !== actor.tokenVersion) throw new DomainError('Current session was revoked')
  for (const permission of Object.keys(permissions)) {
    if (session.data?.role?.[permission] === true && (actor.role as any)?.[permission] !== true) throw new DomainError('Current operator permission was revoked')
  }
}
