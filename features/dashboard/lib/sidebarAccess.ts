/**
 * Sidebar filtering from capabilities the session already has: the role's
 * canAccessDashboard flag and Keystone's per-session list `isHidden` from admin meta.
 * Plain module: no 'use server' / 'use client', no @/ imports.
 */

type SidebarList = { path: string; isHidden?: boolean | null }
type SidebarRole = { canAccessDashboard?: boolean | null } & Record<string, boolean | null | undefined>
type SidebarUser = { role?: SidebarRole | null } | null | undefined

/**
 * Platform pages whose data queries require a role permission (any one of the listed).
 * Mirrors the checks in features/keystone/mutations/operationalQueries.ts so the sidebar
 * never links a role to a page that can only answer "you do not have permission".
 */
export const PLATFORM_PAGE_PERMISSIONS: Record<string, string[]> = {
  prescriptions: ['canManagePrescriptions', 'canReviewPrescriptions', 'canDispenseMedications'],
  orders: ['canManageOrders'],
  pos: ['canManageOrders'],
  patients: ['canManagePatients', 'canManagePrescriptions'],
  requests: ['canManagePatients', 'canManagePrescriptions'],
  prescribers: ['canManagePrescriptions', 'canReviewPrescriptions', 'canDispenseMedications'],
  inventory: ['canManageInventory', 'canManageRecalls', 'canDispenseMedications'],
  recalls: ['canManageRecalls'],
  credentials: ['canManageUsers', 'canReviewPrescriptions'],
  integrations: ['canManageIntegrations'],
  audit: ['canViewAuditLogs'],
  products: ['canManageCatalog', 'canManageInventory', 'canManageOrders'],
  suppliers: ['canManageInventory'],
  payments: ['canManagePayments'],
  staff: ['canManageUsers'],
}

/** Create and intake screens under a platform page that need a narrower permission than the page itself. */
export const PLATFORM_SUBPAGE_PERMISSIONS: Record<string, string[]> = {
  'prescriptions/intake': ['canManagePrescriptions'],
  'inventory/receive': ['canManageInventory'],
  'recalls/open': ['canManageRecalls'],
  'patients/create': ['canManagePatients'],
}

/** An unknown role is left to the middleware; a known role must hold one of the page's permissions. */
export function canUsePlatformPage(slug: string, user: SidebarUser) {
  const needed = PLATFORM_PAGE_PERMISSIONS[slug] || PLATFORM_SUBPAGE_PERMISSIONS[slug]
  if (!needed || !user?.role) return true
  return needed.some((permission) => user.role?.[permission] === true)
}

/** Only an explicit false hides navigation; an unknown user is left to the middleware. */
export function canUseDashboardNav(user: SidebarUser) {
  return user?.role?.canAccessDashboard !== false
}

export function visibleSidebarLists<T extends SidebarList>(lists: T[], user: SidebarUser): T[] {
  if (!canUseDashboardNav(user)) return []
  return lists.filter((list) => !list.isHidden)
}

/**
 * A platform page whose first segment is a list path follows that list's visibility;
 * pages that are not tied to one list stay visible to dashboard users.
 */
export function visiblePlatformItems<T extends { href: string }>(
  items: T[],
  lists: SidebarList[],
  user: SidebarUser
): T[] {
  if (!canUseDashboardNav(user)) return []
  const hiddenPaths = new Set(lists.filter((list) => list.isHidden).map((list) => list.path))
  return items.filter((item) => {
    const slug = item.href.split('/platform/')[1]?.split(/[/?#]/)[0]
    return !slug || (!hiddenPaths.has(slug) && canUsePlatformPage(slug, user))
  })
}
