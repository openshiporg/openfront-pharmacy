import { notFound } from 'next/navigation'

import { getAuthenticatedUser } from '@/features/dashboard/actions/auth'
import { canUsePlatformPage } from '@/features/dashboard/lib/sidebarAccess'

/** A role without the page's permission gets a real 404, the same as a missing record. */
export async function requirePlatformPage(slug: string) {
  const me = await getAuthenticatedUser()
  if (!canUsePlatformPage(slug, me.success ? me.data?.authenticatedItem : null)) notFound()
}
