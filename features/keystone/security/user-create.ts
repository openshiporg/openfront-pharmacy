import { permissions } from '../access'
import { permissionsList } from '../models/fields'

export const canCreateUserRole = permissions.canManageUsers

const PUBLIC_USER_CREATE_FIELDS = new Set([
  'name',
  'email',
  'password',
  // createAuth merges initFirstItem.itemData into the DB API input before list
  // hooks run. Public callers cannot supply role because User.role field access
  // is enforced before resolveInput; allowing it here preserves the first admin.
  'role',
])

type UserCreateData = Record<string, unknown>

/**
 * Restrict fields supplied by an unauthenticated/non-manager caller without
 * deleting values added by Keystone field defaults or initFirstItem.itemData.
 */
export function resolvePublicUserCreateData({
  inputData,
  resolvedData,
}: {
  inputData?: UserCreateData
  resolvedData: UserCreateData
}): UserCreateData {
  const restrictedData = { ...resolvedData }

  // inputData is the caller-controlled boundary. resolvedData also contains
  // trusted field defaults and createAuth initFirstItem data (including the
  // first administrator's role), so iterating all resolved keys is unsafe.
  for (const key of Object.keys(inputData ?? {})) {
    if (!PUBLIC_USER_CREATE_FIELDS.has(key)) {
      delete restrictedData[key]
    }
  }

  return restrictedData
}

/**
 * The first user is the install's administrator. Their Admin role is upserted by name with an
 * explicitly selected id and connected, instead of through initFirstItem's nested `role.create`,
 * which reached Prisma in production as `role.connect.id = undefined` and blocked setup (QA-001).
 * Returns null once any user exists, so later sign-ups never receive the Admin role.
 */
export async function firstUserAdminRoleId(context: any): Promise<string | null> {
  const prisma = context.sudo().prisma
  if ((await prisma.user.count()) > 0) return null
  const grants = Object.fromEntries(permissionsList.map((permission) => [permission, true]))
  const upserted = await prisma.role.upsert({ where: { name: 'Admin' }, create: { name: 'Admin', ...grants }, update: grants, select: { id: true } })
  const roleId = upserted?.id ?? (await prisma.role.findUnique({ where: { name: 'Admin' }, select: { id: true } }))?.id
  if (!roleId) throw new Error('The Admin role could not be created.')
  return String(roleId)
}
