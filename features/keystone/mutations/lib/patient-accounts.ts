import type { Context } from '.keystone/types'

/**
 * Accounts that may be linked to a patient of these organizations: staff with an active membership,
 * storefront customers who sent the pharmacy an online request, and the account using the patient's email.
 */
export async function patientAccountWhere(context: Context, organizationIds: string[], patientEmail?: string | null) {
  const requests = await context.sudo().query.PrescriptionRequest.findMany({
    where: { organization: { id: { in: organizationIds } } },
    orderBy: { createdAt: 'desc' },
    take: 500,
    query: 'user { id }',
  })
  const requesterIds = [...new Set(requests.map((request: any) => request.user?.id).filter(Boolean))] as string[]
  const email = patientEmail?.trim()
  return {
    OR: [
      { memberships: { some: { status: { equals: 'active' }, organization: { id: { in: organizationIds } } } } },
      ...(requesterIds.length ? [{ id: { in: requesterIds } }] : []),
      ...(email ? [{ email: { equals: email, mode: 'insensitive' } }] : []),
    ],
  } as any
}
