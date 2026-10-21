import { list } from '@keystone-6/core'
import { relationship, text } from '@keystone-6/core/fields'

import { permissions } from '../access'
import { permissionFields } from './fields'
import { trackingFields } from './trackingFields'

export const Role = list({
  access: {
    operation: {
      query: ({ session }) =>
        permissions.canManageRoles({ session }) ||
        permissions.canManageUsers({ session }) ||
        permissions.canAccessDashboard({ session }),
      create: permissions.canManageRoles,
      update: permissions.canManageRoles,
      delete: permissions.canManageRoles,
    },
  },
  ui: {
    hideCreate: (args) => !permissions.canManageRoles(args),
    hideDelete: (args) => !permissions.canManageRoles(args),
    isHidden: (args) => !permissions.canManageRoles(args) && !permissions.canManageUsers(args),
    listView: { initialColumns: ['name', 'canAccessDashboard', 'canReviewPrescriptions', 'canDispenseMedications'] },
  },
  fields: {
    name: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    ...permissionFields,
    assignedTo: relationship({ ref: 'User.role', many: true }),
    ...trackingFields,
  },
})
