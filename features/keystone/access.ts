export type PharmacyRole = {
  id: string
  name: string
  canAccessDashboard?: boolean
  canManageOrganizations?: boolean
  canManageLocations?: boolean
  canManageUsers?: boolean
  canManageRoles?: boolean
  canManageCatalog?: boolean
  canManageInventory?: boolean
  canManageRecalls?: boolean
  canManagePatients?: boolean
  canViewPatientPrivateData?: boolean
  canManagePrescriptions?: boolean
  canReviewPrescriptions?: boolean
  canDispenseMedications?: boolean
  canManageOrders?: boolean
  canManagePayments?: boolean
  canManageIntegrations?: boolean
  canManageOnboarding?: boolean
  canViewAuditLogs?: boolean
  canApproveConsequentialActions?: boolean
}

export type Session = {
  itemId: string
  listKey: string
  data: {
    name: string
    role: PharmacyRole
  }
}

type AccessArgs = { session?: Session }
type AccessFilter = boolean | Record<string, unknown>

const byId = (id: string) => ({ id: { equals: id } })

export function isSignedIn({ session }: AccessArgs) {
  return Boolean(session)
}

export function canChangeOwnPassword({ session, item }: AccessArgs & { item: { id: { toString(): string } } }) {
  // Storefront customers (no role) change their sign-in details only through updateActiveUser, which
  // checks the current password; staff keep the dashboard's own-profile form.
  return Boolean(session && session.itemId === item.id.toString() && session.data?.role)
}

export function canChangeSignInEmail({ session, item }: AccessArgs & { item: { id: { toString(): string } } }) {
  if (!session) return false
  if (session.itemId !== item.id.toString()) return permissions.canManageUsers({ session })
  return Boolean(session.data?.role)
}

export const denyAccess = () => false

function rolePermission(permission: keyof PharmacyRole) {
  return ({ session }: AccessArgs) => session?.data.role?.[permission] === true
}

export const permissions = {
  canAccessDashboard: rolePermission('canAccessDashboard'),
  canManageOrganizations: rolePermission('canManageOrganizations'),
  canManageLocations: rolePermission('canManageLocations'),
  canManageUsers: rolePermission('canManageUsers'),
  canManageRoles: rolePermission('canManageRoles'),
  canManageCatalog: rolePermission('canManageCatalog'),
  canManageInventory: rolePermission('canManageInventory'),
  canManageRecalls: rolePermission('canManageRecalls'),
  canManagePatients: rolePermission('canManagePatients'),
  canViewPatientPrivateData: rolePermission('canViewPatientPrivateData'),
  canManagePrescriptions: rolePermission('canManagePrescriptions'),
  canReviewPrescriptions: rolePermission('canReviewPrescriptions'),
  canDispenseMedications: rolePermission('canDispenseMedications'),
  canManageOrders: rolePermission('canManageOrders'),
  canManagePayments: rolePermission('canManagePayments'),
  canManageIntegrations: rolePermission('canManageIntegrations'),
  canManageOnboarding: rolePermission('canManageOnboarding'),
  canViewAuditLogs: rolePermission('canViewAuditLogs'),
  canApproveConsequentialActions: rolePermission('canApproveConsequentialActions'),
}

function scoped(session: Session | undefined, branches: (userId: string) => Record<string, unknown>[]): AccessFilter {
  if (!session) return false
  return { OR: branches(session.itemId) }
}

const organizationMembershipBranch = (userId: string) => ({
  organization: { memberships: { some: { user: byId(userId), status: { equals: 'active' }, location: null } } },
})

const organizationWidePatientBranch = (userId: string) => ({
  patient: {
    organizations: {
      some: { memberships: { some: { user: byId(userId), status: { equals: 'active' }, location: null } } },
    },
  },
})

const locationMembershipBranch = (userId: string) => ({
  location: {
    OR: [
      { memberships: { some: { user: byId(userId), status: { equals: 'active' } } } },
      { organization: { memberships: { some: { user: byId(userId), status: { equals: 'active' }, location: null } } } },
    ],
  },
})

const legacyOrderPaymentBranch = (userId: string) => ({
  order: { location: { OR: [
    { memberships: { some: { user: byId(userId), status: { equals: 'active' } } } },
    { organization: { memberships: { some: { user: byId(userId), status: { equals: 'active' }, location: null } } } },
  ] } },
})

const sharedOrganizationPeopleBranch = (userId: string) => ({
  memberships: {
    some: {
      status: { equals: 'active' },
      organization: { memberships: { some: { user: byId(userId), status: { equals: 'active' } } } },
    },
  },
})

const sharedOrganizationMembershipBranch = (userId: string) => ({
  organization: { memberships: { some: { user: byId(userId), status: { equals: 'active' } } } },
})

const legacyCartPaymentBranch = (userId: string) => ({
  cart: { location: { OR: [
    { memberships: { some: { user: byId(userId), status: { equals: 'active' } } } },
    { organization: { memberships: { some: { user: byId(userId), status: { equals: 'active' }, location: null } } } },
  ] } },
})

const hasPrivatePatientReadAuthority = (
  session: Session | undefined,
  capabilities: readonly ((args: AccessArgs) => boolean)[],
) => Boolean(session)
  && permissions.canViewPatientPrivateData({ session })
  && capabilities.some((permission) => permission({ session }))

const patientReadCapabilities = [
  permissions.canManagePatients,
  permissions.canManagePrescriptions,
  permissions.canReviewPrescriptions,
  permissions.canDispenseMedications,
  permissions.canManageRecalls,
] as const

const prescriptionReadCapabilities = [
  permissions.canManagePatients,
  permissions.canManagePrescriptions,
  permissions.canReviewPrescriptions,
  permissions.canDispenseMedications,
] as const

const prescriptionLocationMembershipBranch = (userId: string) => ({
  prescription: { location: locationMembershipBranch(userId).location },
})

export const rules = {
  canReadPeople({ session }: AccessArgs): AccessFilter {
    if (!session) return false
    return permissions.canManageUsers({ session })
      ? { OR: [{ id: { equals: session.itemId } }, sharedOrganizationPeopleBranch(session.itemId)] }
      : { id: { equals: session.itemId } }
  },
  canUpdatePeople({ session }: AccessArgs): AccessFilter {
    if (!session) return false
    return permissions.canManageUsers({ session })
      ? { OR: [{ id: { equals: session.itemId } }, sharedOrganizationPeopleBranch(session.itemId)] }
      : { id: { equals: session.itemId } }
  },
  canReadMemberships({ session }: AccessArgs): AccessFilter {
    if (!session) return false
    return permissions.canManageUsers({ session })
      ? { OR: [{ user: byId(session.itemId) }, sharedOrganizationMembershipBranch(session.itemId)] }
      : { user: byId(session.itemId) }
  },
  canReadOrganizations({ session }: AccessArgs): AccessFilter {
    return scoped(session, (userId) => [
      { memberships: { some: { user: byId(userId), status: { equals: 'active' } } } },
    ])
  },
  canReadLocations({ session }: AccessArgs): AccessFilter {
    return scoped(session, (userId) => [
      { memberships: { some: { user: byId(userId), status: { equals: 'active' } } } },
      { organization: { memberships: { some: { user: byId(userId), status: { equals: 'active' }, location: null } } } },
    ])
  },
  canReadOrganizationRecords({ session }: AccessArgs): AccessFilter {
    return scoped(session, (userId) => [organizationMembershipBranch(userId)])
  },
  canReadLocationRecords({ session }: AccessArgs): AccessFilter {
    return scoped(session, (userId) => [locationMembershipBranch(userId)])
  },
  canReadTenantRecords({ session }: AccessArgs): AccessFilter {
    // A location-only membership must not match an organization-wide branch.
    // Location-bound records are covered by locationMembershipBranch, which
    // allows either that exact location or an explicitly organization-wide member.
    return scoped(session, (userId) => [
      organizationMembershipBranch(userId),
      locationMembershipBranch(userId),
    ])
  },
  canReadPatients({ session }: AccessArgs): AccessFilter {
    const staffCanReadPrivate = hasPrivatePatientReadAuthority(session, patientReadCapabilities)
    return scoped(session, (userId) => [
      { user: byId(userId) },
      ...(staffCanReadPrivate ? [{
        organizations: {
          some: { memberships: { some: { user: byId(userId), status: { equals: 'active' }, location: null } } },
        },
      }] : []),
    ])
  },
  canReadPatientChildren({ session }: AccessArgs): AccessFilter {
    const staffCanReadPrivate = hasPrivatePatientReadAuthority(session, patientReadCapabilities)
    return scoped(session, (userId) => [
      { patient: { user: byId(userId) } },
      ...(staffCanReadPrivate ? [organizationWidePatientBranch(userId)] : []),
    ])
  },
  canReadLocationScopedPatientChildren({ session }: AccessArgs): AccessFilter {
    const staffCanReadPrivate = hasPrivatePatientReadAuthority(session, patientReadCapabilities)
    return scoped(session, (userId) => [
      { patient: { user: byId(userId) } },
      ...(staffCanReadPrivate ? [locationMembershipBranch(userId)] : []),
    ])
  },
  canReadPrescriptionRecords({ session }: AccessArgs): AccessFilter {
    const staffCanReadPrivate = hasPrivatePatientReadAuthority(session, prescriptionReadCapabilities)
    return scoped(session, (userId) => [
      { patient: { user: byId(userId) } },
      ...(staffCanReadPrivate ? [locationMembershipBranch(userId)] : []),
    ])
  },
  canReadPrescriptionChildren({ session }: AccessArgs): AccessFilter {
    const staffCanReadPrivate = hasPrivatePatientReadAuthority(session, prescriptionReadCapabilities)
    return scoped(session, (userId) => [
      { prescription: { patient: { user: byId(userId) } } },
      ...(staffCanReadPrivate ? [prescriptionLocationMembershipBranch(userId)] : []),
    ])
  },
  canReadOrders({ session }: AccessArgs): AccessFilter {
    return scoped(session, (userId) => [
      { customer: byId(userId) },
      locationMembershipBranch(userId),
    ])
  },
  canReadCartItems({ session }: AccessArgs): AccessFilter {
    return scoped(session, (userId) => [
      { cart: { customer: byId(userId) } },
      { cart: organizationMembershipBranch(userId) },
      { cart: locationMembershipBranch(userId) },
    ])
  },
  canReadOrderLineItems({ session }: AccessArgs): AccessFilter {
    return scoped(session, (userId) => [
      { order: { customer: byId(userId) } },
      { order: organizationMembershipBranch(userId) },
      { order: locationMembershipBranch(userId) },
    ])
  },
  canReadPayments({ session }: AccessArgs): AccessFilter {
    return scoped(session, (userId) => [locationMembershipBranch(userId), legacyOrderPaymentBranch(userId)])
  },
  canReadPaymentSessions({ session }: AccessArgs): AccessFilter {
    return scoped(session, (userId) => [locationMembershipBranch(userId), legacyCartPaymentBranch(userId)])
  },
}
