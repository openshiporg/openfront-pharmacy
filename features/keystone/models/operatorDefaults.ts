/**
 * Create forms in the admin do not ask staff which organization (or, for a single-location pharmacy,
 * which location) a new record belongs to: the signed-in operator's active membership answers it.
 * The list's own validation hooks still check the result, so this only fills a blank, never widens access.
 */

/** Hide a field on the create form (it is set by the server or by a later workflow). */
export const notOnCreate = { createView: { fieldMode: 'hidden' as const } }

export async function operatorOrganizationId(context: any): Promise<string | null> {
  const userId = context.session?.itemId
  if (!userId) return null
  const memberships = await context.sudo().query.OrganizationMembership.findMany({
    where: { user: { id: { equals: userId } }, status: { equals: 'active' } },
    take: 10,
    query: 'organization { id }',
  })
  const ids = [...new Set(memberships.map((m: any) => m.organization?.id).filter(Boolean))] as string[]
  return ids.length === 1 ? ids[0] : null
}

/** Fill `organization` (and `location` when asked and the organization has exactly one) on create. */
export async function withOperatorScope(resolvedData: any, context: any, opts: { location?: boolean } = {}) {
  let next = resolvedData
  let organizationId = resolvedData.organization?.connect?.id
  if (!organizationId) {
    organizationId = await operatorOrganizationId(context)
    if (organizationId) next = { ...next, organization: { connect: { id: organizationId } } }
  }
  if (opts.location && organizationId && !resolvedData.location?.connect?.id) {
    const locations = await context.sudo().query.PharmacyLocation.findMany({ where: { organization: { id: { equals: organizationId } } }, take: 2, query: 'id' })
    if (locations.length === 1) next = { ...next, location: { connect: { id: locations[0].id } } }
  }
  return next
}
