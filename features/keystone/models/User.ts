import { list } from '@keystone-6/core'
import { denyAll } from '@keystone-6/core/access'
import { integer, password, relationship, select, text } from '@keystone-6/core/fields'

import { canChangeOwnPassword, isSignedIn, permissions, rules } from '../access'
import { nextSessionTokenVersion } from '../session-revocation'
import { canCreateUserRole, resolvePublicUserCreateData } from '../security/user-create'
import { immutableRelationship } from './immutableRelationship'
import { trackingFields } from './trackingFields'

export const User = list({
  access: {
    operation: {
      query: isSignedIn,
      create: () => true,
      update: isSignedIn,
      delete: denyAll,
    },
    filter: { query: rules.canReadPeople, update: rules.canUpdatePeople },
  },
  hooks: {
    resolveInput: ({ operation, inputData, resolvedData, item, context }) => {
      let data = resolvedData
      if (operation === 'create' && !permissions.canManageUsers({ session: context.session as any })) {
        data = resolvePublicUserCreateData({ inputData, resolvedData }) as typeof resolvedData
      }
      const nextTokenVersion = nextSessionTokenVersion(operation, data.password, item?.tokenVersion)
      return nextTokenVersion !== undefined ? { ...data, tokenVersion: nextTokenVersion } : data
    },
  },
  ui: {
    hideCreate: (args) => !permissions.canManageUsers(args as any),
    hideDelete: true,
    listView: { initialColumns: ['name', 'email', 'role', 'onboardingStatus'] },
  },
  fields: {
    name: text({ validation: { isRequired: true } }),
    email: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    password: password({
      validation: { isRequired: true, length: { min: 12, max: 1000 }, rejectCommon: true },
      access: {
        read: denyAll,
        update: canChangeOwnPassword,
      },
    }),
    role: relationship({
      ref: 'Role.assignedTo',
      access: {
        create: canCreateUserRole,
        // Role managers may change any role; user managers may assign roles to other users only.
        update: ({ session, item }: any) => permissions.canManageRoles({ session })
          || (permissions.canManageUsers({ session }) && String(item?.id) !== session?.itemId),
      },
      ui: {
        itemView: { fieldMode: (args: any) => permissions.canManageUsers(args) ? 'edit' : 'read' },
      },
    }),
    tokenVersion: integer({ defaultValue: 0, access: { create: denyAll, update: denyAll }, ui: { itemView: { fieldMode: 'hidden' }, createView: { fieldMode: 'hidden' } } }),
    onboardingStatus: select({
      type: 'string',
      options: [
        { label: 'Not started', value: 'not_started' },
        { label: 'In progress', value: 'in_progress' },
        { label: 'Completed', value: 'completed' },
        { label: 'Dismissed', value: 'dismissed' },
      ],
      defaultValue: 'not_started',
    }),
    memberships: relationship({ ref: 'OrganizationMembership.user', many: true, access: immutableRelationship }),
    patientProfile: relationship({ ref: 'PatientProfile.user', access: immutableRelationship }),
    carts: relationship({ ref: 'Cart.customer', many: true, access: immutableRelationship }),
    orders: relationship({ ref: 'Order.customer', many: true, access: immutableRelationship }),
    prescriptionReviews: relationship({ ref: 'PrescriptionReview.pharmacist', many: true, access: immutableRelationship }),
    humanApprovals: relationship({ ref: 'HumanApproval.actor', many: true, access: immutableRelationship }),
    auditEvents: relationship({ ref: 'AuditEvent.actor', many: true, access: immutableRelationship }),
    createdMachineCredentials: relationship({ ref: 'MachineCredential.createdBy', many: true, access: immutableRelationship }),
    ...trackingFields,
  },
})
