import { cache } from 'react'
import { notFound } from 'next/navigation'

import { getAuthenticatedUser } from '@/features/dashboard/actions/auth'
import { canUsePlatformPage } from '@/features/dashboard/lib/sidebarAccess'

/** A role without the page's permission gets a real 404, the same as a missing record. */
export async function requirePlatformPage(slug: string) {
  const me = await getAuthenticatedUser()
  if (!canUsePlatformPage(slug, me.success ? me.data?.authenticatedItem : null)) notFound()
}

const currentUser = cache(() => getAuthenticatedUser())

/** Whether the signed-in role holds a permission; pages use it to hide actions the server would refuse. */
export async function roleCan(...permissions: string[]) {
  const me = await currentUser()
  const role = me.success ? me.data?.authenticatedItem?.role : null
  return Boolean(role && permissions.some((permission) => role[permission] === true))
}
