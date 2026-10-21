import { checkbox } from '@keystone-6/core/fields'

const permission = (label: string) => checkbox({ defaultValue: false, label })

export const permissionFields = {
  canAccessDashboard: permission('Access dashboard'),
  canManageOrganizations: permission('Manage organizations'),
  canManageLocations: permission('Manage pharmacy locations'),
  canManageUsers: permission('Manage users'),
  canManageRoles: permission('Manage roles'),
  canManageCatalog: permission('Manage drug and product catalog'),
  canManageInventory: permission('Manage inventory'),
  canManageRecalls: permission('Manage recalls'),
  canManagePatients: permission('Manage patients'),
  canViewPatientPrivateData: permission('View patient private data'),
  canManagePrescriptions: permission('Manage prescription workflow'),
  canReviewPrescriptions: permission('Record pharmacist reviews'),
  canDispenseMedications: permission('Record dispensing'),
  canManageOrders: permission('Manage POS and online orders'),
  canManagePayments: permission('Manage payments'),
  canManageIntegrations: permission('Manage integrations'),
  canManageOnboarding: permission('Manage onboarding'),
  canViewAuditLogs: permission('View audit logs'),
  canApproveConsequentialActions: permission('Approve consequential actions'),
}

export const permissionsList = Object.keys(permissionFields)
